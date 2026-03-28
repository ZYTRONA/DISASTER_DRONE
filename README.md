# 🚁 Disaster Response Drone Management System

## PROJECT OVERVIEW

This system consists of:

1️⃣ **User Web Application**  
2️⃣ **Ground Station Web Dashboard**  
3️⃣ **Backend Server (Flask + Socket.IO)**  
4️⃣ **MySQL Database (XAMPP)**  
5️⃣ **Drone Hardware Integration**

---

## 🌐 FRONTEND ARCHITECTURE

You have two separate frontend applications.

### 1️⃣ USER WEB (Relief App)

#### 🎯 Purpose
Allows disaster victims to:
- Request essential resources
- Share GPS location
- Track request status

#### 🧱 User Frontend Architecture
```
UserHome Page
 ├── ResourceCard Component
 ├── Emergency Button
 ├── GPS Capture
 └── StatusTracker Component
```

#### 🔄 User Flow
1. User selects resource (Food/Water/Medicine)
2. User enters emergency note
3. GPS auto-captured
4. Request sent to backend
5. Status updates shown (Pending → Assigned → Delivered)

#### 🧠 Tech Used
- React (Vite)
- Tailwind CSS
- Axios (API calls)
- Geolocation API
- Socket (optional for live status)

#### 📡 API Calls From User
| Action | Endpoint | Method |
|--------|----------|--------|
| Send Request | `/request` | POST |
| Get Status | `/status/:id` | GET (optional) |

---

### 2️⃣ GROUND STATION WEB

#### 🎯 Purpose
Used by drone manager to:
- View incoming requests
- Assign drone
- Control drone manually
- Monitor telemetry
- Track drone location

#### 🧱 Dashboard Architecture
```
Dashboard
 ├── RequestPanel
 ├── MapPanel
 ├── TelemetryPanel
 └── DroneControlPanel
```

#### 🔄 Ground Station Flow
1. Receives live requests via Socket
2. Displays request details
3. Assigns drone
4. Sends commands to drone
5. Receives telemetry updates

#### 🧠 Tech Used
- React + Tailwind
- Socket.IO Client
- React-Leaflet (for map)
- Axios

---

## 🔁 REAL-TIME COMMUNICATION FLOW

```
User Web
    ↓ POST
Flask Backend
    ↓ Socket emit
Ground Station

Drone → Backend → Ground Station (Telemetry)
Ground Station → Backend → Drone (Commands)
```

---

## 🧠 BACKEND ARCHITECTURE

### 🔥 Backend Stack
- Flask
- Flask-SocketIO
- Eventlet
- Flask-CORS
- **mysql-connector-python** (XAMPP / MySQL)

### 📁 Backend Structure
```
backend/
 ├── server.py          # Flask app + MySQL connection pool
 └── ndrf_schema.sql    # MySQL schema (import once into XAMPP)
```

### 🧩 Backend Components

#### 1️⃣ REST API
Handles:
- Receiving user requests
- Receiving drone telemetry
- Updating request status

#### 2️⃣ Socket Server
Handles:
- Broadcasting new requests
- Broadcasting telemetry
- Receiving drone commands
- Sending command acknowledgements

### 🔄 Backend Logic Flow

#### When User Sends Request:
```
User → POST /request
Backend stores request
Backend emits socket event "new_request"
Ground Station receives instantly
```

#### When Drone Sends Telemetry:
```
Drone → POST /telemetry
Backend updates telemetry
Backend emits "telemetry"
Ground Station updates dashboard
```

#### When Operator Sends Command:
```
Ground Station → socket.emit("drone_command")
Backend receives
Backend forwards to drone
```

---

## 🗄️ DATABASE DESIGN — XAMPP / MySQL

> **Database:** `ndrf_gcs` · **Host:** `localhost:3306` · **User:** `root` · **Password:** *(empty, XAMPP default)*

### `requests` Table
| Field | Type | Notes |
|-------|------|-------|
| id | INT UNSIGNED AUTO_INCREMENT | Primary key |
| resource | VARCHAR(64) | Food / Water / Medicine … |
| note | TEXT | Situation description |
| lat | DOUBLE | GPS latitude |
| lon | DOUBLE | GPS longitude |
| urgency | VARCHAR(32) | Critical / High / Urgent |
| status | VARCHAR(32) | Urgent → Assigned → Delivered |
| disaster | VARCHAR(128) | Disaster type (optional) |
| people | INT UNSIGNED | Number of people affected |
| state | VARCHAR(64) | State/region |
| cart | JSON | Item quantities e.g. `{"Rice":2}` |
| created_at | DATETIME | Auto timestamp |
| updated_at | DATETIME | Auto-updated on change |

