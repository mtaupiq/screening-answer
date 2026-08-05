# Website Security Best Practices

A comprehensive, prioritized guide to securing web applications and infrastructure, ranked from critical fundamental practices to ongoing operational security.

---

## 1. Authentication & Access Control

* **Enforce Multi-Factor Authentication (MFA):** Require MFA for all administrative accounts, sensitive user actions, and employee access to internal systems.
* **Implement Secure Password Policies:** Do not rely on weak password complexity rules that encourage predictable patterns; instead, enforce minimum lengths (12–16+ characters), check credentials against known breach databases (e.g., Have I Been Pwned API), and mandate password managers.
* **Use Cryptographically Strong Password Hashing:** Hash passwords using modern, memory-hard algorithms such as Argon2id or bcrypt with appropriate work factors. Never use MD5, SHA-1, or plain SHA-256 without salting and stretching.
* **Principle of Least Privilege (PoLP):** Restrict system, database, and API permissions so users, services, and applications only have access to the exact resources required for their function.
* **Secure Session Management:**
  * Invalidate sessions upon logout or after reasonable inactivity timeouts.
  * Store session identifiers in HTTP-only, Secure, and SameSite (`Strict` or `Lax`) cookies to prevent access via client-side scripts.
  * Rotate session tokens upon privilege elevation (e.g., after logging in) to prevent Session Fixation attacks.

---

## 2. Input Handling & Vulnerability Mitigation (OWASP Top 10)

* **Prevent Injection Attacks (SQLi, Command Injection):**
  * Always use parameterized queries (prepared statements) or safe ORM abstractions for database operations. Never concatenate user input directly into query strings.
* **Mitigate Cross-Site Scripting (XSS):**
  * Contextually encode all user-supplied output rendered in the HTML, Javascript, or CSS contexts.
  * Implement a strict **Content Security Policy (CSP)** HTTP header to restrict where scripts, styles, and external resources can be loaded from and block inline script execution.
* **Prevent Cross-Site Request Forgery (CSRF):**
  * Use anti-CSRF tokens for state-changing HTTP requests (POST, PUT, DELETE).
  * Configure `SameSite=Lax` or `SameSite=Strict` on session cookies.
* **Avoid Broken Object Level Authorization (BOLA / IDOR):**
  * Validate that the currently authenticated user owns or has authorization to access the specific object identifier (e.g., `/api/orders/{id}`) on every single request at the backend layer.

---

## 3. Transport & Network Security

* **Enforce HTTPS Everywhere:**
  * TLS 1.2+ (preferably TLS 1.3) with strong cipher suites across all endpoints.
  * Redirect all HTTP traffic to HTTPS automatically with a 301 redirect.
  * Implement **HSTS (HTTP Strict Transport Security)** headers with `includeSubDomains` and `preload` flags.
* **Configure Security Headers:**
  * `Content-Security-Policy`: Restricts allowed sources for scripts, frames, images, and fonts.
  * `X-Frame-Options: DENY` or `SAMEORIGIN` (or CSP `frame-ancestors`) to prevent Clickjacking.
  * `X-Content-Type-Options: nosniff` to prevent MIME-type sniffing.
  * `Referrer-Policy: strict-origin-when-cross-origin` to limit metadata leakage.
  * `Permissions-Policy`: Restricts browser features (camera, geolocation, microphone).
* **Deploy a Web Application Firewall (WAF) & Rate Limiting:**
  * Implement layer-7 rate limiting on sensitive routes (login, password reset, API endpoints) to prevent brute-force and credential-stuffing attacks.
  * Use a WAF or Reverse Proxy (e.g., Cloudflare, AWS WAF, Caddy/Nginx rules) to filter malicious bot traffic, DDoS attempts, and common exploit patterns.

---

## 4. Server, Infrastructure & Dependency Security

* **Automate Dependency & Package Auditing:**
  * Continuously scan application dependencies for known vulnerabilities (CVEs) using automated software bill-of-materials (SBOM) scanners like Dependabot, Snyk, or Trivy.
  * Remove unused libraries and third-party scripts.
* **Hardening & Environment Isolation:**
  * Disable unused server ports, protocols, services, and default admin interfaces.
  * Never expose management ports (e.g., SSH, database ports, Redis) to the public internet; restrict access via private networks or VPN/Zero Trust tunnels.
  * Run web application processes under unprivileged system users (e.g., non-root inside containers).
* **Secure Environment Variables & Secrets Management:**
  * Store API keys, database credentials, and secret keys outside the codebase in dedicated secret managers (e.g., Vault, AWS Secrets Manager, encrypted environment files).
  * Ensure secrets are never committed to version control repositories.

---

## 5. Logging, Monitoring & Incident Preparedness

* **Centralized Audit Logging:**
  * Log significant security events: failed login attempts, privilege escalation, administrative changes, input validation failures, and password changes.
  * Sanitize logs to ensure sensitive data (passwords, tokens, credit card numbers, PII) is never written in plain text.
* **Real-time Alerting & Anomaly Detection:**
  * Set up automated triggers for abnormal activity patterns (e.g., spike in 4xx/5xx responses, rapid login attempts, unusual geographical logins).
* **Automated Backups & Disaster Recovery:**
  * Maintain regular, encrypted, off-site backups of databases and application state.
  * Test backup restoration procedures periodically to ensure recovery targets (RTO/RPO) can be met in the event of ransomware or system destruction.

---

## 6. Secure Development Lifecycle (SDLC)

* **Code Reviews & Static/Dynamic Analysis:**
  * Integrate Static Application Security Testing (SAST) and Dynamic Application Security Testing (DAST) into CI/CD pipelines.
  * Require mandatory peer code reviews for all production deployments.
* **Security Testing:**
  * Conduct periodic third-party penetration testing and threat modeling exercises for core features and architecture updates.
