# ==============================================================================
# NEXUS ENTERPRISE ERP — MICROSERVICES BACKEND GATEWAY LAUNCHER (Port 3000)
# ==============================================================================
param([int]$Port = 3000)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RunnerScript = Join-Path $ScriptDir 'runner.ps1'

powershell -NoProfile -ExecutionPolicy Bypass -File $RunnerScript -GatewayPort $Port
