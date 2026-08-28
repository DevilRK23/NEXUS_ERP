# Push README.md to GitHub
$Git = "C:\Program Files\Git\cmd\git.exe"

& $Git add README.md
& $Git commit -m "docs: add professional master README.md with badges, architecture diagrams, API dictionary & quickstart"
& $Git push origin main
