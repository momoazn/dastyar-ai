package main

import (
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
)

// BundleConfig holds configuration for bundling
type BundleConfig struct {
	RootDir     string
	DistDir     string
	OutputDir   string
	Platform    string
	TargetArch  string
	AppName     string
	Version     string
}

// Bundler creates the final single binary
type Bundler struct {
	config *BundleConfig
}

func main() {
	fmt.Println("📦 AI App Bundler")
	fmt.Println("=================")

	// Detect project root
	rootDir, err := findProjectRoot()
	if err != nil {
		log.Fatalf("❌ Failed to find project root: %v", err)
	}

	// Parse command line arguments
	platform := runtime.GOOS
	arch := runtime.GOARCH
	if len(os.Args) > 1 {
		parts := strings.Split(os.Args[1], "/")
		if len(parts) == 2 {
			platform = parts[0]
			arch = parts[1]
		}
	}

	// Create bundle configuration
	config := &BundleConfig{
		RootDir:    rootDir,
		DistDir:    filepath.Join(rootDir, "dist"),
		OutputDir:  filepath.Join(rootDir, "bundle"),
		Platform:   platform,
		TargetArch: arch,
		AppName:    "ai-app",
		Version:    "1.0.0",
	}

	// Create bundler and run bundle process
	bundler := &Bundler{config: config}
	if err := bundler.Bundle(); err != nil {
		log.Fatalf("❌ Bundle failed: %v", err)
	}

	fmt.Println("\n🎉 Bundle completed successfully!")
	fmt.Printf("📁 Output: %s\n", filepath.Join(config.OutputDir, config.AppName+getExecutableExtension(platform)))
}

// findProjectRoot locates the project root directory
func findProjectRoot() (string, error) {
	dir, err := os.Getwd()
	if err != nil {
		return "", err
	}

	for {
		if fileExists(filepath.Join(dir, "turbo.json")) ||
			fileExists(filepath.Join(dir, "go.mod")) {
			return dir, nil
		}

		parent := filepath.Dir(dir)
		if parent == dir {
			return "", fmt.Errorf("project root not found")
		}
		dir = parent
	}
}

// fileExists checks if a file exists
func fileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

// Bundle creates the final single binary with embedded assets
func (b *Bundler) Bundle() error {
	// Create output directory
	if err := os.MkdirAll(b.config.OutputDir, 0755); err != nil {
		return fmt.Errorf("failed to create output directory: %w", err)
	}

	// Steps for bundling
	steps := []struct {
		name string
		fn   func() error
	}{
		{"Preparing assets", b.prepareAssets},
		{"Generating embed files", b.generateEmbedFiles},
		{"Building final binary", b.buildBinary},
		{"Creating installation package", b.createInstallationPackage},
	}

	for _, step := range steps {
		fmt.Printf("🔄 %s...\n", step.name)
		if err := step.fn(); err != nil {
			return fmt.Errorf("%s failed: %w", step.name, err)
		}
		fmt.Printf("✅ %s completed\n", step.name)
	}

	return nil
}

// prepareAssets copies all built assets to the bundle directory
func (b *Bundler) prepareAssets() error {
	assetsDir := filepath.Join(b.config.OutputDir, "assets")
	if err := os.RemoveAll(assetsDir); err != nil {
		return err
	}
	if err := os.MkdirAll(assetsDir, 0755); err != nil {
		return err
	}

	// Copy all assets from dist directory
	return b.copyDir(b.config.DistDir, assetsDir)
}

// generateEmbedFiles generates the embed.go file for asset embedding
func (b *Bundler) generateEmbedFiles() error {
	// No need to generate embed.go since runtime main.go already has the embed directive
	return nil
}

