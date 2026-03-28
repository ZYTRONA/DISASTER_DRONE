# Implementation Details & Technical Reference

Comprehensive technical documentation for the NDRF application configuration, services, and architecture.

## Table of Contents

1. [Environment Variable System](#environment-variable-system)
2. [API Service Layer](#api-service-layer)
3. [Socket.IO Service Layer](#socketio-service-layer)
4. [Authentication Architecture](#authentication-architecture)
5. [Multi-Drone System](#multi-drone-system)
6. [Error Handling](#error-handling)
7. [Real-Time Communication](#real-time-communication)
8. [Database Schema](#database-schema)
9. [Deployment Architecture](#deployment-architecture)

## Environment Variable System

### Overview

The application uses environment variables to configure runtime behavior without code changes. This follows the [12-Factor App](https://12factor.net/) methodology.

### Variable Resolution Priority

#### Ground Station (Vite)
```
1. System environment variables (prefixed with VITE_)
2. .env file in project root
3. .env.local file (ignored in git)
4. Hardcoded fallbacks in code
```

**Usage in code:**
```javascript
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
```

#### Mobile App (Expo)
```
1. System environment variables (prefixed with EXPO_PUBLIC_)
2. .env file in project root
3. app.json eas.json for build configuration
4. Hardcoded fallbacks in code
```

**Usage in code:**
```javascript
const API_URL = import.meta.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api";
```

#### Backend (Flask/Python)
```
1. System environment variables
2. .env file loaded by python-dotenv
3. Hardcoded fallbacks in code
```

**Usage in code:**
```python
from dotenv import load_dotenv
import os

load_dotenv()
DB_HOST = os.getenv('DB_HOST', 'localhost')
JWT_SECRET = os.getenv('JWT_SECRET', 'change_me_in_production')
```

### Environment Variables Reference

#### Backend Variables

```bash
# Database Configuration
DB_HOST=localhost                 # MySQL host
DB_PORT=3306                      # MySQL port
DB_USER=root                      # MySQL username
DB_PASSWORD=your_password         # MySQL password (⚠️ NOT 'password')
DB_NAME=ndrf_gcs                  # Database name

# Security
JWT_SECRET=your_very_secret_key_change_this_in_production  # ⚠️ Min 32 chars

# Server Configuration
FLASK_ENV=development             # development|production
DEBUG=true                        # true|false (set to false in prod)
LOG_LEVEL=INFO                    # DEBUG|INFO|WARNING|ERROR

# CORS Configuration
CORS_ORIGINS=http://localhost:5173,http://localhost:8081
```

#### Ground Station Variables

```bash
# API Configuration (must include /api path)
VITE_API_URL=http://localhost:5000/api

# Socket.IO Configuration (no /api path)
VITE_SOCKET_URL=http://localhost:5000

# Application Configuration
VITE_APP_NAME=NDRF Ground Control Station

# Map Configuration
VITE_MAX_MAP_ZOOM=20
VITE_DEFAULT_MAP_CENTER=28.6139,77.2090

# Update Intervals
VITE_DRONE_UPDATE_INTERVAL=5000   # milliseconds
```

#### Mobile App Variables

```bash
# API Configuration (must include /api path)
EXPO_PUBLIC_API_URL=http://192.168.1.1:5000/api

# Socket.IO Configuration (no /api path)
EXPO_PUBLIC_SOCKET_URL=http://192.168.1.1:5000

# Application Configuration
EXPO_PUBLIC_APP_VERSION=1.0.0
EXPO_PUBLIC_TIMEOUT_MS=30000      # milliseconds

# Location Configuration
EXPO_PUBLIC_MAX_LOCATION_ACCURACY=50  # meters
```

## API Service Layer

### Ground Station API Service

**File:** `ground/src/services/api.js`

#### Architecture

```
┌──────────────────────────┐
│  Component (Map.jsx)      │
└─────────────┬──────────────┘
              │ calls
              ▼
┌──────────────────────────────┐
│  api.getRequests()           │
└─────────────┬────────────────┘
              │ creates
              ▼
┌──────────────────────────────────────┐
│  fetchAPI('/requests', {...})         │
│  ├─ Builds URL from VITE_API_URL     │
│  ├─ Adds headers (JWT, User-Agent)   │
│  ├─ Sets timeout (10s)               │
│  ├─ Handles AbortSignal              │
│  └─ Returns parsed JSON              │
└─────────────┬──────────────────────────┘
              │ uses
              ▼
┌──────────────────────────────────────┐
│  fetch(url, options)                  │
│  ─ Native browser API                │
└───────────────────────────────────────┘
```

#### Key Functions

**1. fetchAPI() - Core HTTP wrapper**
```javascript
async function fetchAPI(endpoint, options = {})
```
- Centralized fetch with error handling
- Timeout management (10 seconds default)
- JWT token support
- Error logging with status codes
- Throws detailed errors with status property

**2. getRequests() - Fetch all requests**
```javascript
api.getRequests() // GET /requests
```
Returns: `{ requests: [...] }`

**3. searchRequests() - Search with filters**
```javascript
api.searchRequests({
  status: 'pending',
  resource: 'food',
  dateRange: '7d',
  location: `${lat},${lon}`,
  radius: 10
})
```
Returns: Filtered request list

**4. assignRequest() - Assign to specific drone**
```javascript
api.assignRequest(requestId, droneId)
// POST /assign/{requestId}
// Body: { drone_id: droneId }
```

**5. autoAssignRequest() - Let system choose drone**
```javascript
api.autoAssignRequest(requestId)
// POST /assign/{requestId}/auto
```
Triggers backend auto-assignment algorithm

**6. getDrones() - Get drone fleet**
```javascript
api.getDrones()
// GET /drones
```
Returns: Array of all drones with status

**7. login() - User authentication (future)**
```javascript
const response = await api.login(email, password)
// Stores token in localStorage
```

#### Error Handling Pattern

```javascript
try {
  const data = await api.getRequests();
  // Use data
} catch (error) {
  console.error('API Error:', error.message);
  console.error('Status:', error.status);      // 404, 500, etc.
  console.error('Details:', error.data);       // { error: { code, message } }
  
  if (error.status === 401) {
    // Handle auth error - redirect to login
  } else if (error.status === 500) {
    // Show "Server error" message
  }
}
```

### Mobile App API Service

**File:** `user/src/services/api.js`

#### Architecture (Axios-based)

```
┌──────────────────────────┐
│  Component (Screen.jsx)   │
└─────────────┬──────────────┘
              │ calls
              ▼
┌──────────────────────────────┐
│ submitRequest({...})         │
└─────────────┬────────────────┘
              │ uses
              ▼
┌──────────────────────────────────────┐
│  getApi().post('/request', {...})    │
├─ Returns configured axios instance   │
├─ Has interceptors pre-defined        │
└─────────────┬──────────────────────────┘
              │ intercepts
              ▼
┌──────────────────────────────────────┐
│  api.interceptors.request.use()      │
│  ├─ Add JWT token to header          │
│  ├─ Log request details              │
│  └─ Add User-Agent                   │
└─────────────┬──────────────────────────┘
              │ intercepts
              ▼
┌──────────────────────────────────────┐
│  api.interceptors.response.use()     │
│  ├─ Log response data                │
│  ├─ Handle 401 (auth error)          │
│  └─ Clear token on auth error        │
└─────────────┬──────────────────────────┘
              │
              ▼
┌──────────────────────────────────────┐
│  axios.post(url, data, config)       │
│  ─ Underlying HTTP library           │
└───────────────────────────────────────┘
```

#### JWT Token Management

**Storage:**
```javascript
// Store token in AsyncStorage
await storeAuthToken(token);  // After login

// Retrieve token (automatic in interceptor)
const token = await getAuthToken();

// Clear token (automatic on 401)
await clearAuthToken();  // On logout or auth error
```

**Flow:**
```
Login → storeAuthToken() → localStorage
    ↓
Request → getAuthToken() → Added to header
    ↓
Response 401 → clearAuthToken() → localStorage cleared
    ↓
Next request → No token → Redirect to login
```

#### Error Handling Pattern

```javascript
try {
  const response = await submitRequest({...});
  // Success - response.data contains result
} catch (error) {
  if (error.response?.status === 401) {
    // Unauthorized - show login screen
    await clearAuthToken();
  } else if (error.response?.status === 500) {
    // Server error
  } else if (error.message === 'Network Error') {
    // No internet connection
  }
}
```

## Socket.IO Service Layer

### Ground Station Socket.IO

**File:** `ground/src/services/socket.js`

#### Connection Setup

```javascript
const socket = io(BACKEND_URL, {
  autoConnect: true,           // Connect immediately
  reconnection: true,          // Reconnect on disconnect
  reconnectionAttempts: 10,    // Try 10 times
  reconnectionDelay: 1000,     // Start with 1s delay
  reconnectionDelayMax: 5000,  // Max 5s delay
  extraHeaders: {
    "User-Agent": "NDRF-GroundStation/1.0"
  }
});
```

#### Event Listeners

**1. Connection Events**
```javascript
// Successfully connected
socket.on('connect', () => {
  console.log('Connected:', socket.id);
  // Ready to send/receive events
});

// Disconnected
socket.on('disconnect', (reason) => {
  // reason: 'client namespace disconnect', 'server namespace disconnect', etc.
});

// Connection error
socket.on('connect_error', (error) => {
  // Authentication failed, server error, etc.
});
```

**2. Real-Time Updates**
```javascript
// Drone telemetry update
socket.on('telemetry:update', (data) => {
  // Update map with new drone position
  // { drone_id, latitude, longitude, battery, etc. }
});

// Request status change
socket.on('request:status', (data) => {
  // { request_id, status, drone_id, etc. }
  // Update request in the list
});

// Drone status change
socket.on('drone:status', (data) => {
  // { drone_id, status, battery, etc. }
  // Update drone indicator
});

// General broadcast
socket.on('broadcast', (data) => {
  // Emergency alerts, system messages, etc.
});
```

#### Cross-Component Communication

The socket service dispatches window events so components can listen:

```javascript
// In socket.js
window.dispatchEvent(
  new CustomEvent('droneUpdate', { detail: data })
);

// In component
useEffect(() => {
  window.addEventListener('droneUpdate', (event) => {
    console.log('Drone updated:', event.detail);
  });
}, []);
```

### Mobile App Socket.IO

**File:** `user/src/services/socket.js`

#### Connection with JWT

```javascript
const extraHeaders = {
  'User-Agent': `NDRF-MobileApp/${version}`,
  'Authorization': `Bearer ${token}` // JWT token if available
};

const socket = io(BACKEND_URL, {
  transports: ['websocket', 'polling'],  // Try websocket first, fallback to polling
  autoConnect: true,
  extraHeaders
});
```

#### Real-Time Tracking

**1. Status Updates**
```javascript
socket.on('status_update', (data) => {
  // Received when request status changes
  // { status, timestamp, location, drone_id, etc. }
  dispatch({
    type: 'UPDATE_REQUEST_STATUS',
    payload: data
  });
});
```

**2. Drone Telemetry**
```javascript
socket.on('drone:telemetry', (data) => {
  // Real-time drone position and stats
  // Update UI with estimated arrival time, etc.
});
```

#### Helper Functions

```javascript
// Emit event to server
emitEvent('user:acknowledge', { request_id });

// Listen for specific event
onEvent('delivery:complete', (data) => {
  console.log('Delivery finished:', data);
});

// Stop listening
offEvent('delivery:complete', handler);
```

## Authentication Architecture

### JWT Framework (Ready for Implementation)

#### Overview

```
Frontend                Backend
┌──────────────┐
│ credentials  │
└──────┬───────┘
       │ POST /auth/login
       ├──────────────────────────────────┐
       │                                  ▼
       │                      ┌────────────────────┐
       │                      │ Hash password      │
       │                      │ Compare with DB    │
       │                      │ Create JWT token   │
       │                      └────────────────────┘
       │                                  │
       │ { token: "eyJhb..." }            │
       │  { user: { id, email, role } }  │
       │ ◀─────────────────────────────────┤
       │
       ├─> localStorage.setItem('token')
       │
       ▼
┌─────────────────────┐
│ Next API Call       │
├─────────────────────┤
│ Authorization:      │
│ Bearer eyJhb...     │
└─────────────────────┘
       │
       │ GET /api/requests
       ├──────────────────────────────────┐
       │                                  ▼
       │                      ┌────────────────────┐
       │                      │ Decode JWT token   │
       │                      │ Verify signature   │
       │                      │ Check expiration   │
       │                      │ Verify user exists │
       │                      └────────────────────┘
       │                                  │
       │ 200 OK - { requests: [...] }    │
       │ or 401 Unauthorized              │
       │ ◀─────────────────────────────────┤
```

#### Token Structure

```
JWT Token = Header.Payload.Signature

Header: { type: "JWT", alg: "HS256" }

Payload: {
  user_id: "user123",
  email: "operator@ndrf.org",
  role: "operator",            // admin|operator|viewer
  iat: 1234567890,            // issued at
  exp: 1234571490             // expires in 1 hour
}

Signature: HMAC256(header + payload + JWT_SECRET)
```

#### Implementation Checklist

```python
# In backend/server.py

# Step 1: Add imports
from flask_jwt_extended import JWTManager, create_access_token, jwt_required
import bcrypt

# Step 2: Initialize JWT
jwt = JWTManager(app)

# Step 3: Create @require_auth decorator
def require_auth(f):
    @jwt_required()
    def decorated_function(*args, **kwargs):
        return f(*args, **kwargs)
    return decorated_function

# Step 4: Implement login endpoint
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not bcrypt.checkpw(data['password'].encode(), user.password_hash):
        return {'error': 'Invalid credentials'}, 401
    
    token = create_access_token(identity=user.id)
    return {
        'token': token,
        'user': {
            'id': user.id,
            'email': user.email,
            'role': user.role
        }
    }

# Step 5: Protect endpoints
@app.route('/api/requests', methods=['GET'])
@require_auth
def get_requests():
    # Now can get current user from jwt_required
    return {'requests': [...]}
```

## Multi-Drone System

### Database Schema

```sql
-- Drones fleet
CREATE TABLE drones (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100),              -- "Drone-01", "Drone-02"
  status ENUM('available', 'in-transit', 'delivering', 'maintenance'),
  battery_level INT,              -- 0-100%
  current_latitude FLOAT,         -- Current GPS location
  current_longitude FLOAT,
  max_capacity_kg FLOAT,          -- Weight capacity
  current_load_kg FLOAT,          -- Current load
  total_flights INT,              -- Statistics
  created_at TIMESTAMP
);

-- Assignment tracking
CREATE TABLE assignments (
  id VARCHAR(36) PRIMARY KEY,
  request_id VARCHAR(36),         -- Deliver this request
  drone_id VARCHAR(36),           -- With this drone
  assigned_at TIMESTAMP,          -- When assigned
  delivered_at TIMESTAMP,         -- When completed
  status ENUM('assigned', 'picked-up', 'in-transit', 'delivered', 'failed'),
  notes TEXT,
  FOREIGN KEY (request_id) REFERENCES requests(id),
  FOREIGN KEY (drone_id) REFERENCES drones(id)
);

-- Drone telemetry history
CREATE TABLE drone_telemetry (
  id INT AUTO_INCREMENT PRIMARY KEY,
  drone_id VARCHAR(36),
  timestamp TIMESTAMP,
  latitude FLOAT,
  longitude FLOAT,
  altitude FLOAT,
  battery_level INT,
  speed FLOAT,
  heading INT,
  FOREIGN KEY (drone_id) REFERENCES drones(id)
);
```

### Drone Assignment Algorithm

```python
def select_optimal_drone(request):
    """Select best drone for delivery"""
    
    # Step 1: Get all available drones
    available = Drone.query.filter_by(status='available').all()
    
    if not available:
        raise Exception('No drones available')
    
    # Step 2: Score each drone
    scores = []
    for drone in available:
        score = 0
        
        # Distance to pickup (lower is better)
        distance = calculate_distance(
            drone.latitude, drone.longitude,
            request.lat, request.lon
        )
        distance_score = 100 - (distance / max_distance * 100)
        
        # Battery remaining (higher is better)
        battery_score = drone.battery_level
        
        # Capacity check (can it carry?)
        if drone.current_load_kg + request.weight > drone.max_capacity:
            capacity_score = 0
        else:
            capacity_score = 100
        
        # Workload (how many other deliveries?)
        workload = Assignment.query.filter_by(drone_id=drone.id, status='in-transit').count()
        workload_score = 100 - (workload * 10)
        
        # Weighted score
        total_score = (
            distance_score * 0.4 +      # Distance: 40%
            battery_score * 0.3 +       # Battery: 30%
            capacity_score * 0.2 +      # Capacity: 20%
            workload_score * 0.1        # Workload: 10%
        )
        
        if total_score > 0:
            scores.append((drone, total_score))
    
    # Step 3: Return best drone
    if not scores:
        raise Exception('No suitable drones found')
    
    best_drone = max(scores, key=lambda x: x[1])[0]
    return best_drone
```

### Real-Time Drone Tracking

```javascript
// Socket.IO broadcast cycle
// Every 5 seconds:

socket.emit('telemetry:update', {
  drone_id: 'drone-01',
  timestamp: Date.now(),
  latitude: 28.6139,
  longitude: 77.2090,
  battery: 85,
  status: 'in-transit',
  target_lat: 28.6200,
  target_lon: 77.2100,
  estimated_arrival: 120  // seconds
});

// Ground station receives
socket.on('telemetry:update', (data) => {
  updateDroneMarker(data.drone_id, {
    position: [data.latitude, data.longitude],
    battery: data.battery,
    status: data.status,
    eta: data.estimated_arrival
  });
});
```

## Error Handling

### Standardized Error Response Format

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Request ID not found",
    "details": {
      "request_id": "invalid-id-format"
    }
  }
}
```

### Error Codes

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| INVALID_REQUEST | 400 | Bad request data |
| UNAUTHORIZED | 401 | Missing or invalid JWT |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource doesn't exist |
| CONFLICT | 409 | Resource already exists |
| INTERNAL_ERROR | 500 | Server error |
| SERVICE_UNAVAILABLE | 503 | Database connection failed |

### Client-Side Error Handling

```javascript
// Ground Station
try {
  const response = await api.getRequests();
  setRequests(response.data);
} catch (error) {
  if (error.status === 401) {
    // Unauthorized - show login prompt
    showModal('Please log in to continue');
  } else if (error.status === 404) {
    // Not found
    setError('Request not found');
  } else if (error.status >= 500) {
    // Server error
    setError('Server error. Please try again later.');
  } else {
    setError(error.message || 'Unknown error');
  }
}
```

## Real-Time Communication

### Message Flow

```
Event: User creates delivery request

1. Mobile App
   └─ submitRequest() → Backend /api/request [POST]

2. Backend
   └─ Create request record in DB
   └─ Emit 'request:created' to all connected ground stations

3. Ground Station
   └─ Receives 'request:created'
   └─ Adds marker to map
   └─ Updates request list

4. Backend (Auto-assignment)
   └─ select_optimal_drone()
   └─ Update request.drone_id
   └─ Emit 'request:assigned' to all clients

5. All Clients
   └─ Mobile App: Update request status to "Assigned"
   └─ Ground Station: Update marker with drone info

6. Drone picks up delivery
   └─ Drone telemetry → 'drone:status' → 'in-transit'
   └─ All clients update

7. Drone completes delivery
   └─ ConfirmationScreen.jsx (mobile) calls API
   └─ Backend emits 'delivery:complete'
   └─ All clients notified
```

### Message Frequency

- **Drone Telemetry**: Every 5 seconds
- **Status Updates**: On change (event-driven)
- **Heartbeat**: Every 30 seconds (for connection health)

## Database Schema

### Request Lifecycle

```
requests:
├─ id: UUID
├─ user_id: UUID (mobile app user)
├─ category: ENUM (food, medicine, water, etc.)
├─ items: JSON array
├─ notes: TEXT
├─ status: ENUM
│  ├─ pending: Waiting for assignment
│  ├─ assigned: Drone selected
│  ├─ in-transit: On the way
│  ├─ delivered: Complete
│  └─ failed: Delivery failed
├─ location: POINT (lat/lon)
├─ assigned_drone_id: UUID
├─ created_at: TIMESTAMP
├─ updated_at: TIMESTAMP
└─ completed_at: TIMESTAMP
```

### User Management (Future)

```
users:
├─ id: UUID
├─ email: VARCHAR
├─ password_hash: VARCHAR (bcrypt)
├─ full_name: VARCHAR
├─ role: ENUM (admin, operator, viewer)
├─ phone: VARCHAR
├─ organization: VARCHAR
├─ is_active: BOOLEAN
├─ last_login: TIMESTAMP
├─ created_at: TIMESTAMP
└─ created_by: UUID
```

## Deployment Architecture

### Development

```
┌───────────────────────────────────────┐
│  Development Machine                  │
│  ┌──────────────────────────────────┐ │
│  │ Terminal 1: Backend              │ │
│  │ python server_enhanced.py         │ │
│  │ http://localhost:5000            │ │
│  └──────────────────────────────────┘ │
│  ┌──────────────────────────────────┐ │
│  │ Terminal 2: Ground Station       │ │
│  │ npm run dev                      │ │
│  │ http://localhost:5173            │ │
│  └──────────────────────────────────┘ │
│  ┌──────────────────────────────────┐ │
│  │ Terminal 3: Mobile App           │ │
│  │ npm start                        │ │
│  │ http://localhost:8081            │ │
│  └──────────────────────────────────┘ │
│  ┌──────────────────────────────────┐ │
│  │ MySQL (localhost:3306)           │ │
│  │ Development database             │ │
│  └──────────────────────────────────┘ │
└───────────────────────────────────────┘
```

### Production

```
┌──────────────────────────────────────────────────────┐
│ Internet / Public Network                            │
└─────────────────────────┬──────────────────────────────┘
                          │
         ┌────────────────┴────────────────┐
         │                                 │
    ┌────▼──────┐                    ┌────▼──────┐
    │   Nginx   │◄─── HTTPS ────────│ CDN / WAF  │
    │  Reverse  │                    │   (DDoS)   │
    │  Proxy    │                    └───────────┘
    └────┬──────┘
         │
    ┌────▼─────────────────────┐
    │  Backend Services        │
    │  ├─ Flask (Gunicorn)     │
    │  ├─ Socket.IO (Redis)    │
    │  └─ MySQL Connection     │
    │    Pool                  │
    └────┬─────────────────────┘
         │
   ┌─────▼──────────────────┐
   │  Data Layer            │
   │  ├─ MySQL Database     │
   │  ├─ Redis Cache        │
   │  └─ Backup Storage     │
   └────────────────────────┘

Frontend Deployments:
┌─────────────────────────────────────┐
│ Ground Station (Static CDN)         │
│ - Built with: npm run build         │
│ - Served from: S3 / CloudFront      │
│ - Accessed: dashboard.ndrf.org      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Mobile App (App Store / Play Store) │
│ - Built with: Expo build            │
│ - Native: iOS / Android             │
└─────────────────────────────────────┘
```

## Performance Optimization

### Caching Strategy

```javascript
// API responses cached for 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

// In-memory cache
const cache = new Map();

async function fetchWithCache(key, fetcher) {
  if (cache.has(key)) {
    const { data, timestamp } = cache.get(key);
    if (Date.now() - timestamp < CACHE_DURATION) {
      return data;  // Fresh cached data
    }
  }
  
  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}
```

### Database Query Optimization

```sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_user_id ON requests(user_id);
CREATE INDEX idx_assignments_drone_id ON assignments(drone_id);

-- Use pagination in list endpoints
SELECT * FROM requests
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;
```

### Frontend Performance

- Lazy load map components
- Virtualize long lists (FlatList in mobile app)
- Throttle telemetry updates
- Use React.memo() for expensive components
- Code splitting for routes

## Security Consideration Details

### JWT Token Security

- Use strong secret (min 32 random characters)
- Set short expiration (1 hour for access tokens)
- Implement refresh token mechanism (optional)
- Store tokens in httpOnly cookies or secure storage
- Validate token signature on every request

### Database Security

- Use parameterized queries (prevent SQL injection)
- Encrypt passwords with bcrypt (min 10 rounds)
- Restrict database user permissions
- Enable SSL for database connections
- Regular backups to secure location

### API Security

- Enable HTTPS only (redirect HTTP to HTTPS)
- Implement rate limiting
- Validate all inputs
- Implement CORS properly
- Log and monitor access
- Use API keys for external services

---

This documentation provides technical depth for developers implementing and maintaining the NDRF system.
