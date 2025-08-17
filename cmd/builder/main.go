package main

import (
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

// BuildConfig holds configuration for the build process
type BuildConfig struct {
	RootDir     string
	WebDir      string
	ServerDir   string
	WhisperDir  string
	OutputDir   string
	Platform    string
	Verbose     bool
}

// Builder orchestrates the build process for all components
type Builder struct {
	config *BuildConfig
}

// NewBuilder creates a new builder instance
func NewBuilder(config *BuildConfig) *Builder {
	return &Builder{config: config}
}

func main() {
	fmt.Println("🏗️  AI App Build Orchestrator")
	fmt.Println("============================")

	// Detect project root
	rootDir, err := findProjectRoot()
	if err != nil {
		log.Fatalf("❌ Failed to find project root: %v", err)
	}

	// Create build configuration
	config := &BuildConfig{
		RootDir:    rootDir,
		WebDir:     filepath.Join(rootDir, "apps", "web"),
		ServerDir:  filepath.Join(rootDir, "apps", "server"),
		WhisperDir: filepath.Join(rootDir, "apps", "whisper"),
		OutputDir:  filepath.Join(rootDir, "dist"),
		Platform:   runtime.GOOS,
		Verbose:    len(os.Args) > 1 && os.Args[1] == "--verbose",
	}

	// Create builder and run build process
	builder := NewBuilder(config)
	if err := builder.BuildAll(); err != nil {
		log.Fatalf("❌ Build failed: %v", err)
	}

	fmt.Println("\n🎉 Build completed successfully!")
	fmt.Printf("📁 Output directory: %s\n", config.OutputDir)
}

// findProjectRoot locates the project root directory
func findProjectRoot() (string, error) {
	dir, err := os.Getwd()
	if err != nil {
		return "", err
	}

	// Look for package.json or go.mod in parent directories
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

// BuildAll orchestrates the complete build process
func (b *Builder) BuildAll() error {
	// Create output directory
	if err := os.MkdirAll(b.config.OutputDir, 0755); err != nil {
		return fmt.Errorf("failed to create output directory: %w", err)
	}

	// Build steps in order
	steps := []struct {
		name string
		fn   func() error
	}{
		{"Installing dependencies", b.installDependencies},
		{"Building React frontend", b.buildFrontend},
		{"Building Bun server", b.buildServer},
		{"Building Python Whisper service", b.buildWhisper},
		{"Copying assets", b.copyAssets},
		{"Creating deployment structure", b.createDeploymentStructure},
	}

	for _, step := range steps {
		fmt.Printf("🔄 %s...\n", step.name)
		start := time.Now()

		if err := step.fn(); err != nil {
			return fmt.Errorf("%s failed: %w", step.name, err)
		}

		fmt.Printf("✅ %s completed in %v\n", step.name, time.Since(start))
	}

	return nil
}

// installDependencies installs all project dependencies
func (b *Builder) installDependencies() error {
	// Install root dependencies
	if err := b.runCommand(b.config.RootDir, "bun", "install"); err != nil {
		return fmt.Errorf("failed to install root dependencies: %w", err)
	}

	// Install Python dependencies for Whisper
	if err := b.runCommand(b.config.WhisperDir, "uv", "sync", "--group", "build"); err != nil {
		return fmt.Errorf("failed to install Python dependencies: %w", err)
	}

	return nil
}

// buildFrontend builds the React frontend
func (b *Builder) buildFrontend() error {
	// Build web app
	if err := b.runCommand(b.config.RootDir, "bun", "run", "build:web"); err != nil {
		return fmt.Errorf("failed to build web app: %w", err)
	}

	return nil
}

// buildServer builds the Bun server with bundled migrations
func (b *Builder) buildServer() error {
	// Generate and bundle migrations first
	if err := b.runCommand(b.config.RootDir, "bun", "run", "db:generate"); err != nil {
		// Continue if migrations fail (might be no changes)
		fmt.Printf("⚠️  Migration generation failed (continuing): %v\n", err)
	}

	// Build server
	if err := b.runCommand(b.config.RootDir, "bun", "run", "build:server"); err != nil {
		return fmt.Errorf("failed to build server: %w", err)
	}

	return nil
}

// buildWhisper builds the Python Whisper service
func (b *Builder) buildWhisper() error {
	// Build Whisper executable
	if err := b.runCommand(b.config.RootDir, "bun", "run", "build:whisper"); err != nil {
		return fmt.Errorf("failed to build Whisper service: %w", err)
	}

	return nil
}

// copyAssets copies built assets to proper locations
func (b *Builder) copyAssets() error {
	assets := []struct {
		src, dst string
	}{
		// Copy web assets to server's web directory
		{
			src: filepath.Join(b.config.WebDir, "dist"),
			dst: filepath.Join(b.config.OutputDir, "web"),
		},
		// Copy server executable
		{
			src: filepath.Join(b.config.ServerDir, "dist", "index.js"),
			dst: filepath.Join(b.config.OutputDir, "server"),
		},
		// Copy Whisper executable
		{
			src: filepath.Join(b.config.WhisperDir, "dist", b.getWhisperExecutableName()),
			dst: filepath.Join(b.config.OutputDir, "whisper-api"),
		},
	}

	for _, asset := range assets {
		if err := b.copyPath(asset.src, asset.dst); err != nil {
			return fmt.Errorf("failed to copy %s to %s: %w", asset.src, asset.dst, err)
		}
	}

	return nil
}

// createDeploymentStructure creates the final deployment structure
func (b *Builder) createDeploymentStructure() error {
	// Create directories
	dirs := []string{
		"config",
		"data",
		"logs",
		"models",
	}

	for _, dir := range dirs {
		path := filepath.Join(b.config.OutputDir, dir)
		if err := os.MkdirAll(path, 0755); err != nil {
			return fmt.Errorf("failed to create directory %s: %w", path, err)
		}
	}

	// Copy configuration files
	configFiles := []struct {
		src, dst string
	}{
		{
			src: filepath.Join(b.config.ServerDir, ".env.example"),
			dst: filepath.Join(b.config.OutputDir, "config", "server.env.example"),
		},
		{
			src: filepath.Join(b.config.WhisperDir, "README_WINDOWS.md"),
			dst: filepath.Join(b.config.OutputDir, "README.md"),
		},
	}

	for _, file := range configFiles {
		if fileExists(file.src) {
			if err := b.copyFile(file.src, file.dst); err != nil {
				fmt.Printf("⚠️  Failed to copy config file %s: %v\n", file.src, err)
			}
		}
	}

	// Create startup script
	return b.createStartupScript()
}

// createStartupScript creates platform-specific startup scripts
func (b *Builder) createStartupScript() error {
	var script string
	var filename string

	if b.config.Platform == "windows" {
		filename = "start.bat"
		script = `@echo off
echo Starting AI App Suite...

echo Starting Whisper Service...
start /B whisper-api.exe

echo Waiting for Whisper service to start...
timeout /t 5 /nobreak >nul

echo Starting Server...
set WEB_DIST_DIR=%~dp0web
start /B server.exe

echo AI App Suite started successfully!
echo Web interface: http://localhost:40001
echo Whisper API: http://localhost:40002
echo Press any key to stop all services...
pause >nul

echo Stopping services...
taskkill /f /im whisper-api.exe >nul 2>&1
taskkill /f /im server.exe >nul 2>&1
echo Services stopped.
`
	} else {
		filename = "start.sh"
		script = `#!/bin/bash
set -e

echo "Starting AI App Suite..."

# Function to cleanup on exit
cleanup() {
    echo "Stopping services..."
    kill $WHISPER_PID $SERVER_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start Whisper service
echo "Starting Whisper Service..."
./whisper-api &
WHISPER_PID=$!

# Wait for Whisper to start
echo "Waiting for Whisper service to start..."
sleep 5

# Start Server
echo "Starting Server..."
export WEB_DIST_DIR="$(pwd)/web"
./server &
SERVER_PID=$!

echo "AI App Suite started successfully!"
echo "Web interface: http://localhost:40001"  
echo "Whisper API: http://localhost:40002"
echo "Press Ctrl+C to stop all services..."

# Wait for processes
wait $WHISPER_PID $SERVER_PID
`
	}

	scriptPath := filepath.Join(b.config.OutputDir, filename)
	if err := os.WriteFile(scriptPath, []byte(script), 0755); err != nil {
		return fmt.Errorf("failed to create startup script: %w", err)
	}

	return nil
}

// getWhisperExecutableName returns the platform-specific executable name
func (b *Builder) getWhisperExecutableName() string {
	if b.config.Platform == "windows" {
		return "whisper-api.exe"
	}
	return "whisper-api"
}

// runCommand executes a command in the specified directory
func (b *Builder) runCommand(dir string, name string, args ...string) error {
	cmd := exec.Command(name, args...)
	cmd.Dir = dir
	
	if b.config.Verbose {
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		fmt.Printf("  Running: %s %s (in %s)\n", name, strings.Join(args, " "), dir)
	}

	return cmd.Run()
}

// copyPath copies a file or directory from src to dst
func (b *Builder) copyPath(src, dst string) error {
	srcInfo, err := os.Stat(src)
	if err != nil {
		return err
	}

	if srcInfo.IsDir() {
		return b.copyDir(src, dst)
	}
	return b.copyFile(src, dst)
}

// copyFile copies a single file
func (b *Builder) copyFile(src, dst string) error {
	// Create destination directory
	if err := os.MkdirAll(filepath.Dir(dst), 0755); err != nil {
		return err
	}

	// Copy file
	input, err := os.ReadFile(src)
	if err != nil {
		return err
	}

	return os.WriteFile(dst, input, 0644)
}

// copyDir recursively copies a directory
func (b *Builder) copyDir(src, dst string) error {
	return filepath.Walk(src, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// Calculate destination path
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