# Al Hilo Frontend - Firewall Configuration Script
# Run this script as Administrator to allow network access

Write-Host "`n🔒 Al Hilo Frontend - Firewall Configuration" -ForegroundColor Green
Write-Host "============================================`n" -ForegroundColor Green

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "⚠️  This script must be run as Administrator!" -ForegroundColor Yellow
    Write-Host "`nRight-click PowerShell and select 'Run as Administrator', then try again.`n" -ForegroundColor Yellow
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

Write-Host "✅ Running with Administrator privileges`n" -ForegroundColor Green

# Check if rule already exists
$existingRule = Get-NetFirewallRule -DisplayName "Al Hilo Angular Dev Server" -ErrorAction SilentlyContinue

if ($existingRule) {
    Write-Host "ℹ️  Firewall rule already exists. Removing old rule..." -ForegroundColor Cyan
    Remove-NetFirewallRule -DisplayName "Al Hilo Angular Dev Server"
    Write-Host "✅ Old rule removed`n" -ForegroundColor Green
}

# Create new firewall rule
Write-Host "📝 Creating firewall rule for port 4200..." -ForegroundColor Cyan

try {
    New-NetFirewallRule `
        -DisplayName "Al Hilo Angular Dev Server" `
        -Direction Inbound `
        -LocalPort 4200 `
        -Protocol TCP `
        -Action Allow `
        -Profile Domain,Private,Public `
        -Description "Allows inbound connections to Al Hilo Angular development server on port 4200"
    
    Write-Host "✅ Firewall rule created successfully!`n" -ForegroundColor Green
    
    # Display current network information
    Write-Host "🌐 Your network information:" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan
    
    # Get IPv4 addresses
    $ipAddresses = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
        $_.InterfaceAlias -notlike "*Loopback*" -and
        $_.IPAddress -ne "127.0.0.1" -and
        $_.PrefixOrigin -ne "WellKnown"
    }
    
    if ($ipAddresses) {
        Write-Host "📱 Access the application from:" -ForegroundColor White
        Write-Host "   Local:    http://localhost:4200" -ForegroundColor White
        Write-Host ""
        Write-Host "   Network:" -ForegroundColor White
        foreach ($ip in $ipAddresses) {
            Write-Host "             http://$($ip.IPAddress):4200  ($($ip.InterfaceAlias))" -ForegroundColor White
        }
        Write-Host ""
    }
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan
    Write-Host "✅ Configuration complete!" -ForegroundColor Green
    Write-Host "`nYou can now access the application from other devices on your network.`n" -ForegroundColor Green
    Write-Host "To start the server, run: npm start`n" -ForegroundColor Yellow
    
} catch {
    Write-Host "❌ Error creating firewall rule:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "`nPress any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
