@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   Dastyar AI - Build Prerequisites Check
echo ========================================
echo.

REM Navigate to project root
cd /d "%~dp0\..\..\"

set "ERROR_COUNT=0"
set "WARNING_COUNT=0"

REM Check 1: Bun
echo [1/5] Checking Bun...
where bun >nul 2>&1
if %errorlevel% neq 0 (
    echo   ✗ Bun not found
    echo     Install from: https://bun.sh/
    echo     Required version: 1.3.0 or later
    set /a ERROR_COUNT+=1
) else (
    for /f "tokens=*" %%i in ('bun --version 2^>nul') do (
        echo   ✓ Bun %%i installed
    )
)

REM Check 2: Go
echo [2/5] Checking Go...
where go >nul 2>&1
if %errorlevel% neq 0 (
    echo   ✗ Go not found
    echo     Install from: https://go.dev/dl/
    echo     Required version: 1.23 or later
    set /a ERROR_COUNT+=1
) else (
    for /f "tokens=3" %%i in ('go version 2^>nul') do (
        echo   ✓ Go %%i installed
    )
)

REM Check 3: CMake
echo [3/5] Checking CMake...
where cmake >nul 2>&1
if %errorlevel% neq 0 (
    echo   ✗ CMake not found
    echo     Install from: https://cmake.org/download/
    echo     Or use: choco install cmake
    echo     Required version: 3.15 or later
    set /a ERROR_COUNT+=1
) else (
    for /f "tokens=3" %%i in ('cmake --version 2^>nul ^| findstr /C:"version"') do (
        echo   ✓ CMake %%i installed
    )
)

REM Check 4: C++ Compiler
echo [4/5] Checking C++ compiler...
set "COMPILER_FOUND=0"

REM Check for g++ (MinGW)
where g++ >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('g++ --version 2^>nul ^| findstr /C:"gcc"') do (
        echo   ✓ MinGW g++ installed
        echo     %%i
        set "COMPILER_FOUND=1"
    )
)

REM Check for cl (MSVC)
if !COMPILER_FOUND! equ 0 (
    where cl >nul 2>&1
    if %errorlevel% equ 0 (
        echo   ✓ MSVC compiler found
        echo     Use "x64 Native Tools Command Prompt for VS" for building
        set "COMPILER_FOUND=1"
    )
)

if !COMPILER_FOUND! equ 0 (
    echo   ✗ C++ compiler not found
    echo     Install one of:
    echo       - MinGW-w64: https://winlibs.com/
    echo       - Visual Studio Build Tools: https://visualstudio.microsoft.com/downloads/
    set /a ERROR_COUNT+=1
)

REM Check 5: Git
echo [5/5] Checking Git...
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo   ✗ Git not found
    echo     Install from: https://git-scm.com/download/win
    echo     Required for downloading whisper.cpp
    set /a ERROR_COUNT+=1
) else (
    for /f "tokens=3" %%i in ('git --version 2^>nul') do (
        echo   ✓ Git %%i installed
    )
)

REM Additional checks
echo.
echo ========================================
echo   Additional Checks
echo ========================================
echo.

REM Check disk space
echo [6/7] Checking disk space...
for /f "tokens=3" %%i in ('dir /-C ^| findstr /C:"bytes free"') do (
    set "FREE_SPACE=%%i"
)
if defined FREE_SPACE (
    echo   ✓ Checking available space...
    echo     Note: Build requires ~10GB of free space
) else (
    echo   ⚠ Could not determine disk space
    set /a WARNING_COUNT+=1
)

REM Check if running in correct directory
echo [7/7] Checking project directory...
if exist "package.json" (
    if exist "apps\server" (
        if exist "apps\web" (
            if exist "apps\whisper" (
                echo   ✓ Running in correct project directory
            ) else (
                echo   ⚠ apps\whisper directory not found
                set /a WARNING_COUNT+=1
            )
        ) else (
            echo   ⚠ apps\web directory not found
            set /a WARNING_COUNT+=1
        )
    ) else (
        echo   ⚠ apps\server directory not found
        set /a WARNING_COUNT+=1
    )
) else (
    echo   ✗ Not in project root directory
    echo     Navigate to the dastyar-ai directory first
    set /a ERROR_COUNT+=1
)

echo.
echo ========================================
echo   Summary
echo ========================================
echo.

if %ERROR_COUNT% equ 0 (
    if %WARNING_COUNT% equ 0 (
        echo ✓ All prerequisites are installed!
        echo ✓ No warnings
        echo.
        echo You are ready to build Dastyar AI.
        echo.
        echo Next steps:
        echo   1. Run: bun install
        echo   2. Run: build-all-windows.bat
        echo.
    ) else (
        echo ✓ All prerequisites are installed
        echo ⚠ !WARNING_COUNT! warning(s) found
        echo.
        echo You can proceed with the build, but review warnings above.
        echo.
    )
) else (
    echo ✗ !ERROR_COUNT! prerequisite(s) missing
    if %WARNING_COUNT% gtr 0 (
        echo ⚠ !WARNING_COUNT! warning(s) found
    )
    echo.
    echo Please install the missing prerequisites and try again.
    echo See WINDOWS-DEPLOYMENT-GUIDE.md for detailed installation instructions.
    echo.
)

echo See windows\docs\WINDOWS-DEPLOYMENT-GUIDE.md for detailed instructions.
echo.
pause
exit /b %ERROR_COUNT%
