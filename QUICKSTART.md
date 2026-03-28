# NDRF Application - Quick Start Guide

Get the entire NDRF (National Disaster Relief Foundation) application running locally in 15 minutes.

## Prerequisites

Ensure you have installed:
- **Node.js** 18+ ([download](https://nodejs.org/))
- **Python** 3.8+ ([download](https://python.org/))
- **MySQL** 8.0+ ([download](https://mysql.com/))

Verify installations:
```bash
node --version
npm --version
python --version
mysql --version
```

## Option A: Quick Start (All in One)

Run this script to set up everything at once:

```bash
# From project root
./scripts/setup.sh
```

## Option B: Manual Setup (Recommended for First Time)

### Step 1: Backend Setup (5 minutes)

```bash
cd backend

# Copy environment template
cp .env.example .env

# Edit .env with your MySQL credentials
# Replace these with your actual values:
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=your_password

# Install Python dependencies
pip install -r requirements.txt

# Start backend server
python server_enhanced.py
```

✅ Backend running at: **http://localhost:5000**

*Keep this terminal open*

### Step 2: Ground Station Setup (5 minutes)

Open a **new terminal** window:

```bash
cd ground

# Copy environment template
cp .env.example .env

# For local testing:
# VITE_API_URL=http://localhost:5000/api
# VITE_SOCKET_URL=http://localhost:5000

# For testing on other machines on same network:
# VITE_API_URL=http://192.168.1.X:5000/api        # Replace X with your machine's IP
# VITE_SOCKET_URL=http://192.168.1.X:5000

# Install dependencies
npm install

# Start development server
npm run dev
```

✅ Ground Station running at: **http://localhost:5173**

*Keep this terminal open*

### Step 3: Mobile App Setup (5 minutes)

Open a **third terminal** window:

```bash
cd user

# Copy environment template
cp .env.example .env

# Edit .env: Use your machine's actual IP, not localhost
# EXPO_PUBLIC_API_URL=http://192.168.1.X:5000/api
# EXPO_PUBLIC_SOCKET_URL=http://192.168.1.X:5000

# Find your IP:
# Windows: ipconfig (look for IPv4 Address)
# Mac/Linux: ifconfig (look for inet address)

# Install dependencies
npm install

# Start Expo development server
npm start
```

When prompted:
- Press `w` for web browser (at http://localhost:8081), or
- Press `i` for iOS simulator, or
- Press `a` for Android emulator, or
- Scan QR code with Expo Go app on your phone

✅ Mobile App running at: **http://localhost:8081** or on your phone

## Quick Test Workflow

Once all services are running:

### 1. Test Backend API

```bash
# From any terminal
curl http://localhost:5000/api/requests
```

Should return: `{"requests": []}`

### 2. Test Ground Station

Open browser: **http://localhost:5173**

Should show map with empty request list

### 3. Test Mobile App

Visit: **http://localhost:8081** (or scan QR code)

Should show category selection screen

## Common Issues & Quick Fixes

### Port Already in Use

```bash
# Find what's using port 5000 (backend)
lsof -i :5000

# Find what's using port 5173 (ground)
lsof -i :5173

# Kill process (replace PID with the number shown)
kill -9 PID
```

### Database Connection Failed

```bash
# Verify MySQL is running
mysql -u root -p

# If asked for password, enter the password you set in .env
# If it connects, you're good!

# If not running:
# Windows: net start MySQL80 (or MySQL57, MySQL56, etc.)
# Mac: brew services start mysql
# Linux: sudo systemctl start mysql
```

### Environment Variables Not Loading

```bash
# Make sure .env files exist (not .env.example)
ls -la backend/.env      # Should exist
ls -la ground/.env       # Should exist
ls -la user/.env         # Should exist

# If missing, copy them:
cd backend && cp .env.example .env
cd ground && cp .env.example .env
cd user && cp .env.example .env

# Restart your dev servers after creating .env files
```

### CORS Error When Calling API

Make sure `CORS_ORIGINS` in `backend/.env` includes:
```
CORS_ORIGINS=http://localhost:5173,http://localhost:8081,http://192.168.1.X
```

### Mobile App Returns "Connection Refused"

- Make sure you're using your machine's **actual IP** in `user/.env`, not `localhost`
- On same WiFi network as development machine
- Check firewall isn't blocking port 5000

## Testing the Full Workflow

### 1. Create a Request (Mobile App)

1. Open mobile app (http://localhost:8081)
2. Select category: "Food" or "Medicine"
3. Add items
4. Click Submit
5. Allow location access
6. Confirm

### 2. View Request (Ground Station)

1. Open ground station (http://localhost:5173)
2. Should see new request as marker on map
3. Click marker for details

### 3. Track Delivery (Mobile App)

1. Go back to mobile app
2. See request status: "Pending"
3. Wait for backend to assign drone (or manually assign in ground station)
4. Status updates to "In Transit"
5. Real-time location updates on map

## File Structure Overview

```
.
├── backend/              # Flask Python server
│   ├── server.py         # Main Flask app
│   ├── server_enhanced.py    # ✨ NEW: With JWT & env support
│   ├── .env.example      # Environment template
│   ├── .env              # Your local config (create by copying)
│   └── requirements.txt  # Python dependencies

├── ground/               # Vue.js/React web dashboard
│   ├── src/
│   │   ├── services/
│   │   │   ├── api.js    # ✨ UPDATED: Env variables + JWT
│   │   │   ├── socket.js # ✨ UPDATED: Env variables
│   │   └── ...
│   ├── .env.example      # Environment template
│   ├── .env              # Your local config (create by copying)
│   └── vite.config.js    # Vite build config

├── user/                 # React Native Expo mobile app
│   ├── src/
│   │   ├── services/
│   │   │   ├── api.js    # ✨ UPDATED: Env variables + JWT
│   │   │   ├── socket.js # ✨ UPDATED: Env variables
│   │   └── ...
│   ├── .env.example      # Environment template
│   ├── .env              # Your local config (create by copying)
│   └── app.json          # Expo app config

└── ENVIRONMENT_SETUP.md  # Detailed env configuration guide
```

## Next Steps

After getting everything running:

1. **Explore the UI**: Get familiar with both ground station and mobile app
2. **Test Real-Time Updates**: Make a request and watch it update in real-time
3. **Check Settings**: Mobile app has SettingsScreen to configure backend URL
4. **Review Code**: Check out the enhanced services in ground/src/services/ and user/src/services/
5. **Read Documentation**:
   - `ENVIRONMENT_SETUP.md` - Complete env configuration guide
   - `INTEGRATION_CHECKLIST.md` - What's implemented vs planned
   - `PROJECT_ANALYSIS.md` - Architecture overview (if available)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    NDRF System                           │
├─────────────────┬─────────────────┬────────────────────┤
│                 │                 │                    │
│  Mobile App     │  Ground Station │    Backend         │
│  (React Native) │   (React Web)   │   (Flask/Python)   │
│                 │                 │                    │
│  · Category     │  · Request Map  │  · REST API        │
│    Selection    │  · Drone        │  · Request Mgmt    │
│  · Item         │    Telemetry    │  · Real-time       │
│    Selection    │  · Search &     │    Tracking        │
│  · Delivery     │    Assign       │  · Database        │
│    Tracking     │  · Live Requests│    (MySQL)         │
│                 │  · Admin        │  · JWT Auth        │
│                 │    Controls     │    (framework)     │
│                 │                 │                    │
└────────┬────────┴────────┬────────┴────────┬───────────┘
         │                 │                 │
         └─────────────────┼─────────────────┘
              Socket.IO & REST API
                Over HTTP
```

## Key Commands Reference

```bash
# Terminal 1: Backend
cd backend
python server_enhanced.py

# Terminal 2: Ground Station
cd ground
npm run dev

# Terminal 3: Mobile App
cd user
npm start

# Stop any service
# Press Ctrl+C in the terminal

# View logs
# Check the terminal output for errors

# Reset everything
cd backend && python server_enhanced.py --fresh
# or delete data as needed
```

## Network Testing (Multiple Machines)

To test ground station and mobile app on different machines:

### On Development Machine (where backend runs):

```bash
# Find your IP
ipconfig (Windows) or ifconfig (Mac/Linux)
# e.g., 192.168.1.100

# backend/.env
CORS_ORIGINS=http://192.168.1.100:3000,http://192.168.1.100:8081

# ground/.env
VITE_API_URL=http://192.168.1.100:5000/api
VITE_SOCKET_URL=http://192.168.1.100:5000

# user/.env
EXPO_PUBLIC_API_URL=http://192.168.1.100:5000/api
EXPO_PUBLIC_SOCKET_URL=http://192.168.1.100:5000
```

### On Other Machines:

```bash
# Open browser to development machine
http://192.168.1.100:5173  # Ground Station

# For mobile app on phone
# Scan QR code from http://192.168.1.100:8081 with Expo Go
```

## Performance Tips

1. **Use `npm run build`** instead of just `npm start` for production-like testing
2. **Mobile app**: Reduce particle count in browser for better performance
3. **Ground station**: Close unnecessary browser tabs
4. **Backend**: Monitor MySQL for slow queries if requests feel slow

## Success Indicators

✅ Backend starts without errors  
✅ Ground station loads in browser  
✅ Mobile app shows screens  
✅ API calls resolve without CORS errors  
✅ Socket.IO shows connected in console logs  
✅ Creating request updates map in real-time  
✅ Status changes broadcast to all clients  

## Need Help?

1. Check terminal output for specific error messages
2. Review `ENVIRONMENT_SETUP.md` troubleshooting section
3. Verify all `.env` files exist and have correct values
4. Check ports 5000, 5173, 8081 are not in use
5. Ensure MySQL is running and credentials are correct
6. Review `INTEGRATION_CHECKLIST.md` for what's implemented

## What's New in This Version

✨ **Environment Variables**: All hardcoded URLs replaced with `.env` configuration  
✨ **JWT Authentication**: Framework ready for implementation  
✨ **Multi-Service Config**: Separate configs for backend, ground, and mobile  
✨ **Enhanced Error Handling**: Better logging and error messages  
✨ **Production Ready**: Structured for easy deployment  

Enjoy using NDRF! 🎉
