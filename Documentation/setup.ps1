# Al Hilo Frontend Setup Script
Write-Host "Setting up Al Hilo Frontend Project..." -ForegroundColor Cyan

# Create directory structure
$directories = @(
    "src",
    "src\app",
    "src\app\core",
    "src\app\core\guards",
    "src\app\core\interceptors",
    "src\app\core\services",
    "src\app\shared",
    "src\app\shared\components",
    "src\app\shared\components\layout",
    "src\app\shared\components\header",
    "src\app\shared\directives",
    "src\app\shared\pipes",
    "src\app\domain",
    "src\app\domain\models",
    "src\app\domain\repositories",
    "src\app\data",
    "src\app\data\api",
    "src\app\data\repositories",
    "src\app\features",
    "src\app\features\auth",
    "src\app\features\auth\login",
    "src\app\features\dashboard",
    "src\app\features\dashboard\admin",
    "src\app\features\dashboard\cashier",
    "src\app\features\dashboard\seamstress",
    "src\app\features\orders",
    "src\app\features\orders\list",
    "src\app\features\orders\detail",
    "src\app\features\orders\create",
    "src\app\features\users",
    "src\app\features\users\list",
    "src\app\features\users\detail",
    "src\assets",
    "src\assets\icons",
    "src\environments"
)

foreach ($dir in $directories) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "Created: $dir" -ForegroundColor Green
    }
}

Write-Host "`nDirectory structure created successfully!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Run: npm install" -ForegroundColor White
Write-Host "2. Run: npm install -g @angular/cli@18" -ForegroundColor White
Write-Host "3. Run: npm start" -ForegroundColor White
