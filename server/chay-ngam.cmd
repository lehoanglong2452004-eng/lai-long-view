@echo off
rem Chay Lai Long View ngam (khong cua so), goi tu chay-ngam.vbs luc dang nhap Windows.
rem May chu dung bat ngo thi 5 giay sau tu chay lai. Nhat ky: data\server.log
cd /d "%~dp0.."
if exist "C:\Program Files\nodejs\node.exe" set "PATH=C:\Program Files\nodejs;%PATH%"
if not exist data mkdir data
for %%A in (data\server.log) do if %%~zA GTR 2000000 del data\server.log
echo ==== %date% %time% khoi dong >> data\server.log
if not exist node_modules call npm install >> data\server.log 2>&1
call npm run build >> data\server.log 2>&1

:loop
node server\start.mjs >> data\server.log 2>&1
rem Ma 3: cong 5173 da co Lai Long View khac chay, nen dung lai thay vi lap.
if %errorlevel%==3 exit /b 0
echo ==== %date% %time% may chu dung (ma %errorlevel%), chay lai sau 5 giay >> data\server.log
ping -n 6 127.0.0.1 >nul
goto loop
