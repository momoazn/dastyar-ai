package main

import (
	"embed"
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"runtime"
	"syscall"
	"time"
)

//go:embed dist/web dist/server dist/whisper-api*
var assets embed.FS

// Config holds application configuration
type Config struct {
	DataDir     string
	ServerPort  string
	WhisperPort string
}

// Service represents a running service
type Service struct {
	Name    string
	Cmd     *exec.Cmd
	Port    string
	LogFile *os.File
}

func main() {
	// Get configuration
	config := getConfig()

	// Setup data directory
	if err := setupDataDir(config.DataDir); err != nil {
		log.Fatalf("Failed to setup data directory: %v", err)
	}

	// Extract assets
	if err := extractAssets(config.DataDir); err != nil {
		log.Fatalf("Failed to extract assets: %v", err)
	}

	// Start services
	services := startServices(config)

	// Setup graceful shutdown
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)

	fmt.Printf("🚀 AI App running!\n")
	fmt.Printf("   Web Interface: http://localhost:%s\n", config.ServerPort)
	fmt.Printf("   Whisper API: http://localhost:%s\n", config.WhisperPort)
	fmt.Printf("   Data Directory: %s\n", config.DataDir)
	fmt.Printf("\nPress Ctrl+C to stop\n\n")

	// Wait for shutdown signal
	<-c
	fmt.Printf("\n🛑 Shutting down services...\n")

	// Stop all services
	for _, service := range services {
		if service.Cmd != nil && service.Cmd.Process != nil {
			fmt.Printf("   Stopping %s...\n", service.Name)
			service.Cmd.Process.Kill()
			service.Cmd.Wait()
			if service.LogFile != nil {
				service.LogFile.Close()
			}
		}
	}

	fmt.Printf("✅ All services stopped\n")
}

// getConfig returns application configuration from environment or defaults
func getConfig() *Config {
	dataDir := os.Getenv("AI_APP_DATA_DIR")
	if dataDir == "" {
		// Extract to a folder next to the binary
		exePath, _ := os.Executable()
		exeDir := filepath.Dir(exePath)
		dataDir = filepath.Join(exeDir, "ai-app-data")
	}

	serverPort := os.Getenv("SERVER_PORT")
	if serverPort == "" {
		serverPort = "40001"
	}

	whisperPort := os.Getenv("WHISPER_PORT")
	if whisperPort == "" {
		whisperPort = "40002"
	}

	return &Config{
		DataDir:     dataDir,
		ServerPort:  serverPort,
		WhisperPort: whisperPort,
	}
}

// setupDataDir creates the simplified directory structure next to the binary
func setupDataDir(dataDir string) error {
	// Create simple structure: ai-app-data/
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return fmt.Errorf("failed to create data directory %s: %w", dataDir, err)
	}

	return nil
}

// extractAssets extracts embedded assets directly to the data directory
func extractAssets(dataDir string) error {
	// Extract web folder
	if err := extractDir("dist/web", filepath.Join(dataDir, "web")); err != nil {
		return fmt.Errorf("failed to extract web assets: %w", err)
	}

	// Extract server binary
	serverPath := filepath.Join(dataDir, "server")
	if err := extractFile("dist/server", serverPath); err != nil {
		return fmt.Errorf("failed to extract server: %w", err)
	}
	if err := os.Chmod(serverPath, 0755); err != nil {
		return fmt.Errorf("failed to make server executable: %w", err)
	}

	// Extract whisper binary
	whisperName := "whisper-api"
	whisperSrc := "dist/whisper-api"
	if runtime.GOOS == "windows" {
		whisperName = "whisper-api.exe"
		whisperSrc = "dist/whisper-api.exe"
	}
	whisperPath := filepath.Join(dataDir, whisperName)
	if err := extractFile(whisperSrc, whisperPath); err != nil {
		return fmt.Errorf("failed to extract whisper: %w", err)
	}
	if err := os.Chmod(whisperPath, 0755); err != nil {
		return fmt.Errorf("failed to make whisper executable: %w", err)
	}

	return nil
}

