@echo off
setlocal enabledelayedexpansion

echo ========================================
echo    Download Whisper Models
echo ========================================
echo.

REM Get the directory where this batch file is located
set "SCRIPT_DIR=%~dp0"
set "MODELS_DIR=%SCRIPT_DIR%\models"

REM Create models directory if it doesn't exist
if not exist "%MODELS_DIR%" (
    echo Creating models directory...
    mkdir "%MODELS_DIR%"
)

echo Available Whisper models:
echo.
echo 1. tiny    ^(75MB   - Fastest, least accurate^)
echo 2. base    ^(142MB  - Balanced speed/accuracy^)
echo 3. small   ^(466MB  - Good accuracy^)
echo 4. medium  ^(1.5GB  - High accuracy^)
echo 5. large-v3^(2.9GB  - Best accuracy^)
echo 6. all     ^(Download all models^)
echo.

set /p choice="Select model to download (1-6): "

if "%choice%"=="1" (
    set "MODEL=ggml-tiny.bin"
    set "URL=https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin"
) else if "%choice%"=="2" (
    set "MODEL=ggml-base.bin"
    set "URL=https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin"
) else if "%choice%"=="3" (
    set "MODEL=ggml-small.bin"
    set "URL=https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin"
) else if "%choice%"=="4" (
    set "MODEL=ggml-medium.bin"
    set "URL=https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin"
) else if "%choice%"=="5" (
    set "MODEL=ggml-large-v3.bin"
    set "URL=https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3.bin"
) else if "%choice%"=="6" (
    echo Downloading all models...
    call :DownloadModel tiny ggml-tiny.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin
    call :DownloadModel base ggml-base.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin
    call :DownloadModel small ggml-small.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin
    call :DownloadModel medium ggml-medium.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin
    call :DownloadModel large-v3 ggml-large-v3.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3.bin
    goto :Done
) else (
    echo Invalid choice. Please run the script again.
    pause
    exit /b 1
)

call :DownloadModel %choice% %MODEL% %URL%

:Done
echo.
echo ========================================
echo       Download complete!
echo ========================================
echo.
echo Models are saved in: %MODELS_DIR%
echo You can now run start-dastyar-ai.bat
echo.
pause
exit /b 0

:DownloadModel
set "MODEL_NAME=%~1"
set "MODEL_FILE=%~2"
set "MODEL_URL=%~3"

set "OUTPUT_PATH=%MODELS_DIR%\%MODEL_FILE%"

if exist "%OUTPUT_PATH%" (
    echo %MODEL_NAME% model already exists. Skipping download.
    goto :eof
)

echo.
echo Downloading %MODEL_NAME% model...
echo This may take a while depending on your internet connection.
echo.

REM Use PowerShell to download with progress bar
powershell -Command "& {$ProgressPreference='SilentlyContinue'; Write-Host 'Downloading %MODEL_NAME%...'; Invoke-WebRequest -Uri '%MODEL_URL%' -OutFile '%OUTPUT_PATH%' -UseBasicParsing; if ($?) { Write-Host '✓ %MODEL_NAME% downloaded successfully' } else { Write-Host '✗ Failed to download %MODEL_NAME%'; exit 1 } }"

if !errorlevel! neq 0 (
    echo Failed to download %MODEL_NAME% model.
    echo Please check your internet connection and try again.
    pause
    exit /b 1
)

goto :eof