"""
Main entry point for the HedgeBot application.
This script starts both the backend Flask server and the frontend development server.
"""
import os
import subprocess
import sys
import time
import threading

def start_backend():
    """Start the Flask backend server."""
    print("Starting backend server...")
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    backend_process = subprocess.Popen(
        ["python", "-m", "trading_bot.app"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        universal_newlines=True
    )
    
    # Print backend output in real-time
    for line in backend_process.stdout:
        print(f"[BACKEND] {line.strip()}")
    
    return backend_process

def start_frontend():
    """Start the Vite frontend development server."""
    print("Starting frontend server...")
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    frontend_process = subprocess.Popen(
        ["npm", "run", "dev"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        universal_newlines=True
    )
    
    # Print frontend output in real-time
    for line in frontend_process.stdout:
        print(f"[FRONTEND] {line.strip()}")
    
    return frontend_process

if __name__ == '__main__':
    # Start backend in a separate thread
    backend_thread = threading.Thread(target=start_backend)
    backend_thread.daemon = True
    backend_thread.start()
    
    # Give the backend a moment to start
    time.sleep(2)
    
    # Start frontend in the main thread
    frontend_process = start_frontend()
    
    try:
        # Keep the script running
        frontend_process.wait()
    except KeyboardInterrupt:
        print("Shutting down HedgeBot...")
        sys.exit(0) 