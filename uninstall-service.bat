@echo off
setlocal
chcp 65001 >nul
title Удаление службы Resonance из Windows

echo ========================================================
echo   Resonance - Удаление службы Windows
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
    echo [ОШИБКА] Node.js не найден.
    pause
    exit /b 1
)

:: Остановка и удаление службы
node service-uninstall.js

echo.
pause
