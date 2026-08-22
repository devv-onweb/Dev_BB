@echo off
title Stop Blood Bank Management System
color 0C

echo ================================================================
echo   STOPPING ALL BLOOD BANK SERVERS AND LOCALHOST PROCESSES...
echo ================================================================
echo.

:: 1. Force kill processes on ports 5000, 5173, 3000, 5555
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetTCPConnection -LocalPort 5000, 5173, 3000, 5555 -ErrorAction SilentlyContinue | ForEach-Object { $procId = $_.OwningProcess; Write-Host ('Stopped Process PID ' + $procId + ' on Port ' + $_.LocalPort) -ForegroundColor Yellow; Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue }"

:: 2. Force kill titled windows and orphan node processes
taskkill /F /FI "WINDOWTITLE eq BloodBank-*" >nul 2>&1
taskkill /F /IM node.exe /T >nul 2>&1

echo.
echo ================================================================
echo   [OK] ALL BLOOD BANK AND LOCALHOST PROCESSES HAVE BEEN KILLED.
echo ================================================================
ping -n 2 127.0.0.1 >nul
exit
