# Setu Unified Platform & AI Voice Avatar Launcher
$Host.UI.RawUI.WindowTitle = "Setu Unified Platform & AI Voice Avatar"
Set-Location $PSScriptRoot

$pythonExe = "python"
if (Test-Path "backend\venv\Scripts\python.exe") {
    $pythonExe = ".\backend\venv\Scripts\python.exe"
}

& $pythonExe run_all.py
