# PowerShell script to fix Metro bundler cache issues
# Run this script: .\fix-cache.ps1

Write-Host "🧹 Cleaning React Native cache..." -ForegroundColor Yellow

# Stop Metro bundler if running
Write-Host "`n1. Stopping Metro bundler..." -ForegroundColor Cyan
Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*node*" } | Stop-Process -Force -ErrorAction SilentlyContinue

# Clear Metro cache
Write-Host "2. Clearing Metro bundler cache..." -ForegroundColor Cyan
if (Test-Path "$PSScriptRoot\.metro") {
    Remove-Item -Recurse -Force "$PSScriptRoot\.metro" -ErrorAction SilentlyContinue
}
if (Test-Path "$env:TEMP\metro-*") {
    Remove-Item -Recurse -Force "$env:TEMP\metro-*" -ErrorAction SilentlyContinue
}
if (Test-Path "$env:TEMP\haste-*") {
    Remove-Item -Recurse -Force "$env:TEMP\haste-*" -ErrorAction SilentlyContinue
}

# Clear watchman cache (if installed)
Write-Host "3. Clearing watchman cache..." -ForegroundColor Cyan
watchman watch-del-all 2>$null

# Clear npm cache
Write-Host "4. Clearing npm cache..." -ForegroundColor Cyan
npm cache clean --force

# Clear Android build cache
Write-Host "5. Clearing Android build cache..." -ForegroundColor Cyan
if (Test-Path "$PSScriptRoot\android\app\build") {
    Remove-Item -Recurse -Force "$PSScriptRoot\android\app\build" -ErrorAction SilentlyContinue
}
if (Test-Path "$PSScriptRoot\android\.gradle") {
    Remove-Item -Recurse -Force "$PSScriptRoot\android\.gradle" -ErrorAction SilentlyContinue
}
if (Test-Path "$PSScriptRoot\android\build") {
    Remove-Item -Recurse -Force "$PSScriptRoot\android\build" -ErrorAction SilentlyContinue
}

Write-Host "`n✅ Cache cleared successfully!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Delete node_modules folder" -ForegroundColor White
Write-Host "2. Run: npm install" -ForegroundColor White
Write-Host "3. Run: npx react-native start --reset-cache" -ForegroundColor White

