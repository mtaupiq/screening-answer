# Basic Questions

Imagine you're building a website that allows users to submit photos. One of the requirements is that each photo must be reviewed by a moderator before it can be published. How would you design the logic for this process? What technologies would you use? Do you have any data structure in mind to support this based on your technology of choice to handle those data?

---

## 1. System Architecture & Workflow Logic

To scale photo moderation to millions of daily uploads without slowing down end users or overloading human reviewers, the system decouples **synchronous client API interactions** from **asynchronous background processing**.

### Architectural Overview

```text
[ Client App / Web ]
      │ (1. Request Presigned URL)
      ▼
[ API Gateway / Backend ] ──(Insert PENDING_UPLOAD)──► [ PostgreSQL DB ]
      │ (2. Presigned URL + Photo ID)
      ▼
[ Object Storage (S3/R2) ] ◄──(3. Direct Binary Upload)─── [ Client ]
      │ (4. S3 Event / API Complete Signal)
      ▼
[ Event Bus / Redis Stream ] ──(Update PENDING_REVIEW)
      │
      ├─► [ AI Pre-Filter Worker ] ──(High Confidence Auto Decision)──► [ DB / CDN ]
      │         │
      │         │ (Borderline / Low Confidence)
      │         ▼
      └─► [ Moderator Task Queue ]
                │
                ▼
          [ Moderator Dashboard ] ──(Manual Decision)──► [ DB / Audit Logs ]
```

---

### A. State Machine & Lifecycle Transitions

Every photo record transitions through a strict, deterministic state machine. Database constraints and API layer validations enforce state safety, preventing invalid transitions (e.g., reverting an `APPROVED` photo back to `PENDING_UPLOAD`).

```text
                  ┌──────────────────┐
                  │  PENDING_UPLOAD  │
                  └────────┬─────────┘
                           │ (Upload Complete / Verified)
                           ▼
                  ┌──────────────────┐
                  │  PENDING_REVIEW  │
                  └────────┬─────────┘
                           │ (Claimed by Worker / Moderator)
                           ▼
                  ┌──────────────────┐
                  │    IN_REVIEW     │
                  └─┬──────┬───────┬─┘
                    │      │       │
    ┌───────────────┘      │       └────────────────┐
    ▼                      ▼                        ▼
┌──────────┐         ┌──────────┐         ┌──────────────────┐
│ APPROVED │         │ REJECTED │         │    ESCALATED     │
└──────────┘         └──────────┘         └──────────────────┘
```

#### State Definitions

1. **`PENDING_UPLOAD`**: Initial placeholder state. Created when a client requests an upload intent. Indicates that a pre-signed URL has been issued, but object storage binary upload is unverified.
2. **`PENDING_REVIEW`**: The raw image is verified in object storage. The photo is enqueued for evaluation (AI automated pre-filtering or human review queue).
3. **`IN_REVIEW`**: The photo has been claimed by an automated worker node or a human moderator. An active distributed lock is held to prevent concurrent processing.
4. **`APPROVED`**: The photo passes safety and policy checks. Public access is granted, image optimization pipeline runs, and CDN edge caching is enabled.
5. **`REJECTED`**: The photo violates community guidelines. Access is denied to public endpoints, and a lifecycle purge/quarantine job is queued.
6. **`ESCALATED`**: The photo contains ambiguous or legally sensitive content requiring escalation to senior compliance teams or specialized manual review.

---

### B. Detailed Workflow Steps

#### Step 1: Upload Intent & Pre-signed URL Generation (Synchronous)

1. The client issues a request to `POST /v1/photos/upload-intent` with payload metadata (file name, MIME type, file size, client checksum).
2. **API Layer Validations:**
   * Validates MIME type (`image/jpeg`, `image/png`, `image/webp`).
   * Enforces file size limits (e.g., max 15MB).
   * Checks rate limiting (e.g., max 10 requests per minute per user/IP).
3. **Database Insertion:** Inserts a row into `photos` with status `PENDING_UPLOAD` and an expiration timestamp (15-minute window).
4. **Pre-signed URL Signer:** Generates a temporary S3 `PUT` pre-signed URL pointing to a private isolated bucket path: `raw_uploads/{user_id}/{photo_id}.bin`.
5. **Response:** Returns `photo_id`, `upload_url`, required headers, and expiration metadata to the client.

#### Step 2: Direct Storage Upload & Event Ingestion (Asynchronous)

