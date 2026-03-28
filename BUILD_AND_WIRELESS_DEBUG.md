# React Native Build & Wireless ADB Debugging Guide

## Step 1: Verify Java Installation

First, check if Java (JDK 11+) is properly installed:

```powershell
# Check if javac is available
javac -version
```

**If Java is not found**, install it:
- Download from: https://www.oracle.com/java/technologies/downloads/
- Or install via Android Studio's Bundle
- Set JAVA_HOME environment variable:

```powershell
# Via PowerShell (temporary)
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17.0.x"  # Replace with your JDK version

# Verify
java -version
```

---

## Step 2: Setup Android SDK & ADB

Ensure Android SDK is properly installed:

```powershell
# Find your Android SDK location (usually one of these)
$env:ANDROID_HOME = "C:\Users\<YourUsername>\AppData\Local\Android\Sdk"
# or
$env:ANDROID_HOME = "C:\Android\Sdk"

# Verify ADB is accessible
adb version
```

---

## Step 3: Enable USB Debugging & Wireless Debugging on Phone

1. **Enable Developer Options:**
   - Settings > About Phone
   - Tap "Build Number" 7 times
   - Go back - you should see "Developer Options"

2. **Enable USB Debugging:**
   - Settings > Developer Options > USB Debugging (ON)
   - Also enable "USB Debugging (Security settings)" if available

3. **Setup Wireless Debugging:**
   - Settings > Developer Options > Wireless Debugging (ON)
   - Tap "Wireless Debugging"
   - Tap "Pair with QR code" or "Pair device with code"
   - Scan QR or enter the pairing code
   - Note the IP address and port shown (e.g., 192.168.x.x:5555)

---

## Step 4: Connect Phone via Wireless ADB

```powershell
# Connect to your phone (use IP:PORT from wireless debugging)
adb connect 192.168.x.x:5555

# Verify connection
adb devices
# Should show something like: 192.168.x.x:5555  device

# If it shows "unauthorized", accept the prompt on your phone
```

---

## Step 5: Build the Debug APK

Once Java, SDK, and ADB are working:

```powershell
cd "d:\projects\DBMS\CODE\DBMS FRO\user"

# Build debug APK
npm run build-debug

# The APK will be at: android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Step 6: Install APK on Device

```powershell
cd "d:\projects\DBMS\CODE\DBMS FRO\user"

# Install via wireless connection
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Or use react-native CLI
npx react-native run-android --deviceId=192.168.x.x:5555
```

---

## Step 7: Start Metro Server & Debug

```powershell
# Terminal 1: Start Metro bundler
cd "d:\projects\DBMS\CODE\DBMS FRO\user"
npm start

# Terminal 2: Install and run app
cd "d:\projects\DBMS\CODE\DBMS FRO\user"
npx react-native run-android --deviceId=192.168.x.x:5555
```

---

## Troubleshooting

### ADB Connection Issues
```powershell
# Reset ADB daemon
adb kill-server
adb start-server
adb connect 192.168.x.x:5555
```

### "JAVA_HOME not found"
```powershell
# Set Java path permanently in environment variables
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17.0.x"

# Verify
echo $env:JAVA_HOME
```

### Android SDK not found
```powershell
# Set Android SDK path
$env:ANDROID_HOME = "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"
```

### Port already in use
```powershell
# If port 5555 is busy, use a different port
adb connect 192.168.x.x:5037
```

### Build fails with "Execution failed for task"
```powershell
# Clean build
cd user/android
.\gradlew.bat clean
cd ..
npm run build-debug
```

---

## Quick Reference Commands

```powershell
# List connected devices
adb devices

# Connect wireless
adb connect 192.168.x.x:5555

# Disconnect
adb disconnect 192.168.x.x:5555

# Build
npm run build-debug

# Install APK
adb install android/app/build/outputs/apk/debug/app-debug.apk

# View logs
adb logcat

# Start bundler
npm start

# Run app
npx react-native run-android
```

