@echo off
setlocal
chcp 65001 >nul
title Удаление службы Resonance из Windows

echo ========================================================
echo   Resonance - Удаление службы Windows
echo ========================================================
echo.

:: Переход в папку скрипта
cd /d "%~dp0"

:: Проверка прав администратора
net session >nul 2>&1
if %errorlevel% neq 0 goto :NeedAdmin

:: Проверка путей Node.js
if exist "C:\Program Files\nodejs\node.exe" set "PATH=C:\Program Files\nodejs;%PATH%"
if exist "C:\Program Files (x86)\nodejs\node.exe" set "PATH=C:\Program Files (x86)\nodejs;%PATH%"

where node >nul 2>nul
if %errorlevel% neq 0 goto :NoNode

echo Остановка и удаление службы...
call node service-uninstall.js
goto :Done

:NeedAdmin
echo [ОШИБКА] Требуются права Администратора!
echo.
echo Нажмите правой кнопкой мыши по файлу uninstall-service.bat
echo и выберите "Запуск от имени администратора".
echo.
pause
exit /b 1

:NoNode
echo [ОШИБКА] Node.js не найден.
pause
exit /b 1

:Done
echo.
pause
