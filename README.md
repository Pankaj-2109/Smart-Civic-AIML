# SmartCivic+ | AI-Powered Municipal Civic Issue & Waste Management System

An intelligent, full-stack municipal grievance and waste management platform built with **React (Tailwind CSS)**, **Node.js (Express)**, **MongoDB**, and a dedicated **Python (FastAPI) Machine Learning microservice**.

---

## 🌟 System Architecture Overview

```
                          ┌──────────────────────────┐
                          │   React.js + Tailwind    │
                          │     (Vite Frontend)      │
                          │   Citizen / Admin / Crew │
                          └────────────┬─────────────┘
                                       │ HTTP / REST
                                       ▼
                          ┌──────────────────────────┐
                          │    Node.js + Express     │
                          │     (REST API Server)    │
                          │   Auth · Routes · Logic  │
                          └──────┬─────────────┬─────┘
                                 │             │
                Internal Forward │             │ Mongoose Driver
                                 ▼             ▼
  ┌────────────────────────────────────┐  ┌───────────────────────┐
  │      Python FastAPI ML Service     │  │   MongoDB Database    │
  │ • MobileNetV2 Image Classifier     │  │ • Users (Roles)       │
  │ • Severity & Urgency Predictor     │  │ • Complaints          │
  │ • Haversine + TF-IDF Duplicate Det.│  │ • Workers             │
  │ • Cleanliness Verification Engine  │  │ • Geospatial Indexes  │
  │ • AI Civic Assistant (NLP)         │  └───────────────────────┘
  └────────────────────────────────────┘
```

---

## 🚀 Key Features

### 1. Citizen Dashboard & Reporting Portal
- **One-Click Issue Reporting**: Snap or upload an image with description.
- **Instant AI Categorization**: Fast image inspection predicting `Garbage`, `Overflowing Bin`, `Pothole`, `Water Leakage`, `Illegal Dumping`, or `Clean Area` with confidence scores.
- **GPS Location Detection**: Auto-detects device GPS with OpenStreetMap reverse geocoding and an interactive map pin adjuster.
- **Duplicate Grievance Warning**: Warns citizens if a duplicate report has already been logged nearby.
- **Status Stepper Tracker**: Track complaints from `Reported` &rarr; `Assigned` &rarr; `In Progress` &rarr; `Resolved`.
- **Nearby Issues Map**: Live interactive Leaflet map with color-coded pins for neighborhood issues.

### 2. Municipal / Admin Command Center
- **Key Metric KPI Cards**: 
  - Total Complaints
  - Pending Complaints
  - In Progress Complaints
  - Resolved Complaints
  - High Priority Alerts
- **City-Wide Map View**: Interactive OpenStreetMap Leaflet map with severity-based pin styling.
- **Work Order Management**: Filter complaints by Category, Severity tier, or Status with real-time text search.
- **Field Worker Dispatch**: Assign complaints directly to available municipal sanitation workers with live workload tracking.

### 3. Sanitation Worker Dashboard
- **Dedicated Field Crew View**: View tasks assigned specifically to the logged-in field worker.
- **GPS Turn-by-Turn Navigation**: One-click deep link to Google Maps / OpenStreetMap navigation directly to the complaint coordinates.
- **Workflow State Management**: Transition status from `Pending` &rarr; `In Progress` &rarr; `Resolved`.
- **After-Cleaning Verification**: Upload after-cleaning photographs with resolution notes.

