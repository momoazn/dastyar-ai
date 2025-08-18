@echo off
setlocal enabledelayedexpansion

echo 🏗️  Building AI App - Single Binary (Windows)
echo ==========================================

:: Clean previous builds
echo 🔄 Cleaning previous builds...
if exist dist rmdir /s /q dist
if exist ai-app.exe del ai-app.exe
echo ✅ Cleaned previous builds

:: Install dependencies
echo 🔄 Installing dependencies...
call bun install >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Failed to install JS dependencies
    exit /b 1
)

cd apps\whisper
call uv sync --group build >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Failed to install Python dependencies
    exit /b 1
)
cd ..\..
echo ✅ Dependencies installed

:: Build frontend
echo 🔄 Building React frontend...
call bun run build:web >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Failed to build frontend
    exit /b 1
)
echo ✅ Frontend built

:: Build server
echo 🔄 Building Bun server...
call bun run db:generate >nul 2>&1
call bun run build:server >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Failed to build server
    exit /b 1
)
echo ✅ Server built

:: Build whisper service
echo 🔄 Building Whisper service...
call bun run build:whisper >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Failed to build Whisper service
    exit /b 1
)
echo ✅ Whisper service built

:: Copy assets to dist
echo 🔄 Organizing assets...
mkdir dist\web 2>nul
mkdir dist 2>nul
copy apps\server\dist\index.js dist\server >nul
copy apps\whisper\dist\whisper-api.exe dist\whisper-api.exe >nul
xcopy /s /q apps\web\dist\* dist\web\ >nul
echo ✅ Assets organized

:: Initialize Go module if needed
if not exist go.mod (
    echo 🔄 Initializing Go module...
    go mod init ai-app
    echo ✅ Go module initialized
)

:: Build the final binary for Windows
echo 🔄 Building final binary for Windows...
set GOOS=windows
set GOARCH=amd64
go build -ldflags "-s -w" -o ai-app.exe main.go
if %errorlevel% neq 0 (
    echo ❌ Failed to build final binary
    exit /b 1
)
echo ✅ Final binary built: ai-app.exe

:: Show final size
for %%A in (ai-app.exe) do set BINARY_SIZE=%%~zA
set /a BINARY_SIZE_MB=!BINARY_SIZE!/1048576
echo.
echo 🎉 Build completed successfully!
echo 📁 Binary: ai-app.exe
echo 📊 Size: !BINARY_SIZE_MB!MB
echo.
echo 📋 Next steps:
echo    1. Test: ai-app.exe
echo    2. Deploy to target Windows system
echo.
echo 🚀 Ready for deployment!

endlocal