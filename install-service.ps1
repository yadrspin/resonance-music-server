# Self-elevate to Administrator if not already running as admin
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[INFO] Запрос прав Администратора..." -ForegroundColor Yellow
    Start-Process powershell -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
    exit
}

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "Установка службы Resonance в Windows"

Set-Location $PSScriptRoot

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Resonance - Установка сервера как службы Windows      " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    if (Test-Path "C:\Program Files\nodejs\node.exe") {
        $env:PATH = "C:\Program Files\nodejs;$env:PATH"
    } else {
        Write-Host "[ОШИБКА] Node.js не найден. Установите Node.js с https://nodejs.org/" -ForegroundColor Red
        Read-Host "Нажмите Enter для выхода..."
        exit 1
    }
}

if (-not (Test-Path "node_modules\node-windows")) {
    Write-Host "[1/3] Установка пакетов (npm install)..." -ForegroundColor Yellow
    npm install --legacy-peer-deps
}

Write-Host "[2/3] Сборка проекта..." -ForegroundColor Yellow
npm run build

Write-Host "[3/3] Регистрация службы Windows..." -ForegroundColor Green
node service-install.js

Write-Host ""
Read-Host "Нажмите Enter для завершения..."
