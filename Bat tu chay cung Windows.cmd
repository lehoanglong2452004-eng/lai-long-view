@echo off
rem Bam dup: Lai Long View tu chay ngam moi khi bat may (khong can mo file Mo Lai Long View.cmd nua).
title Lai Long View - bat tu chay
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server\tu-chay.ps1"
pause
