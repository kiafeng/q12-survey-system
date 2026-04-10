@echo off
chcp 65001 >nul
title Q12系统 - 停止服务

echo ==========================================
echo    停止Q12组织氛围诊断调研系统
echo ==========================================
echo.

echo 正在停止服务...

:: 停止占用3000端口的进程
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo 停止前端服务 (PID: %%a)...
    taskkill /F /PID %%a >nul 2>&1
)

:: 停止占用3001端口的进程
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do (
    echo 停止后端服务 (PID: %%a)...
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo ==========================================
echo    所有服务已停止
echo ==========================================
pause
