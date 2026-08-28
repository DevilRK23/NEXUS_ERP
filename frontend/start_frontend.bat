@echo off
title NEXUS Enterprise ERP - Frontend Web App (Port 8080)
echo Starting NEXUS Frontend Web Application...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start_frontend.ps1" -Port 8080
pause