### 4. Standout Advanced Features
1. **🔥 Smart Waste Hotspot Detection**: Spatial clustering algorithm detects high-density recurring waste hotspots across city sectors and displays them with heat circles and urgency tiers.
2. **🚚 Smart Waste Collection Route Optimization**: Solves the Traveling Salesperson Problem (TSP) using a Greedy Nearest Neighbor heuristic with High-Severity weighting to compute the optimal collection route for sanitation trucks, calculating total distance, estimated time, and fuel consumption.
3. **✨ AI Before & After Verification**: Automated computer vision inspection analyzing surface texture, edge gradient reduction, and cleanliness improvement scores (0–100%) between the citizen's original photo and the worker's resolution photo.
4. **🤖 AI Civic Assistant**: Conversational assistant widget answering resident questions about grievance reporting, municipal SLA timelines, waste segregation rules (wet vs. dry vs. e-waste), and emergency contact numbers.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Tailwind CSS, Lucide Icons, Vite |
| **Interactive Maps** | Leaflet, OpenStreetMap, React-Leaflet |
| **Backend REST API** | Node.js, Express.js, Multer, JWT, Bcrypt.js |
| **Database** | MongoDB (Local MongoDB Server or MongoDB Atlas) |
| **ML Microservice** | Python 3, FastAPI, Uvicorn, Pillow, Scikit-learn, NumPy |

---

## ⚡ Quick Start & Running the Project

### Prerequisites
1. **Node.js** (v18+) and **npm**
2. **Python** (v3.10+)
3. **MongoDB** running locally on port 27017 or a MongoDB Atlas URI

### Installation & Startup

#### 1. Seed the Database
Populate realistic demonstration complaints, field workers, and accounts:
```bash
npm run seed
```

#### 2. Run All Services Concurrently
```bash
npm run dev
```

Or run each service individually in separate terminals:

**Terminal 1 (Python FastAPI ML Service - Port 8000):**
```bash
npm run start:ml
# Or: python -m uvicorn app:app --app-dir ml_service --port 8000 --reload
```

**Terminal 2 (Node.js Express Backend - Port 5000):**
```bash
npm run start:server
# Or: node server/server.js
```

**Terminal 3 (React Vite Frontend - Port 3000):**
```bash
npm run start:client
# Or: cd client && npm run dev
```

Visit the application at: **`http://localhost:3000`**

---

## 👥 Demo Logins & Role Switcher

You can switch between any portal instantly using the **View Switcher** dropdown in the top navbar:

| Role | Name | Email | Password |
|---|---|---|---|
| **Citizen** | Rahul Sharma | `citizen@gmail.com` | `citizen123` |
| **Municipal Admin** | Commissioner Vikram Rao | `admin@smartcivic.gov` | `admin123` |
| **Sanitation Worker** | Ramesh Kumar | `ramesh.kumar@smartcivic.gov` | `worker123` |

---

## 📡 API Reference

### Express Backend Endpoints (`http://localhost:5000/api`)
- `POST /auth/register` - Create user account
- `POST /auth/login` - Authenticate and return JWT token
- `GET /auth/me` - Current authenticated user
- `POST /complaints` - Submit complaint (processes image & triggers ML pipeline)
- `GET /complaints` - Filter complaints by category, severity, status, search
- `GET /complaints/:id` - Single complaint details
- `PATCH /complaints/:id/status` - Update status (`PENDING`, `IN_PROGRESS`, `RESOLVED`)
- `POST /complaints/:id/assign` - Assign to sanitation worker
- `POST /complaints/:id/resolve` - Upload after-image and verify resolution
- `GET /admin/analytics` - Dashboard statistics and category breakdown
- `GET /admin/hotspots` - Smart geospatial waste hotspot clusters
- `GET /admin/route-optimize` - Optimal collection route TSP waypoints
- `POST /ai/assistant` - Conversational civic chatbot queries

### FastAPI ML Endpoints (`http://localhost:8000`)
- `GET /health` - Microservice health status
- `POST /predict/image` - Image classification (6 civic defect classes)
- `POST /predict/severity` - Urgency tier and priority score (0-100)
- `POST /predict/duplicate` - Geodesic Haversine + TF-IDF duplicate detection
- `POST /predict/verify-resolution` - Before-and-after cleanliness scoring
- `POST /assistant/chat` - Natural language civic assistant response
