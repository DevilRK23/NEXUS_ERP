@echo off
title NEXUS Enterprise ERP - Unified API Gateway (Port 3000)
echo Starting NEXUS Enterprise Microservices Gateway on Port 3000...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0runner.ps1" -GatewayPort 3000
pause