// extractDir extracts a directory from embedded assets
func extractDir(srcPath, destPath string) error {
	entries, err := assets.ReadDir(srcPath)
	if err != nil {
		return err
	}

	if err := os.MkdirAll(destPath, 0755); err != nil {
		return err
	}

	for _, entry := range entries {
		srcFile := filepath.Join(srcPath, entry.Name())
		destFile := filepath.Join(destPath, entry.Name())

		if entry.IsDir() {
			if err := extractDir(srcFile, destFile); err != nil {
				return err
			}
		} else {
			if err := extractFile(srcFile, destFile); err != nil {
				return err
			}
		}
	}

	return nil
}

// extractFile extracts a single file from embedded assets
func extractFile(srcPath, destPath string) error {
	srcFile, err := assets.Open(srcPath)
	if err != nil {
		return err
	}
	defer srcFile.Close()

	if err := os.MkdirAll(filepath.Dir(destPath), 0755); err != nil {
		return err
	}

	destFile, err := os.Create(destPath)
	if err != nil {
		return err
	}
	defer destFile.Close()

	_, err = io.Copy(destFile, srcFile)
	return err
}

// startServices starts all required services
func startServices(config *Config) []*Service {
	var services []*Service

	// Start Whisper service
	whisperService := startWhisperService(config)
	if whisperService != nil {
		services = append(services, whisperService)
		// Wait a bit for whisper to start
		time.Sleep(2 * time.Second)
	}

	// Start Server
	serverService := startServerService(config)
	if serverService != nil {
		services = append(services, serverService)
	}

	return services
}

// startWhisperService starts the Whisper API service
func startWhisperService(config *Config) *Service {
	whisperName := "whisper-api"
	if runtime.GOOS == "windows" {
		whisperName = "whisper-api.exe"
	}
	whisperPath := filepath.Join(config.DataDir, whisperName)
	logPath := filepath.Join(config.DataDir, "whisper.log")

	logFile, err := os.OpenFile(logPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		fmt.Printf("⚠️  Failed to create whisper log file: %v\n", err)
		logFile = nil
	}

	cmd := exec.Command(whisperPath)
	cmd.Env = append(os.Environ(),
		"HOST=0.0.0.0",
		"PORT="+config.WhisperPort,
		"MODEL_DIR="+config.DataDir,
	)
	cmd.Dir = config.DataDir
	
	if logFile != nil {
		cmd.Stdout = logFile
		cmd.Stderr = logFile
	}

	if err := cmd.Start(); err != nil {
		fmt.Printf("⚠️  Failed to start Whisper service: %v\n", err)
		if logFile != nil {
			logFile.Close()
		}
		return nil
	}

	fmt.Printf("✅ Whisper service started (PID: %d, Port: %s)\n", cmd.Process.Pid, config.WhisperPort)
	return &Service{
		Name:    "Whisper",
		Cmd:     cmd,
		Port:    config.WhisperPort,
		LogFile: logFile,
	}
}

// startServerService starts the main server
func startServerService(config *Config) *Service {
	serverPath := filepath.Join(config.DataDir, "server")
	logPath := filepath.Join(config.DataDir, "server.log")

	logFile, err := os.OpenFile(logPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		fmt.Printf("⚠️  Failed to create server log file: %v\n", err)
		logFile = nil
	}

	cmd := exec.Command("bun", serverPath)
	cmd.Env = append(os.Environ(),
		"PORT="+config.ServerPort,
		"WHISPER_SERVICE_URL=http://localhost:"+config.WhisperPort,
		"STATIC_DIR="+filepath.Join(config.DataDir, "web"),
		"DATABASE_URL="+filepath.Join(config.DataDir, "app.db"),
	)
	cmd.Dir = config.DataDir

	if logFile != nil {
		cmd.Stdout = logFile
		cmd.Stderr = logFile
	}

	if err := cmd.Start(); err != nil {
		fmt.Printf("⚠️  Failed to start server: %v\n", err)
		if logFile != nil {
			logFile.Close()
		}
		return nil
	}

	fmt.Printf("✅ Server started (PID: %d, Port: %s)\n", cmd.Process.Pid, config.ServerPort)
	return &Service{
		Name:    "Server",
		Cmd:     cmd,
		Port:    config.ServerPort,
		LogFile: logFile,
	}
}