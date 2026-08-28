# Push Vercel config update to GitHub
$Git = "C:\Program Files\Git\cmd\git.exe"

& $Git add vercel.json frontend/vercel.json package.json
& $Git commit -m "fix(deploy): add vercel.json routes and root package.json for zero-config Vercel deployment"
& $Git push origin main