1. The client performs an HTTP `PUT` request directly to the object storage endpoint, transferring the binary payload without touching backend application servers.
2. **Completion Verification (Dual Strategy):**
   * **Primary Path (Client Ack):** Upon receiving HTTP 200 from object storage, the client calls `POST /v1/photos/{photo_id}/complete`. Backend executes a lightweight `HEAD` request against object storage to verify payload presence and byte size.
   * **Fallback Path (Storage Event):** If the client drops network connection post-upload, an S3 `s3:ObjectCreated:*` event fires to a Webhook / EventBridge worker to update the record status.
3. The backend updates the database record from `PENDING_UPLOAD` to `PENDING_REVIEW` and emits a `photo.uploaded` payload to the message broker (Redis Stream / NATS / RabbitMQ).

#### Step 3: Automated Pre-Filtering Workers (AI Processing Phase)

A dedicated consumer pool processes incoming `photo.uploaded` events:

1. **Perceptual Hashing (pHash):** Computes an image hash (e.g., Difference Hash or DCT-based hash) and checks against a Redis/Milvus vector database of known CSAM, illegal content, or duplicate spam.
   * *Match Found:* Instant update to `REJECTED` or `ESCALATED`.
2. **Computer Vision & Classification API:**
   * Invokes machine learning vision models (e.g., AWS Rekognition, Google Cloud Vision, or self-hosted OpenNSFW / CLIP models).
   * Generates confidence scores across standard risk vectors: Explicit Content, Violence, Hate Symbols, Text OCR (detecting phone numbers, URLs, or hate speech).
3. **Automated Decision Matrix:**
   * **Auto-Approve:** Explicit/Violent scores $< 0.05$ $
ightarrow$ Status updated to `APPROVED`. Bypass human review.
   * **Auto-Reject:** Explicit/Violent scores $> 0.95$ $
ightarrow$ Status updated to `REJECTED`. Reason logged automatically.
   * **Borderline Queue:** Scores between $0.05$ and $0.95$ $
ightarrow$ Calculate **Priority Score** (based on AI risk rating + user account age/reputation) and push item to Human Moderation Task Queue.

#### Step 4: Human Moderator Queue Management

1. **Batch Claiming & Concurrency Control:**
   * Moderators open their admin dashboard.
   * The API executes an atomic query fetching items with `FOR UPDATE SKIP LOCKED` (or pops from a Redis Sorted Set), locking batch items for the session.
2. **Session Ownership & TTL Locks:**
   * Claimed photos transition to status `IN_REVIEW`.
   * A short-lived distributed lock key (`lock:photo:review:{photo_id}`) is set in Redis with a 120-second TTL.
   * If the moderator closes their browser or loses connectivity, the lock expires, and a background watcher reverts the status to `PENDING_REVIEW`.
3. **Action Execution:**
   * Moderator clicks **Approve**, **Reject (Select Reason Code)**, or **Escalate**.
   * State update is committed alongside an immutable audit trail entry in `moderation_logs`.

#### Step 5: Post-Decision Execution & Side Effects

* **On `APPROVED`:**
  1. Trigger asynchronous Image Processing Worker: Generate responsive variants (`thumbnail_200x200`, `display_1080p`, `webp/avif` formats).
  2. Copy/move object from `raw_uploads/` to public storage bucket `public_media/`.
  3. Purge/Warm CDN edge cache and send WebSocket/Push notification to the user.
* **On `REJECTED`:**
  1. Notify the original author with user-facing rejection details (e.g., "Photo violates community guidelines on safety").
  2. Schedule object lifecycle rule to move raw file to quarantined cold storage or purge after a 30-day retention/appeal window.

---

### C. Edge Cases & Reliability Strategies

| Edge Case / Failure Scenario | Architectural Mitigation Strategy |
| :--- | :--- |
| **Aborted or Dropped Uploads** | Background cron job scans DB for `status = 'PENDING_UPLOAD' AND created_at < NOW() - INTERVAL '2 hours'`. Stale DB records are deleted, and S3 Abort Multipart Upload rules clean up partial binaries. |
| **Moderator Connection Loss** | Distributed Redis locks with 120s TTL auto-expire. Periodic monitor resets orphaned `IN_REVIEW` records back to `PENDING_REVIEW` if `updated_at > 3 minutes`. |
| **Traffic / Queue Spikes** | Dynamic queue prioritization. Photos uploaded by established, high-reputation users are routed to low-priority worker pools or auto-approved under looser thresholds, while new/low-reputation accounts are prioritized for human verification. |
| **Race Conditions in Review** | Database row-level locks using `SELECT ... FOR UPDATE SKIP LOCKED` prevent two moderators from receiving or updating the same photo. |

---

## 2. Technology Stack

