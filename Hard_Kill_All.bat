@echo off
title HARD KILL - Stop All Localhost and Terminals
color 0C

echo ================================================================
echo   [HARD KILL] TERMINATING ALL LOCALHOST SERVERS AND TERMINALS...
echo ================================================================
echo.

:: 1. Force kill processes on specific dev ports (5000, 5173, 3000, 5555)
echo [1/3] Terminating all processes on ports 5000, 5173, 3000, 5555...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetTCPConnection -LocalPort 5000, 5173, 3000, 5555 -ErrorAction SilentlyContinue | ForEach-Object { $procId = $_.OwningProcess; Write-Host ('Killing Process PID ' + $procId + ' on Port ' + $_.LocalPort) -ForegroundColor Yellow; Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue }"

:: 2. Force kill all BloodBank titled windows
echo [2/3] Closing BloodBank terminal windows...
taskkill /F /FI "WINDOWTITLE eq BloodBank-*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Blood Bank*" >nul 2>&1

:: 3. Force kill all lingering Node.js and TSX processes
echo [3/3] Terminating any orphan node / tsx processes...
taskkill /F /IM node.exe /T >nul 2>&1

echo.
echo ================================================================
echo   [SUCCESS] ALL LOCALHOST SERVERS AND TERMINALS HARD KILLED!
echo   Ports 5000, 5173 are now completely free.
echo ================================================================
echo.
pause
exit
