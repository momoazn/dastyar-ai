@echo off
REM Build script for Windows
REM Run this from the whisper directory

echo Building Whisper API for Windows...

REM Check if uv is installed
uv --version >nul 2>&1
if errorlevel 1 (
    echo Error: uv package manager is not installed
    echo Please install uv: https://docs.astral.sh/uv/getting-started/installation/
    pause
    exit /b 1
)

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python 3.13+: https://python.org
    pause
    exit /b 1
)

REM Run the build
echo Running build script...
uv run python build.py

if errorlevel 1 (
    echo Build failed!
    pause
    exit /b 1
)

echo.
echo Build completed successfully!
echo Executable location: dist\whisper-api.exe
echo.
echo To test the executable:
echo   dist\whisper-api.exe
echo.
pause