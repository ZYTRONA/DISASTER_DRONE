# Environment Configuration Guide

This guide explains how to configure the NDRF application for different deployment environments.

## Overview

The NDRF application uses environment variables to configure backend URLs, timeouts, and other settings. This allows the same code to work in development, staging, and production environments without code changes.

## Environment Variables Hierarchy

The application uses this priority order for environment variables:

1. **Environment variables** (highest priority) - Set in `.env` files
2. **Hardcoded fallbacks** (lowest priority) - Used when env vars not defined

## Backend Setup

### Prerequisites
- Python 3.8+
- MySQL 8.0+
- pip

### Step 1: Configure Backend Environment

```bash
cd backend

# Copy example to actual .env file
cp .env.example .env

# Edit .env with your database credentials
# nano .env  (or use your preferred editor)
```

Edit `backend/.env`:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ndrf_gcs
JWT_SECRET=your_secret_key_here(change_this!)
FLASK_ENV=development
DEBUG=true
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:5173,http://localhost:8081,http://192.168.1.1
```

### Step 2: Install Python Dependencies

```bash
pip install -r requirements.txt
```

### Step 3: Initialize Database

```bash
# This will automatically create tables from ndrf_schema_enhanced.sql
python server.py  # Or server_enhanced.py if using enhanced version
```

The server will:
- Connect to MySQL using credentials from .env
- Create database if it doesn't exist
- Create all tables if they don't exist
- Start listening on http://localhost:5000

## Ground Station (Web Dashboard) Setup

### Prerequisites
- Node.js 18+
- npm

### Step 1: Configure Ground Station Environment

```bash
cd ground

# Copy example to actual .env file
cp .env.example .env

# Edit .env with your API server addresses
# nano .env  (or use your preferred editor)
```

Edit `ground/.env`:
```
# API base URL (should include /api path)
VITE_API_URL=http://localhost:5000/api

# Socket.IO URL (for real-time updates)
VITE_SOCKET_URL=http://localhost:5000

# Application display name
VITE_APP_NAME=NDRF Ground Control Station

# Map configuration
VITE_MAX_MAP_ZOOM=20
VITE_DEFAULT_MAP_CENTER=28.6139,77.2090

# Update interval for drone telemetry (milliseconds)
VITE_DRONE_UPDATE_INTERVAL=5000
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Run Development Server

```bash
npm run dev
```

The ground station will be available at:
- **Local**: http://localhost:5173
- **Network**: http://{your_ip}:5173

Environment variables are loaded automatically from `.env` file and accessible via `import.meta.env.VITE_*`

## Mobile App (React Native/Expo) Setup

### Prerequisites
- Node.js 18+
- npm
- Expo Go app on your phone (for testing)
- Or Android/iOS emulator

### Step 1: Configure Mobile App Environment

```bash
cd user

# Copy example to actual .env file
cp .env.example .env

# Edit .env with your API server addresses
# nano .env  (or use your preferred editor)
```

Edit `user/.env`:
```
# API base URL (should include /api path)
EXPO_PUBLIC_API_URL=http://192.168.1.1:5000/api

# Socket.IO URL (for real-time tracking)
EXPO_PUBLIC_SOCKET_URL=http://192.168.1.1:5000

# App version for tracking
EXPO_PUBLIC_APP_VERSION=1.0.0

# Request timeout in milliseconds
EXPO_PUBLIC_TIMEOUT_MS=30000

# Maximum location accuracy acceptable (meters)
EXPO_PUBLIC_MAX_LOCATION_ACCURACY=50
```

**Important**: Use your machine's actual IP address (192.168.1.1) instead of localhost for phone testing!

To find your machine's IP:
```bash
# Windows
ipconfig

# macOS/Linux
ifconfig
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Run Expo Development Server

```bash
npm start
```

This will show options:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Press `w` for web browser
- Scan QR code with Expo Go app

Environment variables are loaded automatically from `.env` file and accessible via `import.meta.env.EXPO_PUBLIC_*`

## API Configuration

### Backend API Endpoints

The backend exposes these main endpoints:

**Requests Management:**
- `GET /api/requests` - List all requests
- `POST /api/requests` - Create new request
- `GET /api/requests/{id}` - Get request details
- `GET /api/requests/search?...` - Search with filters

**Drone Management:**
- `GET /api/drones` - List all drones
- `GET /api/drones/{id}/telemetry` - Get drone telemetry
- `POST /api/assign/{requestId}` - Assign request to drone

**Real-time Tracking:**
- `GET /api/telemetry` - Get all active telemetry data
- Socket.IO: `onStatusUpdate` event - Real-time status changes

**Authentication (when implemented):**
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info

### Headers

All API requests should include:
```
Content-Type: application/json
Authorization: Bearer {JWT_TOKEN}  # When available
User-Agent: NDRF-GroundStation/1.0  # For ground station
User-Agent: NDRF-MobileApp/1.0      # For mobile app
```

### Response Format

All API responses follow this structure:
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

Or on error:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  }
}
```

