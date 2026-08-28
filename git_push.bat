@echo off
title NEXUS Enterprise ERP — Git Push to GitHub
echo ========================================================================
echo   NEXUS ENTERPRISE ERP — PUSHING TO GITHUB (DevilRK23/NEXUS_ERP)
echo ========================================================================
echo.

"C:\Program Files\Git\cmd\git.exe" remote set-url origin https://github.com/DevilRK23/NEXUS_ERP.git
"C:\Program Files\Git\cmd\git.exe" branch -M main

echo Executing: git push -u origin main...
echo (If a browser window opens, click Authorize/Sign In to complete the push)
echo.

"C:\Program Files\Git\cmd\git.exe" push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================================
    echo   [SUCCESS] Successfully pushed all files to:
    echo   https://github.com/DevilRK23/NEXUS_ERP
    echo ========================================================================
) else (
    echo.
    echo ========================================================================
    echo   [NOTICE] If GitHub asked for a password, please use a GitHub Personal
    echo   Access Token (PAT) or sign in via GitHub Credential Manager.
    echo ========================================================================
)

echo.
pause
