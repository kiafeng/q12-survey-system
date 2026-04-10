@echo off
chcp 65001 >nul
title Q12组织氛围诊断调研系统

echo ==========================================
echo    Q12组织氛围诊断调研系统 启动器
echo ==========================================
echo.

:: 检查Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到Node.js，请先安装Node.js
    pause
    exit /b 1
)

:: 获取当前目录
set ROOT_DIR=%~dp0

echo [1/3] 检查数据目录...
if not exist "%ROOT_DIR%data" mkdir "%ROOT_DIR%data"
echo       完成

echo [2/3] 启动后端服务 (端口3001)...
start "Q12后端服务" cmd /k "cd /d "%ROOT_DIR%" && node server/index.js"

echo [3/3] 启动前端服务 (端口3000)...
cd /d "%ROOT_DIR%client"
start "Q12前端服务" cmd /k "npm run dev"

echo.
echo ==========================================
echo    启动中，请稍候...
echo ==========================================
echo.
echo 访问地址:
echo   管理后台: http://localhost:3000/admin
echo   默认账号: admin / admin123
echo.
echo 提示: 关闭此窗口不会停止服务
echo       如需停止，请关闭上面两个黑色窗口
echo ==========================================

:: 等待几秒让服务启动
timeout /t 3 /nobreak >nul

:: 自动打开浏览器
start http://localhost:3000/admin

pause
