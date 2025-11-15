@echo off
setlocal enabledelayedexpansion

echo ========================================
echo    Creating Windows Distribution
echo ========================================
echo.

REM Navigate to project root
cd /d "%~dp0\..\..\"

REM Check if required binaries exist
if not exist "dist\dastyar-ai.exe" (
    echo ERROR: dist\dastyar-ai.exe not found
    echo.
    echo Please build the server first:
    echo   bun run build:windows
    echo.
    pause
    exit /b 1
)

if not exist "dist\whisper.exe" (
    echo ERROR: dist\whisper.exe not found
    echo.
    echo Please build the Whisper server on Windows:
    echo   cd apps\whisper
    echo   build-windows.bat
    echo.
    pause
    exit /b 1
)

if not exist "dist\web\index.html" (
    echo ERROR: Web assets not found
    echo.
    echo Please build the web frontend first:
    echo   cd apps\web
    echo   bun run build
    echo.
    pause
    exit /b 1
)

echo Copying batch files to dist...
copy /Y windows\scripts\start-dastyar-ai.bat dist\ >nul
copy /Y windows\scripts\stop-dastyar-ai.bat dist\ >nul
copy /Y windows\scripts\check-health.bat dist\ >nul
copy /Y windows\scripts\configure.bat dist\ >nul
copy /Y windows\scripts\download-whisper-models.bat dist\ >nul
copy /Y windows\scripts\verify-installation.bat dist\ >nul
echo   ✓ Batch files copied

echo.
echo Copying documentation to dist...
copy /Y windows\docs\WINDOWS-README.md dist\README.md >nul
copy /Y windows\docs\WINDOWS-QUICK-START.txt dist\QUICK-START.txt >nul
copy /Y windows\docs\WINDOWS-BUILD.md dist\BUILD.md >nul
echo   ✓ Documentation copied

echo.
echo Checking for models...
if not exist "dist\models" (
    mkdir dist\models
    echo   ⚠ Created models directory (empty)
    echo   → Users will need to run download-whisper-models.bat
) else (
    set "MODEL_COUNT=0"
    for %%f in ("dist\models\*.bin") do set /a MODEL_COUNT+=1
    if !MODEL_COUNT! gtr 0 (
        echo   ✓ Found !MODEL_COUNT! model(s)
    ) else (
        echo   ⚠ models directory exists but no .bin files found
        echo   → Users will need to run download-whisper-models.bat
    )
)

echo.
echo ========================================
echo    Distribution Package Ready
echo ========================================
echo.
echo Location: dist\
echo.
echo Contents:
echo   ✓ dastyar-ai.exe
echo   ✓ whisper.exe
echo   ✓ web\
echo   ✓ Batch scripts
echo   ✓ Documentation
echo   ⚠ models\ (may be empty)
echo.
echo Next steps:
echo   1. (Optional) Download models:
echo      cd dist
echo      download-whisper-models.bat
echo.
echo   2. Test the distribution:
echo      cd dist
echo      start-dastyar-ai.bat
echo.
echo   3. Create ZIP for distribution:
echo      powershell Compress-Archive -Path dist\* -DestinationPath dastyar-ai-windows.zip
echo.
echo Distribution is ready for offline deployment!
echo.
pause
