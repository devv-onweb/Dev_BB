@echo off
title Blood Bank Management System Launcher
color 0A

echo ================================================================
echo   STARTING BLOOD BANK MANAGEMENT SYSTEM...
echo ================================================================
echo.

set "PATH=C:\Program Files\nodejs;%PATH%"

:: 1. Clean up any existing processes on ports 5000 and 5173
echo [1/3] Clearing previous instances on ports 5000 and 5173...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetTCPConnection -LocalPort 5000, 5173 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"

:: 2. Launch Backend API Server in a dedicated background window
echo [2/3] Starting Backend Server (Port 5000)...
start "BloodBank-Backend-5000" /min cmd /k "cd /d d:\Dev_apps\DEV_D\server && set PATH=C:\Program Files\nodejs;%%PATH%% && node dist/index.js"

:: 3. Launch Frontend Client in a dedicated background window
echo [3/3] Starting Frontend Web Client (Port 5173)...
start "BloodBank-Frontend-5173" /min cmd /k "cd /d d:\Dev_apps\DEV_D\client && set PATH=C:\Program Files\nodejs;%%PATH%% && npx.cmd vite --port 5173 --host"

:: 4. Wait 3 seconds for servers to initialize
echo.
echo Waiting for servers to initialize...
ping -n 4 127.0.0.1 >nul

:: 5. Open Default Web Browser
echo Opening Blood Bank in your default browser...
start http://localhost:5173

echo.
echo ================================================================
echo   [SUCCESS] BLOOD BANK IS NOW RUNNING LIVE!
echo   Web Address: http://localhost:5173
echo.
echo   To STOP the servers anytime, double-click:
echo   'Hard_Kill_All.bat' or 'Stop_BloodBank.bat'
echo ================================================================
ping -n 3 127.0.0.1 >nul
exit
