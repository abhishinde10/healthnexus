@echo off
echo ====================================
echo HealthNexus Development Setup
echo ====================================
echo.

echo Installing root dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Failed to install root dependencies
    pause
    exit /b 1
)

echo.
echo Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo Failed to install backend dependencies
    pause
    exit /b 1
)

cd ..

echo.
echo Installing frontend dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo Failed to install frontend dependencies
    pause
    exit /b 1
)

cd ..

echo.
echo ====================================
echo Setup completed successfully!
echo ====================================
echo.
echo To start the application:
echo   npm run dev    (starts both frontend and backend)
echo   npm run server (starts only backend)
echo   npm run client (starts only frontend)
echo.
echo Backend will run on: http://localhost:3001
echo Frontend will run on: http://localhost:3000
echo.
pause