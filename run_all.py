import os
import sys
import subprocess
import threading
import signal
import time

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend")

# Colors for terminal output
CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
RESET = "\033[0m"
BOLD = "\033[1m"

# Enable Windows ANSI colors
os.system("")

def print_banner():
    print(f"""
{CYAN}{BOLD}===============================================================
       SETU UNIFIED PLATFORM & AI VOICE AVATAR ENGINE
==============================================================={RESET}
{GREEN}[OK] Unified Backend (FastAPI + AI Avatar + Knowledge): http://127.0.0.1:8000
[OK] Unified Frontend (React + Vite + 60FPS Avatar):    http://localhost:5173{RESET}
{YELLOW}Press Ctrl+C at any time to gracefully stop all services.{RESET}
---------------------------------------------------------------
""", flush=True)

def stream_output(process, prefix, color):
    try:
        for line in iter(process.stdout.readline, ''):
            if not line:
                break
            print(f"{color}{prefix}{RESET} {line.rstrip()}", flush=True)
    except Exception:
        pass

def get_python_exe():
    venv_py = os.path.join(BACKEND_DIR, "venv", "Scripts", "python.exe")
    if os.path.exists(venv_py):
        return venv_py
    return sys.executable

def main():
    print_banner()

    python_exe = get_python_exe()
    backend_cmd = [python_exe, "main.py"]
    
    # Check npm on Windows
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"

    sub_env = os.environ.copy()
    sub_env["PYTHONUNBUFFERED"] = "1"

    # 1. Start Unified Backend Process
    print(f"{CYAN}[SYSTEM]{RESET} Launching Unified FastAPI Backend on port 8000...", flush=True)
    backend_proc = subprocess.Popen(
        backend_cmd,
        cwd=BACKEND_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        encoding="utf-8",
        errors="replace",
        env=sub_env
    )

    # 2. Start Frontend Dev Server Process
    print(f"{CYAN}[SYSTEM]{RESET} Launching React Vite Frontend on port 5173...", flush=True)
    frontend_proc = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=FRONTEND_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        encoding="utf-8",
        errors="replace"
    )

    # Threads to stream outputs to a single terminal
    t_back = threading.Thread(target=stream_output, args=(backend_proc, "[BACKEND]", CYAN), daemon=True)
    t_front = threading.Thread(target=stream_output, args=(frontend_proc, "[FRONTEND]", GREEN), daemon=True)

    t_back.start()
    t_front.start()

    def shutdown(sig, frame):
        print(f"\n{YELLOW}[SYSTEM] Shutting down Setu services...{RESET}")
        try:
            if os.name == "nt":
                subprocess.call(["taskkill", "/F", "/T", "/PID", str(backend_proc.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                subprocess.call(["taskkill", "/F", "/T", "/PID", str(frontend_proc.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            else:
                backend_proc.terminate()
                frontend_proc.terminate()
        except Exception:
            pass
        print(f"{GREEN}[SYSTEM] All services stopped successfully. Goodbye!{RESET}")
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    # Keep main thread alive
    try:
        while True:
            time.sleep(0.5)
            if backend_proc.poll() is not None:
                print(f"{RED}[BACKEND] Process exited with code {backend_proc.returncode}{RESET}")
                break
            if frontend_proc.poll() is not None:
                print(f"{RED}[FRONTEND] Process exited with code {frontend_proc.returncode}{RESET}")
                break
    except KeyboardInterrupt:
        shutdown(None, None)

if __name__ == "__main__":
    main()
