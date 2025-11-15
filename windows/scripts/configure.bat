@echo off
setlocal enabledelayedexpansion

echo ========================================
echo    Dastyar AI - Configuration Helper
echo ========================================
echo.

REM Get the directory where this batch file is located
set "SCRIPT_DIR=%~dp0"
set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"
set "CONFIG_FILE=%SCRIPT_DIR%\config.json"

REM Check if config exists, create from example if not
if not exist "%CONFIG_FILE%" (
    echo Creating default configuration file...
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
    echo.
)

echo Current configuration:
echo.
type "%CONFIG_FILE%"
echo.
echo ========================================
echo.

set /p configure="Do you want to configure settings? (Y/N): "
if /i not "%configure%"=="Y" (
    echo Configuration cancelled.
    pause
    exit /b 0
)

echo.
echo Configuration Options:
echo.
echo 1. Server Port (default: 3000)
echo 2. Server Host (default: 127.0.0.1)
echo 3. JWT Secret (for production security)
echo 4. Whisper Server URL (default: http://127.0.0.1:8080)
echo 5. Ollama Settings
echo 6. Stable Diffusion Settings
echo 7. LM Studio Settings
echo 8. View current config
echo 9. Exit
echo.

set /p choice="Select option (1-9): "

if "%choice%"=="1" (
    set /p port="Enter server port (default: 3000): "
    if not "!port!"=="" (
        powershell -Command "(Get-Content '%CONFIG_FILE%') -replace '\"PORT\": [0-9]+', '\"PORT\": !port!' | Set-Content '%CONFIG_FILE%'"
        echo Port updated to !port!
    )
) else if "%choice%"=="2" (
    set /p host="Enter server host (default: 127.0.0.1, use 0.0.0.0 for network access): "
    if not "!host!"=="" (
        powershell -Command "(Get-Content '%CONFIG_FILE%') -replace '\"HOST\": \"[^\"]+\"', '\"HOST\": \"!host!\"' | Set-Content '%CONFIG_FILE%'"
        echo Host updated to !host!
    )
) else if "%choice%"=="3" (
    echo.
    echo IMPORTANT: Use a strong random string (minimum 32 characters)
    echo Example: my-super-secret-production-key-change-this-12345
    echo.
    set /p jwt="Enter JWT Secret: "
    if not "!jwt!"=="" (
        powershell -Command "(Get-Content '%CONFIG_FILE%') -replace '\"JWT_SECRET\": \"[^\"]+\"', '\"JWT_SECRET\": \"!jwt!\"' | Set-Content '%CONFIG_FILE%'"
        echo JWT Secret updated.
    )
) else if "%choice%"=="4" (
    set /p whisper="Enter Whisper Server URL (default: http://127.0.0.1:8080): "
    if not "!whisper!"=="" (
        powershell -Command "(Get-Content '%CONFIG_FILE%') -replace '\"WHISPER_SERVER_URL\": \"[^\"]+\"', '\"WHISPER_SERVER_URL\": \"!whisper!\"' | Set-Content '%CONFIG_FILE%'"
        echo Whisper Server URL updated to !whisper!
    )
) else if "%choice%"=="5" (
    echo.
    set /p ollama_url="Enter Ollama URL (default: http://localhost:11434): "
    if not "!ollama_url!"=="" (
        powershell -Command "(Get-Content '%CONFIG_FILE%') -replace '\"OLLAMA_BASE_URL\": \"[^\"]+\"', '\"OLLAMA_BASE_URL\": \"!ollama_url!\"' | Set-Content '%CONFIG_FILE%'"
    )
    set /p ollama_enabled="Enable Ollama? (true/false, default: true): "
    if not "!ollama_enabled!"=="" (
        powershell -Command "(Get-Content '%CONFIG_FILE%') -replace '\"OLLAMA_ENABLED\": (true|false)', '\"OLLAMA_ENABLED\": !ollama_enabled!' | Set-Content '%CONFIG_FILE%'"
    )
    echo Ollama settings updated.
) else if "%choice%"=="6" (
    echo.
    set /p sd_url="Enter Stable Diffusion URL (default: http://localhost:7860): "
    if not "!sd_url!"=="" (
        powershell -Command "(Get-Content '%CONFIG_FILE%') -replace '\"STABLE_DIFFUSION_URL\": \"[^\"]+\"', '\"STABLE_DIFFUSION_URL\": \"!sd_url!\"' | Set-Content '%CONFIG_FILE%'"
    )
    set /p sd_enabled="Enable Stable Diffusion? (true/false, default: true): "
    if not "!sd_enabled!"=="" (
        powershell -Command "(Get-Content '%CONFIG_FILE%') -replace '\"STABLE_DIFFUSION_ENABLED\": (true|false)', '\"STABLE_DIFFUSION_ENABLED\": !sd_enabled!' | Set-Content '%CONFIG_FILE%'"
    )
    echo Stable Diffusion settings updated.
) else if "%choice%"=="7" (
    echo.
    set /p lm_url="Enter LM Studio URL (default: http://localhost:1234/v1): "
    if not "!lm_url!"=="" (
        powershell -Command "(Get-Content '%CONFIG_FILE%') -replace '\"LMSTUDIO_BASE_URL\": \"[^\"]+\"', '\"LMSTUDIO_BASE_URL\": \"!lm_url!\"' | Set-Content '%CONFIG_FILE%'"
    )
    set /p lm_enabled="Enable LM Studio? (true/false, default: true): "
    if not "!lm_enabled!"=="" (
        powershell -Command "(Get-Content '%CONFIG_FILE%') -replace '\"LMSTUDIO_ENABLED\": (true|false)', '\"LMSTUDIO_ENABLED\": !lm_enabled!' | Set-Content '%CONFIG_FILE%'"
    )
    echo LM Studio settings updated.
) else if "%choice%"=="8" (
    echo.
    echo Current configuration:
    echo.
    type "%CONFIG_FILE%"
    echo.
) else if "%choice%"=="9" (
    exit /b 0
) else (
    echo Invalid option.
)

echo.
echo Configuration updated!
echo.
echo Note: You need to restart the services for changes to take effect.
echo.
pause

