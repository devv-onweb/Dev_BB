$env:Path = "C:\Program Files\nodejs;" + $env:Path

Write-Host "===================================================" -ForegroundColor Green
Write-Host "   Starting Blood Bank Management System...       " -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Green

$nodeExe = "C:\Program Files\nodejs\node.exe"
$serverDist = "d:\Dev_apps\DEV_D\server\dist\index.js"
$clientVite = "d:\Dev_apps\DEV_D\client\node_modules\vite\bin\vite.js"

# 1. Stop any existing instances
Get-NetTCPConnection -LocalPort 5000, 5173 -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}

# 2. Start Backend API Server in Background (Hidden)
Write-Host "[1/3] Starting Backend API Server (Port 5000)..." -ForegroundColor Cyan
Start-Process -FilePath $nodeExe -ArgumentList $serverDist -WorkingDirectory "d:\Dev_apps\DEV_D\server" -WindowStyle Hidden

# 3. Wait for backend to initialize
Start-Sleep -Seconds 2

# 4. Start Frontend Client in Background (Hidden)
Write-Host "[2/3] Starting Frontend React App (Port 5173)..." -ForegroundColor Cyan
Start-Process -FilePath $nodeExe -ArgumentList "$clientVite --port 5173 --host" -WorkingDirectory "d:\Dev_apps\DEV_D\client" -WindowStyle Hidden

# 5. Wait and open default web browser
Start-Sleep -Seconds 2
Write-Host "[3/3] Opening Blood Bank in your web browser..." -ForegroundColor Yellow
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "===================================================" -ForegroundColor Green
Write-Host "   Blood Bank is running in the background!       " -ForegroundColor Green
Write-Host "   Web Address: http://localhost:5173             " -ForegroundColor White
Write-Host "                                                   "
Write-Host "   To stop the app anytime, double-click:          " -ForegroundColor Yellow
Write-Host "   'Stop_BloodBank.bat'                           " -ForegroundColor Yellow
Write-Host "===================================================" -ForegroundColor Green

Start-Sleep -Seconds 2
