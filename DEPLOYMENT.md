# SmartCivic+ | Production & Live Deployment Guide

This guide explains how to make SmartCivic+ accessible to external users over the internet.

---

## ⚡ Option 1: Instant 1-Minute Live Access (No Cloud Setup Required)

If you want to immediately share the running system with users, evaluators, or test on your mobile phone:

### A. On Your Local WiFi Network (Immediate)
Because Vite is configured with `host: 0.0.0.0`, any mobile phone or computer on the same WiFi network can access the site right now:
```
http://192.168.1.37:3000
```

### B. Over the Global Public Internet (Free HTTPS URL)
You can expose the local app to the public web using **Localtunnel** or **Ngrok**:

#### Using Localtunnel (No installation or account needed):
In a new terminal, run:
```bash
npx localtunnel --port 3000
```
This generates a live public HTTPS link (e.g., `https://smartcivic-demo.loca.lt`) that anyone in the world can open on their phone or browser.

#### Using Cloudflare Tunnel (Recommended for stability):
```bash
cloudflared tunnel --url http://localhost:3000
```

---

## ☁️ Option 2: Permanent Production Cloud Deployment (Free Tier Stack)

To deploy the application permanently so it runs 24/7 in the cloud:

```
┌─────────────────┐       ┌─────────────────┐       ┌──────────────────────┐
│  React Client   │ ────> │ Express Backend │ ────> │ Python ML Microsvc   │
│  (Vercel/Netlify│       │  (Render.com)   │       │ (Render / HuggingFace│
└─────────────────┘       └────────┬────────┘       └──────────────────────┘
                                   │
                                   ▼
                          ┌─────────────────┐
                          │  MongoDB Atlas  │
                          │   (Free M0 DB)  │
                          └─────────────────┘
```

### 1. Database: MongoDB Atlas (Free Tier)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free M0 cluster.
2. In **Database Access**, create a user (e.g., `smartcivic_admin`).
3. In **Network Access**, add IP `0.0.0.0/0` (allow connections from anywhere).
4. Copy the connection string (e.g., `mongodb+srv://admin:pass@cluster0.mongodb.net/smartcivic`).

### 2. ML Microservice: Render.com (Python Web Service)
1. Create a new **Web Service** on [Render.com](https://render.com) from your Git repository.
2. **Root Directory**: `ml_service`
3. **Build Command**: `pip install -r requirements.txt`
4. **Start Command**: `uvicorn app:app --host 0.0.0.0 --port $PORT`
5. Note the generated URL (e.g., `https://smartcivic-ml.onrender.com`).

### 3. Backend REST API: Render.com (Node.js Web Service)
1. Create a second **Web Service** on Render from your Git repository.
2. **Root Directory**: `server`
3. **Build Command**: `npm install`
4. **Start Command**: `node server.js`
5. **Environment Variables**:
   * `MONGO_URI`: *Your MongoDB Atlas connection string*
   * `ML_SERVICE_URL`: `https://smartcivic-ml.onrender.com`
   * `JWT_SECRET`: *Your secret key*
   * `PORT`: `5000`
6. Note the backend URL (e.g., `https://smartcivic-api.onrender.com`).

### 4. Frontend: Vercel (React Single-Page App)
1. Go to [Vercel](https://vercel.com) and import your Git repository.
2. **Root Directory**: `client`
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. In `client/vite.config.js` or through environment variables, set the API proxy/base URL to `https://smartcivic-api.onrender.com`.

---

## 🧪 Automated Testing Verification

SmartCivic+ includes an automated end-to-end audit script:
```bash
python test_e2e_full_system.py
```
This tests all 15 pipeline checkpoints across Frontend, Backend, ML Models, and the entire Citizen &rarr; Worker lifecycle.

