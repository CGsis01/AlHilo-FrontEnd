@echo off
REM Al Hilo Frontend - Firewall Configuration Helper
REM This script launches PowerShell with Administrator privileges

echo.
echo Al Hilo Frontend - Firewall Configuration
echo ==========================================
echo.
echo This will configure Windows Firewall to allow network access.
echo.
echo You will be prompted for Administrator privileges.
echo.
pause

PowerShell -Command "Start-Process PowerShell -ArgumentList '-ExecutionPolicy Bypass -File \"%~dp0configure-firewall.ps1\"' -Verb RunAs"

echo.
echo Done! Check the PowerShell window for results.
echo.
pause
