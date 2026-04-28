@echo off
curl -X POST https://dispo-cleaner.vercel.app/api/seed -H "Content-Type: application/json" -d "{""secret"":""dispo-seed-2026""}"
pause
