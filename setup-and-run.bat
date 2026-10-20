@echo off
title ParkCloud - Smart Parking Management System Setup
color 0b
echo ==========================================================
echo        ParkCloud India Edition - Friend Laptop Setup
echo ==========================================================
echo.
echo [1/3] Checking Node.js installation...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] Node.js is not found in PATH.
    echo.
    echo If you just want to RUN the app without developing, you can
    echo double-click the portable desktop application directly at:
    echo frontend\dist_electron\win-unpacked\ParkCloud.exe
    echo.
    echo If you want to develop or edit code, install Node.js from:
    echo https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js detected:
node -v
echo.

echo [2/3] Verifying dependencies...
if not exist "frontend\node_modules\" (
    echo Installing dependencies for frontend (first-time setup)...
    cd frontend
    call npm install
    cd ..
) else (
    echo [OK] Dependencies already installed.
)
echo.

echo ==========================================================
echo  Choose how to launch ParkCloud:
echo ==========================================================
echo  [1] Open Web Version in Browser (Vite dev server)
echo  [2] Launch Native Windows Desktop App (ParkCloud.exe)
echo  [3] Run Automated Tests
echo  [4] Exit
echo ==========================================================
set /p choice="Enter your choice (1, 2, 3, or 4): "

if "%choice%"=="1" (
    echo Starting local web server...
    cd frontend
    call npm run dev
)
if "%choice%"=="2" (
    echo Launching ParkCloud Windows Desktop App...
    start "" "frontend\dist_electron\win-unpacked\ParkCloud.exe"
)
if "%choice%"=="3" (
    echo Running automated test suite...
    node tests/frontend.test.js
    pause
)
