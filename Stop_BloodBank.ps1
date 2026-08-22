Write-Host "===================================================" -ForegroundColor Red
Write-Host "   Stopping Blood Bank Management System...       " -ForegroundColor Red
Write-Host "===================================================" -ForegroundColor Red

Get-NetTCPConnection -LocalPort 5000, 5173 -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "[OK] All Blood Bank servers have been stopped." -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Red
Start-Sleep -Seconds 1
