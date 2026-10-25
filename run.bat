@echo off
setlocal
chcp 65001 >nul
title Resonance Music Server

echo ========================================================
echo   Resonance - Music Server Launcher for Windows
echo ========================================================
echo.

:: Check standard Node.js installation folders
if exist "C:\Program Files\nodejs\node.exe" set "PATH=C:\Program Files\nodejs;%PATH%"
if exist "C:\Program Files (x86)\nodejs\node.exe" set "PATH=C:\Program Files (x86)\nodejs;%PATH%"

:: Check if node is available
where node >nul 2>nul
if %errorlevel% neq 0 goto :NoNode

:: Check if npm is available
where npm >nul 2>nul
if %errorlevel% neq 0 goto :NoNpm

:: Set default directories
if "%MUSIC_DIR%"=="" set "MUSIC_DIR=%USERPROFILE%\Music"
if "%DATA_DIR%"=="" set "DATA_DIR=%APPDATA%\ResonanceServer"
if "%PORT%"=="" set "PORT=3000"

echo [OK] Node.js is ready.
echo [CONFIG] Music Folder: %MUSIC_DIR%
echo [CONFIG] Server Port:  %PORT%
echo.

:: Check node_modules
if exist "node_modules\" goto :CheckBuild
echo [1/3] Installing npm dependencies...
call npm install --legacy-peer-deps
if %errorlevel% neq 0 goto :NpmError

:CheckBuild
if exist "dist\" goto :StartServer
echo [2/3] Building web application frontend...
call npm run build
if %errorlevel% neq 0 goto :BuildError

:StartServer
echo [3/3] Starting Resonance Server...
echo.
call npx tsx server.ts
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Server stopped with error code %errorlevel%.
    pause
)
goto :End

:NoNode
echo.
echo ========================================================
echo   ERROR: Node.js was not found!
echo ========================================================
echo.
echo Please install Node.js (LTS version) from:
echo https://nodejs.org/
echo.
echo If you just installed it, please close this window
echo and open a new Command Prompt window.
echo.
pause
exit /b 1

:NoNpm
echo.
echo [ERROR] npm was not found. Please reinstall Node.js.
echo.
pause
exit /b 1

:NpmError
echo.
echo [ERROR] npm install failed.
echo Try running: npm install --legacy-peer-deps
echo.
pause
exit /b 1

:BuildError
echo.
echo [ERROR] Build failed.
echo.
pause
exit /b 1

:End
pause
