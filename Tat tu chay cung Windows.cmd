@echo off
rem Bam dup: thoi tu chay Lai Long View khi bat may va dung ban dang chay ngam.
title Lai Long View - tat tu chay
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server\tu-chay.ps1" -Tat
pause
