@echo off
setlocal enabledelayedexpansion

echo ========================================
echo    Building Dastyar AI for Windows
echo ========================================
echo.
echo This script will build all components:
echo   1. Web frontend (React + Vite)
echo   2. Server (Bun runtime + Hono)
echo   3. Whisper server (Go + whisper.cpp)
echo   4. Assemble distribution package
echo.
echo Estimated build time: 5-15 minutes
echo.
pause

REM Record start time
set START_TIME=%TIME%

REM Navigate to project root
cd /d "%~dp0\..\..\"

REM Check prerequisites first
echo.
echo ========================================
echo    Checking Prerequisites
echo ========================================
echo.

where bun >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ Bun not found. Run check-build-prerequisites.bat first.
    pause
    exit /b 1
)

where go >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ Go not found. Run check-build-prerequisites.bat first.
    pause
    exit /b 1
)

where cmake >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ CMake not found. Run check-build-prerequisites.bat first.
    pause
    exit /b 1
)

where git >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ Git not found. Run check-build-prerequisites.bat first.
    pause
    exit /b 1
)

echo ✓ All prerequisites found
echo.

REM Step 0: Install dependencies
echo ========================================
echo    [0/4] Installing Dependencies
echo ========================================
echo.

if exist "node_modules" (
    echo Found existing node_modules, skipping install...
    echo To force reinstall, delete node_modules and run again
) else (
    echo Installing JavaScript dependencies...
    bun install
    if !errorlevel! neq 0 (
        echo.
        echo ✗ Failed to install dependencies
        goto :error
    )
    echo ✓ Dependencies installed
)

echo.

REM Step 1: Build web frontend
echo ========================================
echo    [1/4] Building Web Frontend
echo ========================================
echo.
echo Building React 19 application with Vite...
echo.

cd apps\web
bun run build
if !errorlevel! neq 0 (
    echo.
    echo ✗ Web build failed
    cd ..\..
    goto :error
)
cd ..\..

echo.
echo ✓ Web frontend built successfully
echo.

REM Step 2: Build server
echo ========================================
echo    [2/4] Building Server Binary
echo ========================================
echo.
echo Building standalone Windows executable with Bun...
echo This may take 30-60 seconds...
echo.

cd apps\server
bun run build:windows
if !errorlevel! neq 0 (
    echo.
    echo ✗ Server build failed
    cd ..\..
    goto :error
)
cd ..\..

echo.
echo ✓ Server binary built successfully
echo.

REM Step 3: Build Whisper
echo ========================================
echo    [3/4] Building Whisper Server
echo ========================================
echo.
echo Building Go whisper server with whisper.cpp...
echo This may take 3-10 minutes on first build...
echo.

cd apps\whisper
call build-windows.bat
if !errorlevel! neq 0 (
    echo.
    echo ✗ Whisper build failed
    cd ..\..
    goto :error
)
cd ..\..

echo.
echo ✓ Whisper server built successfully
echo.

REM Step 4: Assemble distribution
echo ========================================
echo    [4/4] Assembling Distribution Package
echo ========================================
echo.

call dist-windows.bat
if !errorlevel! neq 0 (
    echo.
    echo ✗ Distribution assembly failed
    goto :error
)

echo.
echo ========================================
echo    ✓ Build Complete!
echo ========================================
echo.

REM Calculate elapsed time
set END_TIME=%TIME%
echo Start time: %START_TIME%
echo End time:   %END_TIME%
echo.

echo Distribution package ready in: dist\
echo.
echo Package contents:
dir dist\*.exe 2>nul
echo.

echo Next steps:
echo.
echo 1. (Optional) Download Whisper models:
echo    cd dist
echo    ..\windows\scripts\download-whisper-models.bat
echo.
echo 2. Test the build:
echo    cd dist
echo    ..\windows\scripts\verify-installation.bat
echo    ..\windows\scripts\start-dastyar-ai.bat
echo.
echo 3. Create distribution ZIP:
echo    powershell Compress-Archive -Path dist\* -DestinationPath dastyar-ai-windows.zip
echo.
echo See windows\docs\WINDOWS-DEPLOYMENT-GUIDE.md for deployment instructions.
echo.

goto :end

:error
echo.
echo ========================================
echo    ✗ Build Failed!
echo ========================================
echo.
echo Check the error messages above.
echo.
echo Common issues:
echo   - Missing prerequisites: Run check-build-prerequisites.bat
echo   - Port conflicts: Close other applications using ports 3000/8080
echo   - Disk space: Ensure 10GB+ free space
echo   - Permissions: Run as Administrator if needed
echo.
echo For detailed troubleshooting, see WINDOWS-DEPLOYMENT-GUIDE.md
echo.
pause
exit /b 1

:end
echo Build log saved to build.log
pause
