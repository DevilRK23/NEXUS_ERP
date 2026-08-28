# Setup and Commit to Git
$Git = "C:\Program Files\Git\cmd\git.exe"

Write-Host "Initializing Git Repository..." -ForegroundColor Cyan
& $Git init

Write-Host "Configuring Git User (Local)..." -ForegroundColor Cyan
& $Git config user.name "NEXUS Engineering"
& $Git config user.email "engineering@nexus-erp.internal"

Write-Host "Adding files to staging..." -ForegroundColor Cyan
& $Git add .

Write-Host "Creating Initial Commit..." -ForegroundColor Cyan
& $Git commit -m "feat: complete NEXUS Enterprise ERP full-stack platform (Frontend, Backend Microservices, PostgreSQL Schemas & Handover Guides)"

Write-Host "Setting main branch..." -ForegroundColor Cyan
& $Git branch -M main

Write-Host "Git Status:" -ForegroundColor Green
& $Git status
