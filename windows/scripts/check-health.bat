@echo off
setlocal enabledelayedexpansion

echo ========================================
echo    Dastyar AI - Health Check
echo ========================================
echo.

set "ERROR_COUNT=0"

REM Check if Whisper process is running
echo [1/4] Checking Whisper process...
tasklist /FI "IMAGENAME eq whisper.exe" 2>NUL | find /I /N "whisper.exe">NUL
if !errorlevel! equ 0 (
    echo   ✓ Whisper process is running
) else (
    echo   ✗ Whisper process is NOT running
    set /a ERROR_COUNT+=1
)

REM Check if Main server process is running
echo [2/4] Checking Main server process...
tasklist /FI "IMAGENAME eq dastyar-ai.exe" 2>NUL | find /I /N "dastyar-ai.exe">NUL
if !errorlevel! equ 0 (
    echo   ✓ Main server process is running
) else (
    echo   ✗ Main server process is NOT running
    set /a ERROR_COUNT+=1
)

REM Check Whisper API health endpoint
echo [3/4] Checking Whisper API health...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8080/health' -UseBasicParsing -TimeoutSec 5; if ($response.StatusCode -eq 200) { Write-Host '  ✓ Whisper API is responding' } else { Write-Host '  ✗ Whisper API returned status' $response.StatusCode; exit 1 } } catch { Write-Host '  ✗ Whisper API is not responding'; exit 1 }" 2>NUL
if !errorlevel! equ 0 (
    echo   ✓ Whisper API health check passed
) else (
    echo   ✗ Whisper API health check failed
    set /a ERROR_COUNT+=1
)

REM Check Main server health endpoint
echo [4/4] Checking Main server health...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/health' -UseBasicParsing -TimeoutSec 5; if ($response.StatusCode -eq 200) { Write-Host '  ✓ Main server is responding' } else { Write-Host '  ✗ Main server returned status' $response.StatusCode; exit 1 } } catch { Write-Host '  ✗ Main server is not responding'; exit 1 }" 2>NUL
if !errorlevel! equ 0 (
    echo   ✓ Main server health check passed
) else (
    echo   ✗ Main server health check failed
    set /a ERROR_COUNT+=1
)

echo.
echo ========================================

if %ERROR_COUNT% equ 0 (
    echo       ✓ All checks passed!
    echo ========================================
    echo.
    echo Services are running correctly.
    echo Web Interface: http://localhost:3000
    echo Whisper API: http://localhost:8080
) else (
    echo       ✗ %ERROR_COUNT% check(s) failed
    echo ========================================
    echo.
    echo Some services are not running correctly.
    echo Try running start-dastyar-ai.bat to start the services.
)

echo.
pause