## Development Workflow

### Full Local Development

1. **Terminal 1 - Backend**:
   ```bash
   cd backend
   python server_enhanced.py
   # Runs on http://localhost:5000
   ```

2. **Terminal 2 - Ground Station**:
   ```bash
   cd ground
   npm run dev
   # Runs on http://localhost:5173
   ```

3. **Terminal 3 - Mobile App (if testing)**:
   ```bash
   cd user
   npm start
   # Runs on http://localhost:8081 (web) or Expo on phone
   ```

### Accessing the Application

- **Ground Station**: http://localhost:5173
- **Backend API**: http://localhost:5000/api
- **Mobile App**: Expo Go app (scan QR code from `npm start`)

## Troubleshooting

### "Failed to connect to API"
- Check that backend is running: `ps aux | grep python` or `python -m flask --version`
- Verify .env URLs are correct
- Check firewall settings
- For mobile app: Use actual IP instead of localhost

### "Environment variables not loading"
- Make sure `.env` file is in the correct directory (project root)
- Variables must start with `VITE_` for ground station
- Variables must start with `EXPO_PUBLIC_` for mobile app
- Restart dev server after changing .env

### "CORS errors"
- Update CORS_ORIGINS in backend/.env
- Include all frontend URLs (localhost, IP addresses, etc.)

### "Database connection failed"
- Check MySQL is running
- Verify DB_HOST, DB_USER, DB_PASSWORD in backend/.env
- Ensure user has access to database

### "Timeout errors on mobile app"
- Increase EXPO_PUBLIC_TIMEOUT_MS in user/.env
- Check network connection
- Verify API server is reachable from phone network

## Deployment

### For Production Deployment

1. **Backend**:
   - Use `server_enhanced.py` with production settings
   - Set `FLASK_ENV=production`
   - Set `DEBUG=false`
   - Use strong JWT_SECRET
   - Configure real MySQL database
   - Use HTTPS for all URLs

2. **Ground Station**:
   - Build: `npm run build`
   - Deploy dist folder to web server
   - Update VITE_API_URL to production server
   - Enable HTTPS

3. **Mobile App**:
   - Build APK/IPA via Expo
   - Update EXPO_PUBLIC_API_URL for production
   - Submit to app stores

## Security Considerations

- ✅ Never commit `.env` file to git (only `.env.example`)
- ✅ Use strong JWT_SECRET (min 32 characters)
- ✅ Rotate secrets regularly
- ✅ Use HTTPS in production
- ✅ Validate all user inputs
- ✅ Implement rate limiting
- ✅ Keep dependencies updated

## Environment Variables Reference

### Backend (backend/.env)
| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| DB_HOST | localhost | ✅ | MySQL host |
| DB_PORT | 3306 | No | MySQL port |
| DB_USER | root | ✅ | MySQL username |
| DB_PASSWORD | - | ✅ | MySQL password |
| DB_NAME | ndrf_gcs | No | Database name |
| JWT_SECRET | - | ✅ | JWT signing secret |
| FLASK_ENV | development | No | Flask environment |
| DEBUG | true | No | Debug mode (false in prod) |
| LOG_LEVEL | INFO | No | Logging level |
| CORS_ORIGINS | localhost:5173 | No | Allowed frontend origins |

### Ground Station (ground/.env)
| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| VITE_API_URL | http://localhost:5000/api | ✅ | Backend API URL |
| VITE_SOCKET_URL | http://localhost:5000 | ✅ | Socket.IO server URL |
| VITE_APP_NAME | NDRF GCS | No | Application title |
| VITE_MAX_MAP_ZOOM | 20 | No | Map zoom limit |
| VITE_DEFAULT_MAP_CENTER | 28.6139,77.2090 | No | Default map center (lat,lon) |
| VITE_DRONE_UPDATE_INTERVAL | 5000 | No | Telemetry update interval (ms) |

### Mobile App (user/.env)
| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| EXPO_PUBLIC_API_URL | http://localhost:5000/api | ✅ | Backend API URL |
| EXPO_PUBLIC_SOCKET_URL | http://localhost:5000 | ✅ | Socket.IO server URL |
| EXPO_PUBLIC_APP_VERSION | 1.0.0 | No | App version string |
| EXPO_PUBLIC_TIMEOUT_MS | 30000 | No | Request timeout (ms) |
| EXPO_PUBLIC_MAX_LOCATION_ACCURACY | 50 | No | Max location accuracy (m) |

## Support

For issues or questions:
1. Check Troubleshooting section above
2. Review logs in console
3. Ensure all services are running
4. Verify network connectivity
5. Check environment variables are correctly set
