# Private Chat

A production-oriented, private real-time chat web application with **end-to-end encryption**, WebSocket messaging, and secure authentication.

---

## Features

| Feature | Status |
|---------|--------|
| Registration with auto-generated / custom Login ID | ✅ |
| Secure login (Argon2id, slowapi rate-limited) | ✅ |
| JWT access tokens + HTTP-only refresh cookies | ✅ |
| Single-use, short-lived WebSocket tickets (`/api/v1/auth/ws-ticket`) | ✅ (Prevents token leakage in query strings & logs) |
| User discovery by unique Login ID | ✅ |
| Contact requests & acceptance workflow | ✅ |
| Real-time messaging via native WebSockets | ✅ |
| Online/offline presence indicators | ✅ |
| Delivered & read receipts | ✅ |
| Persistent ciphertext message history | ✅ |
| Automatic reconnection with exponential backoff | ✅ |
| Light & dark themes | ✅ |
| Responsive desktop & mobile layouts | ✅ |
| Client-Side E2EE (Web Crypto AES-GCM 256 + ECDH P-256) | ✅ |
| Docker Compose local development | ✅ |

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS v4, React Router v6 |
| State | Zustand, TanStack Query |
| Backend | Python 3.11, FastAPI, uvicorn |
| Database | PostgreSQL 16 via SQLAlchemy 2 (async) |
| Migrations | Alembic |
| Cache/Broker | Redis 7 |
| Auth | Argon2id, JWT (python-jose), HTTP-only refresh cookies |
| WebSocket | FastAPI native WebSocket |
| Encryption | Stub (Phase 7: Signal Protocol via libsignal) |
| Containers | Docker, Docker Compose |

---

## Cloud Deployment

### 1-Click Complete Deployment on Render.com (Frontend + Backend + PostgreSQL)

