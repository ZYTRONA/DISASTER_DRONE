# Backend Network Error - Complete Fix Guide

## ❌ The Problem
```
ERROR  ❌ API Error: Network Error (No status)
```

This error means the mobile app **cannot reach the backend server** at `http://10.158.169.62:5000`.

## ✅ How to Fix

### Step 1: Start the Backend Server

Open a terminal and run:

```bash
cd "d:\projects\DBMS\CODE\DBMS FRO\backend"
python server.py
```

Expected output:
```
✅ Database connected at mysql://...
✅ API initialized with URL: http://0.0.0.0:5000
* Running on http://0.0.0.0:5000/
```

### Step 2: Verify Backend is Running

Check if the backend is listening on port 5000:

**Windows (PowerShell):**
```powershell
# Check if port 5000 is listening
netstat -ano | findstr ":5000"

# If running, you should see something with PID number
```

**Test the backend directly:**
```bash
curl http://10.158.169.62:5000/health
# Should return: {"status":"ok"}
```

### Step 3: Check Configuration

Verify `.env` file in the `user/` folder:

```env
EXPO_PUBLIC_API_URL=http://10.158.169.62:5000
EXPO_PUBLIC_SOCKET_URL=http://10.158.169.62:5000
EXPO_PUBLIC_SOCKET_TRANSPORT=polling
EXPO_PUBLIC_TIMEOUT_MS=10000
```

**Important:** Replace `10.158.169.62` with your actual machine IP if different.

### Step 4: Database Setup

The backend requires MySQL to be running with the NDRF database.

**Option A: Using XAMPP (if already installed)**
1. Start XAMPP Control Panel
2. Start **MySQL** module
3. Backend should auto-connect

**Option B: Manual MySQL Check**
```powershell
# Check if MySQL is running
netstat -ano | findstr ":3306"

# If not running, start MySQL service
net start MySQL80  # or MySQL57, depending on version
```

**Option C: Check Database Exists**
```bash
mysql -u root -p -e "USE ndrf_schema; SHOW TABLES;"
# If error "Unknown database", run the schema setup
mysql -u root -p < backend/ndrf_schema.sql
```

## 🔍 Troubleshooting

### Issue: "Connection refused" on port 5000

**Solution:**
1. ✅ Verify backend server is running: `python server.py`
2. ✅ Check Windows Firewall allows port 5000
3. ✅ Wait 2-3 seconds after starting before making requests

### Issue: "Unknown database 'ndrf_schema'"

**Solution:**
```bash
# Set up the database
cd backend
mysql -u root -p < ndrf_schema.sql

# Then start the server
python server.py
```

### Issue: MySQL not running

**Solution:**
```powershell
# Start MySQL service
net start MySQL80

# Or use XAMPP Control Panel to start MySQL
```

### Issue: Backend starts but app still shows network error

**Solution:**
1. Go to **Settings** screen in app
2. Check "Backend Status" - should show "✅ Connected"
3. If showing "❌ Not Reachable", check:
   - Backend server is still running
   - Correct IP in `.env` file
   - Network connection is active
   - No firewall blocking port 5000

## 📋 Common Network Error Causes

| Error | Cause | Fix |
|-------|-------|-----|
| `Network Error (No status)` | Backend server not running | Start `python server.py` |
| Timeout after 10 seconds | Backend not responding | Check if server is stuck, restart |
| Connection refused | Port 5000 in use or firewall blocked | Check firewall, change port in server.py |
| DNS resolution error | Wrong IP in .env | Check actual machine IP: `ipconfig` |
| Database connection error | MySQL not running | Start MySQL service or XAMPP |

## ✅ Verification Checklist

- [ ] Backend server running (console shows listening on port 5000)
- [ ] MySQL database running (XAMPP or service)
- [ ] Database schema created (ndrf_schema tables exist)
- [ ] .env file has correct IP address
- [ ] Windows Firewall allows port 5000
- [ ] Settings screen shows "✅ Connected" for backend
- [ ] Test request succeeds without "Network Error"

## 🚀 Quick Start Command

Run everything in sequence:

```powershell
# 1. Start MySQL (if using XAMPP, use its control panel instead)
net start MySQL80

# 2. Set up database (one-time only)
cd "d:\projects\DBMS\CODE\DBMS FRO\backend"
mysql -u root -p < ndrf_schema.sql

# 3. Start backend server
python server.py

# 4. In another terminal, start Expo app (from user folder)
cd "d:\projects\DBMS\CODE\DBMS FRO\user"
npm start
```

The app should now connect successfully!
