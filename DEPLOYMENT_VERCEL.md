# Deployment Guide: Vercel + Backend Hosting

This application consists of two parts:
1. **Frontend (React + Vite SPA)**: Deployed to **Vercel**.
2. **Backend (FastAPI + Native WebSockets + PostgreSQL)**: Deployed to a platform that supports persistent WebSocket connections (e.g. **Render**, **Railway**, or **Fly.io**).

> [!IMPORTANT]
> **Why can't the backend run directly on Vercel Serverless Functions?**
> Vercel Serverless Functions are stateless and terminate after each HTTP request. Real-time chat requires **persistent, bidirectional WebSocket connections (`wss://`)** that stay open continuously for instant message transport, presence updates, and heartbeat ping/pongs.

---

## Step 1: Deploy the Backend (Render or Railway)

### Option A: Render (Free Tier, WebSockets Supported)

1. Push this project to your GitHub repository.
2. Sign in to [Render.com](https://render.com).
3. Click **New +** -> **Blueprints**.
4. Select your GitHub repository. Render will automatically detect the [`render.yaml`](render.yaml) file in the root directory!
5. Render will automatically provision:
   - A free **PostgreSQL database** (`private-chat-db`).
   - A free **FastAPI Web Service** with native WebSocket support.
6. Once deployed, Render will give you a backend URL, for example:
   - API: `https://private-chat-backend.onrender.com`
   - WebSocket: `wss://private-chat-backend.onrender.com`

---

## Step 2: Deploy the Frontend to Vercel

### Method 1: Using the Vercel Dashboard (Easiest)

1. Go to [vercel.com](https://vercel.com) and log in.
2. Click **Add New…** -> **Project**.
3. Import your GitHub repository.
4. In the configuration screen:
   - **Framework Preset**: Select `Vite`.
   - **Root Directory**: Click "Edit" and choose `frontend`.
   - **Build Command**: `npm run build` (default).
   - **Output Directory**: `dist` (default).
5. Open the **Environment Variables** section and add:
   | Variable | Value | Description |
   |---|---|---|
   | `VITE_API_BASE_URL` | `https://your-backend.onrender.com` | Your deployed backend URL |
   | `VITE_WS_BASE_URL` | `wss://your-backend.onrender.com` | Your deployed WebSocket URL |
6. Click **Deploy**!

### Method 2: Using the Vercel CLI

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Navigate to the frontend directory
cd frontend

# 3. Deploy
vercel

# 4. When prompted:
# ? Set up and deploy? [Y/n] y
# ? Which scope do you want to deploy to? (Your Account)
# ? Link to existing project? [y/N] n
# ? What's your project's name? private-chat
# ? In which directory is your code located? ./
# ? Want to modify these settings? n

# 5. Add your environment variables:
vercel env add VITE_API_BASE_URL production
vercel env add VITE_WS_BASE_URL production

# 6. Deploy to production:
vercel --prod
```

---

## Step 3: Update Backend CORS for your Vercel Domain

After Vercel gives you your production frontend domain (e.g., `https://private-chat-xyz.vercel.app`):

1. Go to your Render or Railway dashboard.
2. Under Environment Variables for `private-chat-backend`, set:
   ```env
   ALLOWED_ORIGINS=https://private-chat-xyz.vercel.app
   ```
3. Save and redeploy the backend service.

---

## What We've Already Pre-Configured for Vercel

- [`frontend/vercel.json`](frontend/vercel.json): Configured with SPA rewrite rules (`/(.*)` -> `/index.html`) so route refreshes (e.g. `/dashboard`, `/login`) never return 404s.
- [`frontend/src/services/api.ts`](frontend/src/services/api.ts): Dynamic `VITE_API_BASE_URL` support.
- [`frontend/src/services/websocket.ts`](frontend/src/services/websocket.ts): Dynamic `VITE_WS_BASE_URL` support.
- [`render.yaml`](render.yaml): Blueprint for automated backend + PostgreSQL deployment.
