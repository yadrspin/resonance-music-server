@echo off
setlocal
chcp 65001 >nul
title Установка службы Resonance в Windows

echo ========================================================
echo   Resonance - Установка сервера как службы Windows
echo ========================================================
echo.

:: Проверка прав администратора
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Запрос прав Администратора...
    powershell -Command "Start-Process cmd -ArgumentList '/c \"\"%~dpnx0\"\"' -Verb RunAs"
    exit /b
)

:: Переход в рабочую папку скрипта
cd /d "%~dp0"

:: Проверка путей Node.js
if exist "C:\Program Files\nodejs\node.exe" set "PATH=C:\Program Files\nodejs;%PATH%"
if exist "C:\Program Files (x86)\nodejs\node.exe" set "PATH=C:\Program Files (x86)\nodejs;%PATH%"

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ОШИБКА] Node.js не найден! Установите Node.js с https://nodejs.org/
    pause
    exit /b 1
)

:: Установка зависимостей если нужно
if not exist "node_modules\" (
    echo [1/3] Установка пакетов (npm install)...
    call npm install --legacy-peer-deps
)

:: Сборка проекта
echo [2/3] Сборка веб-интерфейса и сервера...
call npm run build
if %errorlevel% neq 0 (
    echo [ОШИБКА] Сборка не удалась.
    pause
    exit /b 1
)

:: Установка службы
echo [3/3] Регистрация и запуск службы Windows...
node service-install.js

echo.
pause
