# Clean amend commit
$Git = "C:\Program Files\Git\cmd\git.exe"

& $Git add .env.example
& $Git add .gitignore
& $Git commit --amend -m "feat: complete NEXUS Enterprise ERP full-stack platform (Frontend, Backend Microservices, PostgreSQL Schemas & Handover Guides)"
& $Git log -n 1
