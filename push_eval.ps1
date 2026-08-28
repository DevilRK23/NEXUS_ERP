# Push final guide
$Git = "C:\Program Files\Git\cmd\git.exe"

& $Git add TEAM_LEAD_EVALUATION_GUIDE.md git_push.bat
& $Git commit -m "docs: include team lead evaluation guide and git push utility"
& $Git push origin main
