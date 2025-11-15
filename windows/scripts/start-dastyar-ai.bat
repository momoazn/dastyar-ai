@echo off
setlocal enabledelayedexpansion

echo ========================================
echo       Dastyar AI - Launcher
echo ========================================
echo.

REM Get the directory where this batch file is located
set "SCRIPT_DIR=%~dp0"
set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

REM Set paths to binaries
set "WHISPER_EXE=%SCRIPT_DIR%\whisper.exe"
set "SERVER_EXE=%SCRIPT_DIR%\dastyar-ai.exe"
set "CONFIG_FILE=%SCRIPT_DIR%\config.json"

REM Check if binaries exist
if not exist "%WHISPER_EXE%" (
    echo ERROR: whisper.exe not found in %SCRIPT_DIR%
    echo Please make sure you have built the application first.
    pause
    exit /b 1
)

if not exist "%SERVER_EXE%" (
    echo ERROR: dastyar-ai.exe not found in %SCRIPT_DIR%
    echo Please make sure you have built the application first.
    pause
    exit /b 1
)

REM Check if config exists, create default if not
if not exist "%CONFIG_FILE%" (
    echo WARNING: config.json not found, creating default configuration...
    (
        echo {
        echo   "PORT": 3000,
        echo   "HOST": "127.0.0.1",
        echo   "CORS_ORIGIN": "http://localhost:3000,http://localhost:5173",
        echo   "JWT_SECRET": "your-super-secret-jwt-key-change-this-in-production-min-32-chars",
        echo   "JWT_EXPIRES_IN": 86400,
        echo   "DATABASE_FILE": "./data.db",
        echo   "WHISPER_SERVER_URL": "http://127.0.0.1:8080",
        echo   "WHISPER_TIMEOUT_MS": 120000,
        echo   "WHISPER_MODELS": "tiny",
        echo   "OLLAMA_BASE_URL": "http://localhost:11434",
        echo   "OLLAMA_ENABLED": true,
        echo   "LMSTUDIO_BASE_URL": "http://localhost:1234/v1",
        echo   "LMSTUDIO_ENABLED": true,
        echo   "GROQ_API_KEY": "",
        echo   "GROQ_ENABLED": false,
        echo   "GEMINI_API_KEY": "",
        echo   "GEMINI_ENABLED": false,
        echo   "STABLE_DIFFUSION_URL": "http://localhost:7860",
        echo   "STABLE_DIFFUSION_ENABLED": true,
        echo   "IMAGES_DIR": "./generated-images",
        echo   "DOCUMENTS_DIR": "./uploaded-documents",
        echo   "EMBEDDING_MODEL": "nomic-embed-text",
        echo   "WEB_DIST_DIR": "./web"
        echo }
    ) > "%CONFIG_FILE%"
    echo Created default config.json
)

REM Check for Whisper models
set "MODELS_DIR=%SCRIPT_DIR%\models"
if not exist "%MODELS_DIR%" (
    echo Creating models directory...
    mkdir "%MODELS_DIR%"
)

set "MODEL_COUNT=0"
for %%f in ("%MODELS_DIR%\*.bin") do set /a MODEL_COUNT+=1

if %MODEL_COUNT% equ 0 (
    echo WARNING: No Whisper models found in models/ directory
    echo.
    echo You need to download at least one Whisper model for transcription to work.
    echo Download a model from: https://huggingface.co/ggerganov/whisper.cpp/tree/main
    echo.
    echo Recommended models:
    echo   - ggml-tiny.bin    ^(75MB - fastest^)
    echo   - ggml-base.bin    ^(142MB - balanced^)
    echo   - ggml-large-v3.bin ^(2.9GB - most accurate^)
    echo.
    echo After downloading, place the .bin file in the models/ directory.
    echo.
    echo Continuing anyway... transcription will not work without models.
    echo.
)

echo Starting Dastyar AI services...
echo.

REM Start Whisper server in background
echo [1/2] Starting Whisper API server ^(port 8080^)...
start "Dastyar AI - Whisper Server" /MIN "%WHISPER_EXE%"

REM Give Whisper a moment to start
timeout /t 3 /nobreak >nul

REM Start main server
echo [2/2] Starting main server ^(port 3000^)...
echo.
echo ========================================
echo       Dastyar AI is starting...
echo ========================================
echo.
echo Whisper API: http://localhost:8080
echo Web Interface: http://localhost:3000
echo.
echo Press Ctrl+C in this window to stop both servers.
echo Closing this window will stop both servers.
echo ========================================
echo.

REM Start server in foreground (this keeps the batch file running)
REM Give server a moment to start, then open browser
start "" cmd /c "timeout /t 8 /nobreak >nul && start http://localhost:3000"

"%SERVER_EXE%"

REM When server stops, also stop Whisper
echo.
echo Stopping Whisper server...
taskkill /f /im whisper.exe >nul 2>&1
echo Done.
pause