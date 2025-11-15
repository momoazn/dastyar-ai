@echo off
setlocal enabledelayedexpansion

echo ========================================
echo    Dastyar AI - Installation Verification
echo ========================================
echo.

set "SCRIPT_DIR=%~dp0"
set "ERRORS=0"
set "WARNINGS=0"

echo Checking installation...
echo.

REM Check for required executables
echo [1/5] Checking executables...

if exist "%SCRIPT_DIR%dastyar-ai.exe" (
    echo   ✓ dastyar-ai.exe found
) else (
    echo   ✗ dastyar-ai.exe NOT FOUND
    set /a ERRORS+=1
)

if exist "%SCRIPT_DIR%whisper.exe" (
    echo   ✓ whisper.exe found
) else (
    echo   ✗ whisper.exe NOT FOUND
    set /a ERRORS+=1
)

REM Check for web directory
echo [2/5] Checking web assets...
if exist "%SCRIPT_DIR%web" (
    if exist "%SCRIPT_DIR%web\index.html" (
        echo   ✓ web/ directory found with index.html
    ) else (
        echo   ⚠ web/ directory found but index.html missing
        set /a WARNINGS+=1
    )
) else (
    echo   ✗ web/ directory NOT FOUND
    set /a ERRORS+=1
)

REM Check for config
echo [3/5] Checking configuration...
if exist "%SCRIPT_DIR%config.json" (
    echo   ✓ config.json found
) else (
    echo   ⚠ config.json not found (will be created on first run)
    set /a WARNINGS+=1
)

REM Check for models directory
echo [4/5] Checking Whisper models...
if exist "%SCRIPT_DIR%models" (
    set "MODEL_COUNT=0"
    for %%f in ("%SCRIPT_DIR%models\*.bin") do set /a MODEL_COUNT+=1
    if !MODEL_COUNT! gtr 0 (
        echo   ✓ Found !MODEL_COUNT! model(s) in models/
    ) else (
        echo   ⚠ models/ directory exists but no .bin files found
        echo     Run download-whisper-models.bat to download models
        set /a WARNINGS+=1
    )
) else (
    echo   ⚠ models/ directory not found (will be created on first run)
    echo     Run download-whisper-models.bat to download models
    set /a WARNINGS+=1
)

REM Check for batch files
echo [5/5] Checking helper scripts...
set "BATCH_FILES=start-dastyar-ai.bat stop-dastyar-ai.bat download-whisper-models.bat check-health.bat configure.bat"
for %%f in (%BATCH_FILES%) do (
    if exist "%SCRIPT_DIR%%%f" (
        echo   ✓ %%~f found
    ) else (
        echo   ⚠ %%~f not found
        set /a WARNINGS+=1
    )
)

echo.
echo ========================================
echo       Verification Summary
echo ========================================
echo.

if %ERRORS% equ 0 (
    if %WARNINGS% equ 0 (
        echo ✓ Installation is complete and ready to use!
        echo.
        echo Next steps:
        echo   1. Run download-whisper-models.bat to download models (if not done)
        echo   2. Run configure.bat to configure settings (optional)
        echo   3. Run start-dastyar-ai.bat to start the application
    ) else (
        echo ⚠ Installation is mostly complete with %WARNINGS% warning(s)
        echo.
        echo Warnings are usually non-critical. You can:
        echo   - Download models using download-whisper-models.bat
        echo   - Configure settings using configure.bat
        echo   - Start the application using start-dastyar-ai.bat
    )
) else (
    echo ✗ Installation is incomplete with %ERRORS% error(s)
    echo.
    echo Critical files are missing. Please:
    echo   1. Ensure all files were extracted correctly
    echo   2. Check that dastyar-ai.exe and whisper.exe are present
    echo   3. Verify the web/ directory exists
    echo.
    echo If problems persist, re-download the distribution package.
)

echo.
pause

