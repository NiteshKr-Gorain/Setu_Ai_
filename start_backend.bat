@echo off
echo Starting Setu Backend Server...
cd /d "%~dp0backend"
if exist "venv\Scripts\python.exe" (
    ".\venv\Scripts\python.exe" main.py
) else (
    py main.py
)
pause
