@echo off
setlocal
chcp 65001 >nul
title Установка службы Resonance в Windows

echo ========================================================
echo   Resonance - Установка сервера как службы Windows
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

:: Проверка зависимостей
if exist "node_modules\" goto :DoBuild
echo [1/3] Установка пакетов (npm install)...
call npm install --legacy-peer-deps
if %errorlevel% neq 0 goto :NpmError

:DoBuild
echo [2/3] Сборка веб-интерфейса и сервера...
call npm run build
if %errorlevel% neq 0 goto :BuildError

:DoInstall
echo [3/3] Регистрация и запуск службы Windows...
call node service-install.js
goto :Done

:NeedAdmin
echo [ОШИБКА] Требуются права Администратора!
echo.
echo Нажмите правой кнопкой мыши по файлу install-service.bat
echo и выберите "Запуск от имени администратора".
echo.
pause
exit /b 1

:NoNode
echo [ОШИБКА] Node.js не найден в системе!
echo Установите Node.js с официального сайта: https://nodejs.org/
pause
exit /b 1

:NpmError
echo [ОШИБКА] Не удалось установить пакеты npm.
pause
exit /b 1

:BuildError
echo [ОШИБКА] Сборка проекта не удалась.
pause
exit /b 1

:Done
echo.
pause
