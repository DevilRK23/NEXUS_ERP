# Find Git executable on system
$candidates = @(
    "C:\Program Files\Git\cmd\git.exe",
    "C:\Program Files\Git\bin\git.exe",
    "C:\Program Files (x86)\Git\cmd\git.exe",
    "C:\Users\DELL\AppData\Local\Programs\Git\cmd\git.exe",
    "C:\Users\DELL\AppData\Local\Programs\Git\bin\git.exe",
    "C:\ProgramData\chocolatey\bin\git.exe",
    "C:\tools\git\cmd\git.exe"
)

$gitPath = $null
foreach ($c in $candidates) {
    if (Test-Path $c) {
        $gitPath = $c
        break
    }
}

if (-not $gitPath) {
    # Check GitHub Desktop
    $ghd = "C:\Users\DELL\AppData\Local\GitHubDesktop"
    if (Test-Path $ghd) {
        $found = Get-ChildItem -Path $ghd -Filter "git.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($found) { $gitPath = $found.FullName }
    }
}

if (-not $gitPath) {
    # Check PATH
    $cmd = Get-Command git -ErrorAction SilentlyContinue
    if ($cmd) { $gitPath = $cmd.Source }
}

if ($gitPath) {
    Write-Host "GIT_LOCATED: $gitPath" -ForegroundColor Green
    & $gitPath --version
} else {
    Write-Host "GIT_NOT_FOUND" -ForegroundColor Red
}
