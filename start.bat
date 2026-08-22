@echo off
title Setu Unified Platform & AI Voice Avatar
cd /d "%~dp0"
if exist "backend\venv\Scripts\python.exe" (
    ".\backend\venv\Scripts\python.exe" run_all.py
) else (
    python run_all.py
)
pause