// buildBinary builds the final single binary
func (b *Bundler) buildBinary() error {
	// Copy runtime main.go to bundle directory
	runtimeSrc := filepath.Join(b.config.RootDir, "cmd", "runtime", "main.go")
	runtimeDst := filepath.Join(b.config.OutputDir, "main.go")
	
	if err := b.copyFile(runtimeSrc, runtimeDst); err != nil {
		return fmt.Errorf("failed to copy runtime: %w", err)
	}

	// Remove existing go.mod if it exists
	goModPath := filepath.Join(b.config.OutputDir, "go.mod")
	os.Remove(goModPath)

	// Initialize go module
	if err := b.runCommand(b.config.OutputDir, "go", "mod", "init", "ai-app-bundle"); err != nil {
		return fmt.Errorf("failed to init go module: %w", err)
	}

	// Get dependencies
	if err := b.runCommand(b.config.OutputDir, "go", "mod", "tidy"); err != nil {
		return fmt.Errorf("failed to tidy go module: %w", err)
	}

	// Build the binary
	outputName := b.config.AppName + getExecutableExtension(b.config.Platform)
	buildArgs := []string{
		"build",
		"-ldflags", "-s -w", // Strip debug info for smaller binary
		"-tags", "netgo", // Use netgo for better compatibility
		"-o", outputName,
		".",
	}

	env := []string{
		"GOOS=" + b.config.Platform,
		"GOARCH=" + b.config.TargetArch,
		"CGO_ENABLED=0", // Static linking
	}

	cmd := exec.Command("go", buildArgs...)
	cmd.Dir = b.config.OutputDir
	cmd.Env = append(os.Environ(), env...)
	
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to build binary: %w\nOutput: %s", err, output)
	}

	return nil
}

// createInstallationPackage creates installation scripts and documentation
func (b *Bundler) createInstallationPackage() error {
	// Create README
	readme := b.generateReadme()
	readmePath := filepath.Join(b.config.OutputDir, "README.md")
	if err := os.WriteFile(readmePath, []byte(readme), 0644); err != nil {
		return err
	}

	// Create installation script
	installScript := b.generateInstallScript()
	scriptName := "install.sh"
	if b.config.Platform == "windows" {
		scriptName = "install.bat"
	}
	
	scriptPath := filepath.Join(b.config.OutputDir, scriptName)
	return os.WriteFile(scriptPath, []byte(installScript), 0755)
}

// generateReadme creates a README for the bundled application
func (b *Bundler) generateReadme() string {
	readmeContent := "# AI App - Complete Suite\n\n" +
		"This is a complete AI application suite bundled into a single executable.\n\n" +
		"## What's Included\n\n" +
		"- 🌐 **Web Frontend** - React-based user interface\n" +
		"- 🖥️ **Backend Server** - Bun-powered API server with database\n" +
		"- 🎤 **Whisper Service** - OpenAI Whisper audio transcription\n\n" +
		"## Quick Start\n\n"

	// Platform-specific instructions
	if b.config.Platform == "windows" {
		readmeContent += "### Windows\n\n" +
			"1. **Run the application:**\n" +
			"   ```cmd\n" +
			"   ai-app.exe\n" +
			"   ```\n\n" +
			"2. **Or install as service:**\n" +
			"   ```cmd\n" +
			"   install.bat\n" +
			"   ```\n\n"
	} else {
		readmeContent += "### " + strings.Title(b.config.Platform) + "\n\n" +
			"1. **Make executable:**\n" +
			"   ```bash\n" +
			"   chmod +x ai-app\n" +
			"   ```\n\n" +
			"2. **Run the application:**\n" +
			"   ```bash\n" +
			"   ./ai-app\n" +
			"   ```\n\n" +
			"3. **Or install as service:**\n" +
			"   ```bash\n" +
			"   sudo ./install.sh\n" +
			"   ```\n\n"
	}

	readmeContent += "3. **Access the application:**\n" +
		"   - Web Interface: http://localhost:40001\n" +
		"   - Whisper API: http://localhost:40002\n\n" +
		"## Features\n\n" +
		"✅ **Single Binary** - No dependencies required\n" +
		"✅ **Self-Contained** - All assets embedded\n" +
		"✅ **Cross-Platform** - Works on Windows, macOS, Linux\n" +
		"✅ **Auto-Setup** - Creates necessary directories and configs\n" +
		"✅ **Process Management** - Manages all services automatically\n" +
		"✅ **Graceful Shutdown** - Ctrl+C stops all services cleanly\n\n" +
		"## Configuration\n\n" +
		"The application creates a data directory at:\n"

	// Platform-specific data directories
	switch b.config.Platform {
	case "windows":
		readmeContent += "- Windows: %APPDATA%\\ai-app\n\n"
	case "darwin":
		readmeContent += "- macOS: ~/Library/Application Support/ai-app\n\n"
	default:
		readmeContent += "- Linux: ~/.local/share/ai-app\n\n"
	}

	readmeContent += "Directory structure:\n" +
		"```\n" +
		"ai-app/\n" +
		"├── config/          # Configuration files\n" +
		"├── data/            # Database and application data\n" +
		"├── logs/            # Service logs\n" +
		"├── models/          # Whisper models (downloaded on demand)\n" +
		"└── uploads/         # Temporary file uploads\n" +
		"```\n\n" +
		"## Environment Variables\n\n" +
		"- `AI_APP_DATA_DIR` - Custom data directory\n" +
		"- `SERVER_PORT` - Web server port (default: 40001)\n" +
		"- `WHISPER_PORT` - Whisper API port (default: 40002)\n\n" +
		"## Version Information\n\n" +
		"- Version: " + b.config.Version + "\n" +
		"- Platform: " + b.config.Platform + "/" + b.config.TargetArch + "\n" +
		"- Build Date: Built with Go bundler\n\n" +
		"For support and updates, visit: https://github.com/your-org/ai-app\n"

	return readmeContent
}

