@echo off
chcp 65001 >nul
echo ======================================
echo    Q12调研系统 - 部署到网络
echo ======================================
echo.
echo 即将打开 Railway 网站进行部署...
echo.
echo 部署步骤：
echo 1. 点击 "Login with GitHub" 用 GitHub 登录
echo 2. 点击 "New Project" 
echo 3. 选择 "Deploy from GitHub repo"
echo 4. 找到并选择 "q12-survey-system" 仓库
echo 5. 点击 "Deploy Now"
echo.
echo 部署完成后会显示一个链接，类似：
echo https://q12-survey-system.railway.app
echo.
echo 这个链接就是您分享给同事的地址！
echo.
echo 3秒后打开 Railway 网站...
timeout /t 3 /nobreak >nul
start https://railway.app
echo.
echo 祝您部署成功！
pause
