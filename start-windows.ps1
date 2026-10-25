# Resonance - Music Server for Windows (PowerShell Launcher)
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "Resonance - Music Server for Windows"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Resonance - Folder-First Music Server for Windows OS  " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ОШИБКА] Node.js не установлен на компьютере!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Пожалуйста, установите Node.js (версию LTS) с официального сайта:"
    Write-Host "https://nodejs.org/" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Нажмите Enter для выхода..."
    exit 1
}

# Defaults
if (-not $env:MUSIC_DIR) {
    $env:MUSIC_DIR = "$env:USERPROFILE\Music"
}
if (-not $env:DATA_DIR) {
    $env:DATA_DIR = "$env:APPDATA\ResonanceServer"
}
if (-not $env:PORT) {
    $env:PORT = "3000"
}

Write-Host "[CONFIG] Music Root: $env:MUSIC_DIR" -ForegroundColor Green
Write-Host "[CONFIG] Data Store: $env:DATA_DIR"
Write-Host "[CONFIG] Port:       $env:PORT"
Write-Host ""

if (-not (Test-Path "node_modules")) {
    Write-Host "[SETUP] Установка зависимостей (npm install --legacy-peer-deps)..." -ForegroundColor Yellow
    npm install --legacy-peer-deps
}

if (-not (Test-Path "dist")) {
    Write-Host "[BUILD] Сборка веб-плеера (npm run build)..." -ForegroundColor Yellow
    npm run build
}

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "  Сервер запущен!                                       " -ForegroundColor Green
Write-Host "  Откройте в браузере: http://localhost:$env:PORT       " -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""

npx tsx server.ts
