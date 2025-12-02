@echo off
echo Starting Backend...
start "Backend API" cmd /k "python app.py"

echo Starting Frontend...
cd frontend
start "Frontend App" cmd /k "npm start"
