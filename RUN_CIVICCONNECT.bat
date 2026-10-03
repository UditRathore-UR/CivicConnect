@echo off
title CivicConnect Local Server
cd /d "%~dp0CivicConnect"
echo.
echo  CivicConnect is starting on http://localhost:8000
echo  Keep this window open while using Capture Now.
echo.
start "" http://localhost:8000/citizen-login.html
python -m http.server 8000
if errorlevel 1 (
  echo.
  echo Python was not found. Please use VS Code Live Server instead.
  pause
)
