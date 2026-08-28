@echo off
title NEXUS Enterprise ERP — Full-Stack Launcher (Frontend & Backend)
echo ========================================================================
echo   NEXUS ENTERPRISE ERP — FULL-STACK SYSTEM LAUNCHER
echo   Launching Backend API Gateway on Port 3000...
echo   Launching Frontend Web Application on Port 8080...
echo ========================================================================

start "NEXUS Backend Gateway (Port 3000)" cmd /k "powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0backend\runner.ps1" -GatewayPort 3000"

timeout /t 2 /nobreak >nul

start "NEXUS Frontend Web App (Port 8080)" cmd /k "powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0frontend\start_frontend.ps1" -Port 8080"

echo.
echo Both services are online!
echo Frontend: http://localhost:8080/
echo Backend:  http://localhost:3000/
echo.
pause
