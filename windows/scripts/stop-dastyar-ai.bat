@echo off
setlocal enabledelayedexpansion

echo ========================================
echo    Dastyar AI - Stop Services
echo ========================================
echo.

REM Get the directory where this batch file is located
set "SCRIPT_DIR=%~dp0"

echo Stopping Dastyar AI services...
echo.

REM Stop main server
echo [1/2] Stopping main server...
taskkill /f /im dastyar-ai.exe >nul 2>&1
if !errorlevel! equ 0 (
    echo   ✓ Main server stopped
) else (
    echo   - Main server was not running
)

REM Stop Whisper server
echo [2/2] Stopping Whisper server...
taskkill /f /im whisper.exe >nul 2>&1
if !errorlevel! equ 0 (
    echo   ✓ Whisper server stopped
) else (
    echo   - Whisper server was not running
)

echo.
echo ========================================
echo       All services stopped
echo ========================================
echo.

timeout /t 2 /nobreak >nul