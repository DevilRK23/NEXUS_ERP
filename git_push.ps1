# ==============================================================================
# NEXUS ENTERPRISE ERP — GIT REMOTE PUSH HELPER
# ==============================================================================
param(
    [Parameter(Mandatory=$false)]
    [string]$RepoUrl = ""
)

$Git = "C:\Program Files\Git\cmd\git.exe"

if (-not $RepoUrl -or [string]::IsNullOrWhiteSpace($RepoUrl)) {
    Write-Host "========================================================================" -ForegroundColor Cyan
    Write-Host "   NEXUS ENTERPRISE ERP — GITHUB / REMOTE PUSH UTILITY                 " -ForegroundColor Yellow
    Write-Host "========================================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Please provide your GitHub Repository URL." -ForegroundColor White
    Write-Host "Example: .\git_push.ps1 -RepoUrl 'https://github.com/your-username/nexus-erp.git'" -ForegroundColor Green
    Write-Host ""
    $RepoUrl = Read-Host "Enter your GitHub Repository URL (or press Enter to cancel)"
}

if ($RepoUrl -and -not [string]::IsNullOrWhiteSpace($RepoUrl)) {
    Write-Host "Configuring remote origin: $RepoUrl..." -ForegroundColor Cyan
    & $Git remote remove origin 2>$null
    & $Git remote add origin $RepoUrl
    
    Write-Host "Pushing main branch to remote repository..." -ForegroundColor Green
    & $Git push -u origin main
    
    Write-Host ""
    Write-Host "Successfully pushed to $RepoUrl!" -ForegroundColor Green
} else {
    Write-Host "Push cancelled. You can push anytime using:" -ForegroundColor Yellow
    Write-Host "  .\git_push.ps1 -RepoUrl 'https://github.com/your-username/repo-name.git'" -ForegroundColor White
}