### `telemetry` Table
| Field | Type | Notes |
|-------|------|-------|
| id | INT UNSIGNED AUTO_INCREMENT | Primary key |
| battery | TINYINT UNSIGNED | Battery % |
| lat | DOUBLE | Drone latitude |
| lon | DOUBLE | Drone longitude |
| altitude | FLOAT | Metres |
| speed | FLOAT | m/s |
| heading | FLOAT | Degrees 0–360 |
| `signal` | TINYINT UNSIGNED | Signal strength (backtick — reserved keyword) |
| drone_status | VARCHAR(32) | Idle / Flying / Landing |
| recorded_at | DATETIME | Auto timestamp |

### `drone_commands` Table
| Field | Type | Notes |
|-------|------|-------|
| id | INT UNSIGNED AUTO_INCREMENT | Primary key |
| command | VARCHAR(64) | TAKEOFF / LAND / RTH … |
| issued_at | DATETIME | Auto timestamp |

---

## 📡 DRONE INTEGRATION LOGIC

Drone hardware sends:

```json
{
  "battery": 85,
  "lat": 10.234,
  "lon": 78.123,
  "status": "Flying"
}
```

Backend broadcasts this to ground station.

---

## 🔐 SECURITY LAYER (Future Upgrade)
- Admin login for Ground Station
- User authentication (optional)
- JWT token validation
- Role-based access

---

## 🎨 COMPLETE SYSTEM DIAGRAM

```
                ┌───────────────┐
                │   USER WEB    │
                └──────┬────────┘
                       │ REST POST /request
                       ▼
                ┌───────────────┐
                │   BACKEND     │
                │ Flask + Socket│
                │ mysql-connector│
                └──────┼────────┘
                       │
        ┌──────────┼──────────────┬───────┐
        ▼              ▼              ▼
  Ground Station   Drone Hardware  XAMPP MySQL
  (React + Leaflet)                 ndrf_gcs DB
                                  ┌───────────────┐
                                  │ requests      │
                                  │ telemetry     │
                                  │ drone_commands│
                                  └───────────────┘
```

---

## 🎯 WHAT YOUR PROJECT ACHIEVES

✔ Real-time disaster request handling  
✔ **MySQL persistent storage via XAMPP**  
✔ Live drone telemetry monitoring  
✔ Manual & auto drone control  
✔ GPS-based targeting  
✔ Full-stack real-time architecture  
✔ Modern UI frontend  
✔ Hardware + software integration  

**This is a complete end-to-end UAV disaster response system.**

---

## 🚀 Getting Started

### 1️⃣ XAMPP — Start MySQL
1. Download & install **XAMPP** from https://www.apachefriends.org
2. Open **XAMPP Control Panel** → click **Start** next to **MySQL**
3. Open **phpMyAdmin** → http://localhost/phpmyadmin
4. Click **Import** tab → choose `backend/ndrf_schema.sql` → click **Go**
   - This creates the `ndrf_gcs` database with all tables

### 2️⃣ Backend
```bash
cd backend
pip install flask flask-socketio flask-cors mysql-connector-python
python server.py
```
Expected output:
```
✅  MySQL connection pool ready
🚀  NDRF GCS server starting on http://localhost:5000
    MySQL host: localhost:3306  DB: ndrf_gcs
```
> If you see `❌ MySQL connection failed` → make sure XAMPP MySQL is running and the schema was imported.

### 3️⃣ Ground Station
```bash
cd ground
npm install
npm run dev
```

### 4️⃣ User Web
```bash
cd user
npm install
npm run dev
```

### 🔗 Default URLs
| Service | URL |
|---------|-----|
| User App | http://localhost:5173 |
| Ground Station | http://localhost:5174 |
| Backend API | http://localhost:5000 |
| phpMyAdmin | http://localhost/phpmyadmin |

---

## 📦 Project Structure

```
DBMS FRO/
├── user/                        # Victim-facing relief app
│   ├── src/
│   │   ├── components/          # RequestForm, ResourceCard
│   │   ├── pages/               # UserHome
│   │   ├── services/            # api.js, socket.js
│   │   └── App.jsx
│   └── package.json
├── ground/                      # Ground Control Station dashboard
│   ├── src/
│   │   ├── components/          # MapPanel, TelemetryPanel, DroneControl, RequestPanel
│   │   ├── context/             # RequestsContext (MySQL-backed)
│   │   ├── pages/               # Dashboard
│   │   ├── services/            # api.js, socket.js
│   │   └── App.jsx
│   └── package.json
└── backend/
    ├── server.py                # Flask + Socket.IO + MySQL connection pool
    └── ndrf_schema.sql          # ← Import this into phpMyAdmin once
```
1. Open XAMPP Control Panel → Start MySQL
2. Open phpMyAdmin (http://localhost/phpmyadmin)
3. Click "Import" → select  backend/ndrf_schema.sql  → Go
4. In terminal:  python backend/server.py