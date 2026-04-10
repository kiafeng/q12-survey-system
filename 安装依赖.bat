@echo off
chcp 65001 >nul
title Q12系统 - 安装依赖

echo ==========================================
echo    Q12系统 依赖安装
echo ==========================================
echo.

echo [1/2] 安装后端依赖...
cd /d "%~dp0"
call npm install
if %errorlevel% neq 0 (
    echo [错误] 后端依赖安装失败
    pause
    exit /b 1
)
echo       完成

echo [2/2] 安装前端依赖...
cd /d "%~dp0client"
call npm install
if %errorlevel% neq 0 (
    echo [错误] 前端依赖安装失败
    pause
    exit /b 1
)
echo       完成

echo.
echo ==========================================
echo    依赖安装完成！
echo ==========================================
echo.
echo 下一步: 双击 "启动系统.bat" 运行
echo.
pause