| Architecture Layer | Technology Selected | Justification & Use Case |
| :--- | :--- | :--- |
| **Primary Database** | **PostgreSQL** | Relational integrity, ACID compliance, native ENUM support, fast JSONB indexing for AI metadata, and support for `FOR UPDATE SKIP LOCKED` concurrency management. |
| **In-Memory Cache & Task Queue** | **Redis** | Used for ultra-low latency queue management (Redis Streams / BullMQ), priority score tracking (Sorted Sets), and distributed concurrency locks (Redlock). |
| **Object Storage & CDN** | **AWS S3 / Cloudflare R2 + Cloudflare CDN** | Scalable, high-durability blob storage. Pre-signed URLs bypass backend bandwidth limits. Edge CDN ensures global fast media distribution. |
| **Automated AI Moderation** | **AWS Rekognition / Custom OpenNSFW Service** | High-throughput automated safety classification for nudity, violence, text extraction, and perceptual hashing. |
| **Asynchronous Worker Fleet** | **Go (Golang) / Node.js Microservices** | Lightweight, high-concurrency worker services for image processing, hashing, queue processing, and third-party API orchestration. |

---

## 3. Data Structures & Schema Design

### A. Relational Database Schema (PostgreSQL)

```sql
-- 1. Enum Types for State Safety
CREATE TYPE photo_status AS ENUM (
    'PENDING_UPLOAD',
    'PENDING_REVIEW',
    'IN_REVIEW',
    'APPROVED',
    'REJECTED',
    'ESCALATED'
);

CREATE TYPE rejection_reason AS ENUM (
    'NSFW_EXPLICIT',
    'VIOLENCE_HATE',
    'COPYRIGHT_VIOLATION',
    'SPAM_WATERMARK',
    'LOW_QUALITY',
    'OTHER'
);

-- 2. Photos Primary Table
CREATE TABLE photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    storage_path VARCHAR(512) NOT NULL UNIQUE,
    status photo_status NOT NULL DEFAULT 'PENDING_UPLOAD',
    mime_type VARCHAR(64) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    perceptual_hash VARCHAR(64) NULL,
    ai_score NUMERIC(4, 3) DEFAULT 0.000, -- Range: 0.000 to 1.000
    priority_score INT DEFAULT 0,          -- Calculated priority for queue sorting
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexing for Moderator Queue Retrieval (High Efficiency Filtering)
CREATE INDEX idx_photos_moderation_queue 
ON photos (priority_score DESC, created_at ASC) 
WHERE status = 'PENDING_REVIEW';

-- Indexing for User Media Feed Retrieval
CREATE INDEX idx_photos_user_approved 
ON photos (user_id, created_at DESC) 
WHERE status = 'APPROVED';

-- 3. Moderation Logs Table (Immutable Audit History)
CREATE TABLE moderation_logs (
    id BIGSERIAL PRIMARY KEY,
    photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
    moderator_id UUID NULL, -- NULL indicates decision made by automated AI service
    action photo_status NOT NULL,
    reason rejection_reason NULL,
    metadata JSONB DEFAULT '{}'::jsonb, -- Stores raw AI confidence breakdowns or notes
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_moderation_logs_photo_id ON moderation_logs(photo_id);
```

---

### B. Redis In-Memory Data Structures

#### 1. Real-Time Moderator Priority Queue (Sorted Set)

* **Key Name:** `queue:photos:pending`
* **Structure:** Redis Sorted Set (`ZSET`)
* **Score:** `<priority_score>` (Composite metric derived from wait time + AI risk factor)
* **Member:** `<photo_id>`
* **Commands:**
  * Push to Queue: `ZADD queue:photos:pending <priority_score> <photo_id>`
  * Pop Highest Priority Item: `ZPOPMAX queue:photos:pending 1`

#### 2. Moderator Claim Lock (String Key with TTL)

* **Key Name:** `lock:photo:review:<photo_id>`
* **Structure:** String
* **Value:** `<moderator_id>`
* **TTL:** `120 seconds`
* **Commands:**
  * Acquire Lock: `SET lock:photo:review:<photo_id> <moderator_id> NX EX 120`
  * Release Lock: Evaluated via Lua script verifying `<moderator_id>` before deletion.

---

### C. Atomic Moderator Queue Query (PostgreSQL Queue Pattern)

When fetching pending photos directly from PostgreSQL in concurrent multi-moderator environments, the following atomic query prevents race conditions and locks without blocking parallel sessions:

```sql
-- Atomically fetch and lock 10 pending photos for a moderator session
UPDATE photos
SET status = 'IN_REVIEW', 
    updated_at = NOW()
WHERE id IN (
    SELECT id 
    FROM photos 
    WHERE status = 'PENDING_REVIEW'
    ORDER BY priority_score DESC, created_at ASC
    LIMIT 10
    FOR UPDATE SKIP LOCKED
)
RETURNING id, user_id, storage_path, ai_score, priority_score, created_at;
```
