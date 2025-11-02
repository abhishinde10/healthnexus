@echo off
echo ====================================
echo Starting HealthNexus Development
echo ====================================
echo.

echo Starting both Backend and Frontend...
echo Backend will run on: http://localhost:3001
echo Frontend will run on: http://localhost:3000
echo.
echo Press Ctrl+C to stop both servers
echo.

start cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak > nul
start cmd /k "cd frontend && npm start"

echo.
echo Both servers are starting...
echo Check the opened command windows for server status
echo.
pause