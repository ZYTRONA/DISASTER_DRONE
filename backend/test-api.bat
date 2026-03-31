@echo off
REM Test script to verify backend is reachable and CORS is working

echo.
echo ===== Testing Backend API =====
echo.

REM Test health endpoint
echo Testing: GET http://10.158.169.62:5000/health
curl -s http://10.158.169.62:5000/health
echo.
echo.

REM Test CORS preflight
echo Testing: OPTIONS /request (CORS preflight)
curl -s -X OPTIONS http://10.158.169.62:5000/request ^
  -H "Origin: http://localhost:19006" ^
  -H "Access-Control-Request-Method: POST" ^
  -H "Access-Control-Request-Headers: Content-Type" ^
  -v
echo.
echo.

REM Test POST request endpoint  
echo Testing: POST /request with sample data
curl -s -X POST http://10.158.169.62:5000/request ^
  -H "Content-Type: application/json" ^
  -d "{\"resource\": \"Food\", \"lat\": 11.0555838, \"lon\": 78.0471833, \"note\": \"Test request\"}"
echo.
echo.

echo ===== Tests Complete =====
echo If you see JSON responses above, the backend is working!
echo If you see "Connection refused", restart the backend with: python server.py
pause
