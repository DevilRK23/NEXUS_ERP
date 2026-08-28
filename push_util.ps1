# Add git_push.bat
$Git = "C:\Program Files\Git\cmd\git.exe"

& $Git add git_push.bat
& $Git commit -m "chore: add 1-click git push utility"
& $Git push origin main
