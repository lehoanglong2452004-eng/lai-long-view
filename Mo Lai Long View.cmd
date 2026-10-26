@echo off
rem Bam dup file nay de mo Lai Long View. Dong cua so den de tat.
title Lai Long View
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  if exist "C:\Program Files\nodejs\node.exe" (
    set "PATH=C:\Program Files\nodejs;%PATH%"
  ) else (
    echo Chua cai Node.js. Tai ban LTS tai https://nodejs.org roi bam lai file nay.
    pause
    exit /b 1
  )
)

rem Lai Long View da chay ngam (tu chay cung Windows) thi chi can mo trinh duyet.
curl.exe -s -o nul -m 2 http://127.0.0.1:5173/ && (
  start "" http://localhost:5173
  exit /b 0
)

if not exist node_modules (
  echo Lan dau chay: dang cai thu vien, mat khoang 1 phut...
  call npm install
  if errorlevel 1 goto fail
)

echo Dang chuan bi ban moi nhat...
call npm run build >nul
if errorlevel 1 goto fail

echo.
echo  Lai Long View dang chay tai http://localhost:5173
echo  Giu cua so nay mo trong luc xem chart. Dong cua so = tat Lai Long View.
echo.
node server\start.mjs --open
pause
exit /b 0

:fail
echo Co loi, chup man hinh cua so nay gui lai de sua.
pause
exit /b 1
