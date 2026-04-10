@echo off
chcp 65001 >nul
title Q12组织氛围诊断调研系统

echo ==========================================
echo    Q12组织氛围诊断调研系统
echo ==========================================
echo.

cd /d "%~dp0"

echo 正在启动服务...
start "Q12系统" cmd /k "node server/index.js"

echo.
echo 请在浏览器中打开: http://localhost:3001
echo 默认账号: admin / admin123
echo.

:: 自动打开浏览器
timeout /t 2 /nobreak >nul
start http://localhost:3001/admin

pause