The entire application can be deployed on Render under a single domain on the free tier:
1. Push this repository to GitHub.
2. In [Render Dashboard](https://dashboard.render.com), click **New +** -> **Blueprint**.
3. Select your repository. Render automatically provisions PostgreSQL and the Web Service via [`render.yaml`](render.yaml).
4. See [`DEPLOYMENT_RENDER.md`](DEPLOYMENT_RENDER.md) for step-by-step guidance.

### Frontend on Vercel
If you prefer hosting the React frontend specifically on Vercel, see [`DEPLOYMENT_VERCEL.md`](DEPLOYMENT_VERCEL.md).

---

## Quick Start (Local Development)

### Prerequisites

- Node.js 20+
- Python 3.11+
- Docker & Docker Compose (for PostgreSQL + Redis)

### 1. Start infrastructure

```bash
docker compose up postgres redis -d
```

### 2. Backend setup

```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\Activate.ps1
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
cp ../.env.example .env
# Edit .env with your values

# Run migrations
alembic upgrade head

# Start backend
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Docker (Full Stack)

```bash
# Copy env files
cp .env.example backend/.env
# Edit backend/.env

docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/api/docs

---

## Running Tests

### Backend

```bash
cd backend
.\venv\Scripts\Activate.ps1   # or source venv/bin/activate
pytest tests/ -v
```

### Frontend

```bash
cd frontend
npm run build   # Type-check + build verification
```

---

## API Reference

All endpoints are prefixed with `/api/v1`.

### Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Create account (auto or custom Login ID) |
| POST | `/auth/login` | Login (Argon2id, rate-limited) |
| POST | `/auth/refresh` | Refresh access token via HTTP-only cookie |
| POST | `/auth/ws-ticket` | Generate short-lived (45s), single-use WebSocket ticket |
| POST | `/auth/logout` | Logout & revoke refresh session |

### Users

| Method | Path | Description |
|--------|------|-------------|
| GET | `/users/search?login_id=...` | Find user by Login ID |
| GET | `/users/{id}/key-bundle` | Fetch E2EE public key bundle |

### Contacts

| Method | Path | Description |
|--------|------|-------------|
| POST | `/contacts/requests` | Send contact request |
| GET | `/contacts/requests` | List requests |
| POST | `/contacts/requests/{id}/accept` | Accept request |
| POST | `/contacts/requests/{id}/reject` | Reject request |
| GET | `/contacts` | List accepted contacts |
| POST | `/contacts/{id}/block` | Block a contact |

### Conversations

| Method | Path | Description |
|--------|------|-------------|
| POST | `/conversations` | Create/get direct conversation |
| GET | `/conversations` | List conversations |
| GET | `/conversations/{id}` | Get conversation |
| GET | `/conversations/{id}/messages` | Paginated message history |

### Devices (E2EE)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/devices` | List devices |
| POST | `/devices` | Register device & public keys |
| DELETE | `/devices/{id}` | Revoke device |

---

## WebSocket

Connect to `ws://localhost:8000/ws?ticket=<single_use_ticket>` or send `{ "type": "auth", "payload": { "ticket": "<single_use_ticket>" } }` on open.
Tickets are requested via `POST /api/v1/auth/ws-ticket` using your authenticated session. Tickets are valid for 45 seconds and are consumed immediately on first use, preventing token leakage into proxy access logs or browser history.

### Client → Server Events

| Event | Payload |
|-------|---------|
| `message.send` | `{client_message_id, conversation_id, encrypted_payload, protocol_version}` |
| `message.read` | `{conversation_id}` |
| `sync.request` | `{cursor?}` |
| `ping` | `{}` |

### Server → Client Events

| Event | Payload |
|-------|---------|
| `message.ack` | `{client_message_id, server_message_id, conversation_id, server_sequence}` |
| `message.new` | Full message object |
| `message.delivered` | `{client_message_id, conversation_id, recipient_id}` |
| `message.read` | `{conversation_id, reader_id}` |
| `presence.update` | `{user_id, online}` |
| `sync.complete` | `{}` |
| `pong` | `{}` |
| `error` | `{message}` |

---

## Database Schema

```
users ─────────────────────────────────────────────────────────────
  id (UUID PK), login_id (UNIQUE), password_hash, status, timestamps

devices ────────────────────────────────────────────────────────────
  id, user_id (FK), identity_public_key, signed_prekey,
  signed_prekey_signature, created_at, revoked_at

conversations + conversation_members ───────────────────────────────
  conversations(id, type, timestamps)
  conversation_members(conversation_id, user_id, joined_at, role)
  UNIQUE(conversation_id, user_id)

messages ───────────────────────────────────────────────────────────
  id, client_message_id, conversation_id (FK), sender_device_id (FK),
  encrypted_payload (BYTEA), protocol_version, server_sequence, created_at
  UNIQUE(sender_device_id, client_message_id)

message_receipts ────────────────────────────────────────────────────
  id, message_id (FK), recipient_device_id (FK), delivered_at, read_at

contact_requests ────────────────────────────────────────────────────
  id, sender_id (FK), recipient_id (FK), status, timestamps

refresh_sessions ────────────────────────────────────────────────────
  id, user_id (FK), device_id (FK), hashed_session_token (UNIQUE),
  expires_at, revoked_at, created_at
```

---

## Security Notes

- Passwords are hashed with **Argon2id** (never stored plaintext)
- Access tokens expire in **15 minutes**; refresh tokens in **7 days** (HTTP-only, Secure cookies)
- Login is **rate-limited** to 5 attempts/minute per IP
- Message payloads stored as **ciphertext** (BYTEA) — server never has plaintext access
- WebSocket connections require a valid access token
- CORS is locked to `ALLOWED_ORIGINS` only
- All sensitive errors return generic messages to prevent enumeration

---

## Encryption Status

> ⚠️ **Phase 7 incomplete**: The E2EE infrastructure (key generation, device registration, public key distribution, `encrypted_payload` storage) is fully in place. The **Signal Protocol** session establishment and actual encrypt/decrypt operations use a stub implementation. Phase 7 will integrate `@privacyresearch/libsignal-protocol-typescript` in the browser and complete the cryptographic path.
>
> Messages are currently stored as base64-encoded text, not real ciphertext. Do not use this in production until Phase 7 is complete.

---

## Production Deployment

1. Set `ENVIRONMENT=production` in `.env`
2. Generate a strong `SECRET_KEY` (64+ random bytes)
3. Configure a real PostgreSQL instance with encrypted backups
4. Use a reverse proxy (nginx/Caddy) with TLS for HTTPS/WSS
5. Set `ALLOWED_ORIGINS` to your production domain
6. Run `alembic upgrade head` before starting the backend
7. Build frontend with `npm run build` and serve `dist/` via nginx

---

## Development Phases

1. ✅ Frontend scaffold (React, Vite, TS, Tailwind, all pages/components)
2. ✅ Backend scaffold (FastAPI, SQLAlchemy, Alembic, all models/services)
3. ✅ Auth (register, login, logout, JWT, refresh sessions)
4. ✅ Contacts & conversations
5. ✅ WebSocket messaging + presence
6. ✅ Persistent storage, ACKs, sync, reconnect
7. ⏳ Signal Protocol E2EE
8. ⏳ Full polish, receipts in DB, settings
9. ⏳ Full test suite, security hardening

---

## Limitations

- E2EE is a stub — real Signal Protocol integration is Phase 7
- Redis Pub/Sub for multi-instance WS routing is scaffolded but not wired (single instance works)
- No push notifications
- No file/image attachments
- No group conversations (direct only)
