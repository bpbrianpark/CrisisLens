@echo off
REM Ngrok Setup Script for CrisisLens (Windows)

echo 🚀 Setting up ngrok for CrisisLens...

REM Check if .env exists
if not exist .env (
    echo 📝 Creating .env file...
    (
        echo # Ngrok Configuration
        echo NGROK_AUTHTOKEN=your_authtoken_here
        echo NGROK_DOMAIN=crisislens.ngrok-free.app
        echo.
        echo # Add your authtoken from https://dashboard.ngrok.com/
        echo # Replace 'your_authtoken_here' with your actual token
    ) > .env
    echo ⚠️  Please update .env with your ngrok authtoken!
    echo    Get it from: https://dashboard.ngrok.com/
    pause
    exit /b 1
)

REM Check if authtoken is set
findstr /C:"your_authtoken_here" .env >nul
if %errorlevel% equ 0 (
    echo ⚠️  Please update .env with your actual ngrok authtoken!
    echo    Get it from: https://dashboard.ngrok.com/
    pause
    exit /b 1
)

REM Load environment variables and configure ngrok
echo 🔧 Configuring ngrok...
for /f "tokens=1,2 delims==" %%a in (.env) do (
    if "%%a"=="NGROK_AUTHTOKEN" set NGROK_AUTHTOKEN=%%b
    if "%%a"=="NGROK_DOMAIN" set NGROK_DOMAIN=%%b
)

ngrok config add-authtoken %NGROK_AUTHTOKEN%

echo ✅ Ngrok setup complete!
echo 🌐 Your consistent URL will be: https://%NGROK_DOMAIN%
echo 🚀 Run 'npm run ngrok' to start the tunnel
pause
