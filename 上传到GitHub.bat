@echo off
chcp 65001 >nul
echo ======================================
echo     Q12调研系统 - 一键上传GitHub
echo ======================================
echo.

cd /d "%~dp0"

echo [1/5] 初始化Git仓库...
git init >nul 2>&1

echo [2/5] 添加所有文件...
git add .

echo [3/5] 提交代码...
git commit -m "Q12调研系统初始版本"

echo.
echo ======================================
echo     需要您的 GitHub 信息
echo ======================================
echo.
echo 请在浏览器中登录 GitHub：
echo https://github.com
echo.
echo 然后创建新仓库：
echo 1. 点击右上角 "+" -> "New repository"
echo 2. Repository name 填写: q12-survey-system
echo 3. 点击 "Create repository"
echo.
echo 创建完成后，把页面上的命令复制过来执行
echo （类似: git remote add origin https://...）
echo.
echo ======================================
echo.

set /p remote_cmd="请粘贴 Git Remote 命令（直接回车跳过）: "

if not "%remote_cmd%"=="" (
    %remote_cmd%
    echo.
    echo 正在推送代码...
    git branch -M main
    git push -u origin main
)

echo.
echo 完成！
pause
