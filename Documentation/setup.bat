@echo off
echo Creating Al Hilo Frontend Project Structure...

mkdir src 2>nul
mkdir src\app 2>nul
mkdir src\app\core 2>nul
mkdir src\app\core\guards 2>nul
mkdir src\app\core\interceptors 2>nul
mkdir src\app\core\services 2>nul
mkdir src\app\shared 2>nul
mkdir src\app\shared\components 2>nul
mkdir src\app\shared\components\layout 2>nul
mkdir src\app\shared\components\header 2>nul
mkdir src\app\shared\directives 2>nul
mkdir src\app\shared\pipes 2>nul
mkdir src\app\domain 2>nul
mkdir src\app\domain\models 2>nul
mkdir src\app\domain\repositories 2>nul
mkdir src\app\data 2>nul
mkdir src\app\data\api 2>nul
mkdir src\app\data\repositories 2>nul
mkdir src\app\features 2>nul
mkdir src\app\features\auth 2>nul
mkdir src\app\features\dashboard 2>nul
mkdir src\app\features\orders 2>nul
mkdir src\app\features\users 2>nul
mkdir src\assets 2>nul
mkdir src\assets\icons 2>nul
mkdir src\environments 2>nul

echo Directory structure created successfully!
echo.
echo Next steps:
echo 1. Install PowerShell 7 from https://aka.ms/powershell
echo 2. Run: npm install
echo 3. Run: npm start
echo.
pause