// generateInstallScript creates platform-specific installation script
func (b *Bundler) generateInstallScript() string {
	if b.config.Platform == "windows" {
		return `@echo off
echo Installing AI App as Windows Service...

REM Create installation directory
set INSTALL_DIR=C:\Program Files\AI-App
mkdir "%INSTALL_DIR%" 2>nul

REM Copy executable
copy ai-app.exe "%INSTALL_DIR%\ai-app.exe"

REM Create service wrapper
echo Creating service wrapper...
(
echo @echo off
echo cd /d "%INSTALL_DIR%"
echo ai-app.exe
) > "%INSTALL_DIR%\service.bat"

REM Install as Windows service using sc
sc create "AI-App" binPath= "%INSTALL_DIR%\service.bat" start= auto
sc description "AI-App" "AI Application Suite with Web UI and Whisper API"

echo AI App installed successfully!
echo.
echo To start the service:
echo   sc start "AI-App"
echo.
echo To stop the service:
echo   sc stop "AI-App"
echo.
echo To uninstall:
echo   sc delete "AI-App"
echo.
pause
`
	} else {
		return `#!/bin/bash
set -e

echo "Installing AI App as systemd service..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root (use sudo)"
    exit 1
fi

# Create installation directory
INSTALL_DIR="/opt/ai-app"
mkdir -p "$INSTALL_DIR"

# Copy executable
cp ai-app "$INSTALL_DIR/ai-app"
chmod +x "$INSTALL_DIR/ai-app"

# Create systemd service file
cat > /etc/systemd/system/ai-app.service << EOF
[Unit]
Description=AI Application Suite
After=network.target

[Service]
Type=simple
User=ai-app
Group=ai-app
ExecStart=$INSTALL_DIR/ai-app
Restart=always
RestartSec=5
Environment=AI_APP_DATA_DIR=/var/lib/ai-app

[Install]
WantedBy=multi-user.target
EOF

# Create user for the service
useradd -r -s /bin/false ai-app 2>/dev/null || true

# Create data directory
mkdir -p /var/lib/ai-app
chown ai-app:ai-app /var/lib/ai-app

# Reload systemd and enable service
systemctl daemon-reload
systemctl enable ai-app

echo "AI App installed successfully!"
echo ""
echo "To start the service:"
echo "  sudo systemctl start ai-app"
echo ""
echo "To check status:"
echo "  sudo systemctl status ai-app"
echo ""
echo "To view logs:"
echo "  sudo journalctl -u ai-app -f"
echo ""
echo "To uninstall:"
echo "  sudo systemctl stop ai-app"
echo "  sudo systemctl disable ai-app"
echo "  sudo rm /etc/systemd/system/ai-app.service"
echo "  sudo systemctl daemon-reload"
`
	}
}

// getExecutableExtension returns platform-specific executable extension
func getExecutableExtension(platform string) string {
	if platform == "windows" {
		return ".exe"
	}
	return ""
}

// runCommand executes a command in the specified directory
func (b *Bundler) runCommand(dir string, name string, args ...string) error {
	cmd := exec.Command(name, args...)
	cmd.Dir = dir
	return cmd.Run()
}

// copyFile copies a single file
func (b *Bundler) copyFile(src, dst string) error {
	if err := os.MkdirAll(filepath.Dir(dst), 0755); err != nil {
		return err
	}

	input, err := os.ReadFile(src)
	if err != nil {
		return err
	}

	return os.WriteFile(dst, input, 0644)
}

// copyDir recursively copies a directory
func (b *Bundler) copyDir(src, dst string) error {
	return filepath.Walk(src, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		relPath, err := filepath.Rel(src, path)
		if err != nil {
			return err
		}
		dstPath := filepath.Join(dst, relPath)

		if info.IsDir() {
			return os.MkdirAll(dstPath, info.Mode())
		}

		return b.copyFile(path, dstPath)
	})
}