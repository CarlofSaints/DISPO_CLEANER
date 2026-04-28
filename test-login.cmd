@echo off
curl -s -w "\nHTTP Status: %%{http_code}\n" -X POST https://dispo-cleaner.vercel.app/api/auth -H "Content-Type: application/json" -d "{""email"":""carl@outerjoin.co.za"",""password"":""dispo2026""}"
pause
