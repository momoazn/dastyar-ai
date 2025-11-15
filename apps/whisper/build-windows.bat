@echo off
setlocal enabledelayedexpansion

echo ========================================
echo    Building Whisper Server for Windows
echo ========================================
echo.

REM Check for required tools
echo Checking for required tools...

REM Check for Go
where go >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Go not found
    echo Please install Go 1.23 or later from https://go.dev/dl/
    pause
    exit /b 1
)
echo   ✓ Go found

REM Check for CMake
where cmake >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: CMake not found
    echo Please install CMake from https://cmake.org/download/
    pause
    exit /b 1
)
echo   ✓ CMake found

REM Check for C++ compiler
where g++ >nul 2>&1
if %errorlevel% neq 0 (
    where cl >nul 2>&1
    if %errorlevel% neq 0 (
        echo ERROR: C++ compiler not found
        echo Please install MinGW or Visual Studio Build Tools
        pause
        exit /b 1
    )
    echo   ✓ C++ compiler found (MSVC)
    set "USE_MSVC=1"
) else (
    echo   ✓ C++ compiler found (MinGW)
    set "USE_MSVC=0"
)

REM Check for Git
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Git not found
    echo Please install Git from https://git-scm.com/download/win
    pause
    exit /b 1
)
echo   ✓ Git found

echo.
echo All prerequisites found!
echo.

REM Get the directory where this batch file is located
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

REM Clone whisper.cpp if not present
if not exist "whisper.cpp" (
    echo Cloning whisper.cpp...
    git clone https://github.com/ggerganov/whisper.cpp.git
    if !errorlevel! neq 0 (
        echo ERROR: Failed to clone whisper.cpp
        pause
        exit /b 1
    )
)

REM Create models directory if not present
if not exist "models" (
    mkdir models
)

REM Download FFmpeg for Windows if not present
if not exist "bin\ffmpeg-windows-amd64.exe" (
    echo.
    echo Downloading FFmpeg for Windows...
    if not exist "bin" mkdir bin
    powershell -Command "& {$ProgressPreference='SilentlyContinue'; Invoke-WebRequest -Uri 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip' -OutFile 'ffmpeg-temp.zip'; Expand-Archive -Path 'ffmpeg-temp.zip' -DestinationPath 'ffmpeg-temp' -Force; $ffmpeg = Get-ChildItem -Path 'ffmpeg-temp' -Recurse -Filter 'ffmpeg.exe' | Select-Object -First 1; Copy-Item $ffmpeg.FullName 'bin\ffmpeg-windows-amd64.exe'; Remove-Item -Recurse -Force 'ffmpeg-temp', 'ffmpeg-temp.zip'}"
    if !errorlevel! neq 0 (
        echo WARNING: Failed to download FFmpeg. Continuing anyway...
    )
)

REM Build whisper.cpp
echo.
echo Building whisper.cpp library...
cd whisper.cpp

if not exist "build_go" mkdir build_go

if "%USE_MSVC%"=="1" (
    cmake -S . -B build_go -G "Visual Studio 17 2022" -A x64 -DCMAKE_BUILD_TYPE=Release -DBUILD_SHARED_LIBS=OFF -DWHISPER_BUILD_TESTS=OFF -DWHISPER_BUILD_EXAMPLES=OFF
    if !errorlevel! neq 0 (
        echo ERROR: CMake configuration failed
        cd ..
        pause
        exit /b 1
    )
    cmake --build build_go --config Release --target whisper
) else (
    cmake -S . -B build_go -DCMAKE_BUILD_TYPE=Release -DBUILD_SHARED_LIBS=OFF -DWHISPER_BUILD_TESTS=OFF -DWHISPER_BUILD_EXAMPLES=OFF
    if !errorlevel! neq 0 (
        echo ERROR: CMake configuration failed
        cd ..
        pause
        exit /b 1
    )
    cmake --build build_go --config Release -j%NUMBER_OF_PROCESSORS%
)

if !errorlevel! neq 0 (
    echo ERROR: whisper.cpp build failed
    cd ..
    pause
    exit /b 1
)

echo   ✓ whisper.cpp built successfully
cd ..

REM Set up Go build environment
echo.
echo Setting up Go build environment...

set "WHISPER_ROOT=%CD%\whisper.cpp"
set "BUILD_DIR=%WHISPER_ROOT%\build_go"
set "GGML_SRC=%BUILD_DIR%\ggml\src"

set "C_INCLUDE_PATH=%WHISPER_ROOT%\include;%WHISPER_ROOT%\ggml\include"
set "LIBRARY_PATH=%BUILD_DIR%\src;%GGML_SRC%"
set "CGO_LDFLAGS=-L%BUILD_DIR%\src -L%GGML_SRC%"

REM Build Go application
echo.
echo Building Go whisper server...
set "CGO_ENABLED=1"
go build -o whisper.exe .

if !errorlevel! neq 0 (
    echo.
    echo ERROR: Go build failed
    echo.
    echo Common issues:
    echo   - Missing Go dependencies: run 'go mod tidy'
    echo   - CGO compilation errors: ensure whisper.cpp built successfully
    echo   - Check that C_INCLUDE_PATH and LIBRARY_PATH are set correctly
    pause
    exit /b 1
)

echo.
echo ========================================
echo    ✓ Build successful!
echo ========================================
echo.
echo Binary created: whisper.exe
echo.
echo Next steps:
echo   1. Download a model: download-whisper-models.bat
echo   2. Run the server: whisper.exe
echo   3. Open http://localhost:8080 in your browser
echo.
pause

