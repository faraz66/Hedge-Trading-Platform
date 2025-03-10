#!/bin/bash

# Kill any existing processes
echo "Killing any existing processes..."
pkill -f "node.*vite" || true
pkill -f "python.*trading_bot" || true
lsof -ti:5002 | xargs kill -9 2>/dev/null || true

# Wait for processes to terminate
sleep 2

# Start the backend server
echo "Starting backend server..."
cd "$(dirname "$0")"
python -m trading_bot.app &
BACKEND_PID=$!

# Wait for backend to start
echo "Waiting for backend to start..."
for i in {1..10}; do
    if curl -s http://localhost:5002/api/strategies > /dev/null; then
        echo "Backend server started successfully!"
        break
    fi
    if [ $i -eq 10 ]; then
        echo "Failed to start backend server. Check logs for errors."
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi
    echo "Waiting for backend server to start... ($i/10)"
    sleep 1
done

# Start the frontend server
echo "Starting frontend server..."
npm run dev &
FRONTEND_PID=$!

# Function to handle script termination
cleanup() {
    echo "Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 0
}

# Set up trap to catch termination signals
trap cleanup SIGINT SIGTERM

# Keep the script running
echo "HedgeBot is running. Press Ctrl+C to stop."
wait $FRONTEND_PID 