# Real-Time Vue 3 & WebSockets Chat Application

A real-time chat application built with **Vue 3**, **TypeScript**, and **Node.js WebSockets (`ws`)**.

## Project Structure

```text
.
├── chat-backend/     # Node.js + WebSocket Server
└── chat-frontend/    # Vue 3 + TypeScript Client App
```

## Prerequisites

Make sure you have the following installed on your machine:

- Node.js (v18 or higher recommended)
- npm (v9 or higher)

## 1. Setting Up & Running the Backend (chat-backend)

The backend runs a WebSocket server on port 8080.

### Setup Backend

Open a terminal and navigate to the backend directory:

```bash
cd chat-backend
npm install
```

---

### Running Backend Locally

Run the server using tsx (recommended for Node.js compatibility):

```bash
npx tsx server.ts
```

Expected Terminal Output:

```bash
WebSocket server running on ws://localhost:8080
```

[/chat-backend/README.md](chat-backend/README.md)

## 2. Setting Up & Running the Frontend (chat-frontend)

The frontend runs the Vue 3 application built with Vite.

### Setup Frontend

Open a second terminal window and navigate to the frontend directory:

```bash
cd chat-frontend
npm install
```

---

### Running Frontend Locally

Start the development server:

```bash
npm run dev
```

Expected Terminal Output:

```bash
> chat-frontend@0.0.0 dev
> vite


  VITE v8.2.0  ready in 940 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  Vue DevTools: Open http://localhost:5173/__devtools__/ as a separate window
  ➜  Vue DevTools: Press Alt(⌥)+Shift(⇧)+D in App to toggle the Vue DevTools
  ➜  press h + enter to show help
```

[/chat-frontend/README.md](chat-frontend/README.md)

## 3. How to Test Real-Time Chat

- Open [http://localhost:5173](http://localhost:5173) in your browser.
- Open a second tab or an incognito window and go to [http://localhost:5173](http://localhost:5173).
- Type a message in one window—it will render instantly in both windows.
