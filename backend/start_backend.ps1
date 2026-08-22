Write-Host "Starting Setu Backend Server..." -ForegroundColor Green
Set-Location -Path $PSScriptRoot
& ".\venv\Scripts\python.exe" -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
