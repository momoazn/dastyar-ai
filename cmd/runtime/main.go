package main

import (
	"context"
	"embed"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"runtime"
	"sync"
	"syscall"
	"time"
)

//go:embed assets/web assets/whisper-api assets/server
var assets embed.FS

// RuntimeConfig holds configuration for the runtime
type RuntimeConfig struct {
	DataDir        string
	Port           int
	WhisperPort    int
	LogLevel       string
	ExtractAssets  bool
	Platform       string
}

// Runtime manages the execution of all services
type Runtime struct {
	config    *RuntimeConfig
	processes map[string]*exec.Cmd
	mutex     sync.RWMutex
	ctx       context.Context
	cancel    context.CancelFunc
}

// Service represents a managed service
type Service struct {
	Name        string
	ExecutablePath string
	Args        []string
	Env         []string
	Dir         string
	Port        int
	HealthCheck string
}

func main() {
	fmt.Println("🚀 AI App Runtime")
	fmt.Println("=================")

	// Create runtime configuration
	config := &RuntimeConfig{
		DataDir:       getDataDir(),
		Port:          40001,
		WhisperPort:   40002,
		LogLevel:      "INFO",
		ExtractAssets: true,
		Platform:      runtime.GOOS,
	}

	// Create runtime instance
	ctx, cancel := context.WithCancel(context.Background())
	runtime := &Runtime{
		config:    config,
		processes: make(map[string]*exec.Cmd),
		ctx:       ctx,
		cancel:    cancel,
	}

	// Setup signal handling
	runtime.setupSignalHandling()

	// Run the application
	if err := runtime.Run(); err != nil {
		log.Fatalf("❌ Runtime failed: %v", err)
	}
}

// getDataDir returns the data directory for the application
func getDataDir() string {
	if dir := os.Getenv("AI_APP_DATA_DIR"); dir != "" {
		return dir
	}

	// Default data directory based on platform
	switch runtime.GOOS {
	case "windows":
		return filepath.Join(os.Getenv("APPDATA"), "ai-app")
	case "darwin":
		return filepath.Join(os.Getenv("HOME"), "Library", "Application Support", "ai-app")
	default:
		return filepath.Join(os.Getenv("HOME"), ".local", "share", "ai-app")
	}
}

// setupSignalHandling sets up graceful shutdown
func (r *Runtime) setupSignalHandling() {
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)

	go func() {
		<-c
		fmt.Println("\n🛑 Shutdown signal received...")
		r.Shutdown()
	}()
}

// Run starts the complete application runtime
func (r *Runtime) Run() error {
	fmt.Printf("📁 Data directory: %s\n", r.config.DataDir)

	// Extract embedded assets
	if r.config.ExtractAssets {
		if err := r.extractAssets(); err != nil {
			return fmt.Errorf("failed to extract assets: %w", err)
		}
	}

	// Initialize data directory
	if err := r.initializeDataDirectory(); err != nil {
		return fmt.Errorf("failed to initialize data directory: %w", err)
	}

	// Start services
	services := r.getServices()
	if err := r.startServices(services); err != nil {
		return fmt.Errorf("failed to start services: %w", err)
	}

	// Wait for services to be ready
	if err := r.waitForServices(services); err != nil {
		return fmt.Errorf("services failed to start: %w", err)
	}

	fmt.Println("✅ All services started successfully!")
	fmt.Printf("🌐 Web interface: http://localhost:%d\n", r.config.Port)
	fmt.Printf("🎤 Whisper API: http://localhost:%d\n", r.config.WhisperPort)
	fmt.Println("Press Ctrl+C to stop all services...")

	// Keep running until shutdown
	<-r.ctx.Done()
	return nil
}

// extractAssets extracts embedded assets to the data directory
func (r *Runtime) extractAssets() error {
	fmt.Println("📦 Extracting embedded assets...")

	assetDir := filepath.Join(r.config.DataDir, "runtime")
	if err := os.MkdirAll(assetDir, 0755); err != nil {
		return err
	}

	return fs.WalkDir(assets, "assets", func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		// Calculate destination path
		relPath, err := filepath.Rel("assets", path)
		if err != nil {
			return err
		}
		destPath := filepath.Join(assetDir, relPath)

		if d.IsDir() {
			return os.MkdirAll(destPath, 0755)
		}

		// Read embedded file
		data, err := assets.ReadFile(path)
		if err != nil {
			return err
		}

		// Write to destination
		return os.WriteFile(destPath, data, 0755)
	})
}

// initializeDataDirectory creates necessary directories and files
func (r *Runtime) initializeDataDirectory() error {
	dirs := []string{
		"runtime",
		"data",
		"logs",
		"config",
		"models",
		"uploads",
	}

	for _, dir := range dirs {
		path := filepath.Join(r.config.DataDir, dir)
		if err := os.MkdirAll(path, 0755); err != nil {
			return fmt.Errorf("failed to create directory %s: %w", path, err)
		}
	}

	return nil
}

// getServices returns the list of services to run
func (r *Runtime) getServices() []Service {
	runtimeDir := filepath.Join(r.config.DataDir, "runtime")
	
	services := []Service{
		{
			Name:           "whisper",
			ExecutablePath: filepath.Join(runtimeDir, r.getExecutableName("whisper-api")),
			Args:           []string{},
			Env: []string{
				fmt.Sprintf("WHISPER_PORT=%d", r.config.WhisperPort),
				"TQDM_DISABLE=1",
			},
			Dir:         runtimeDir,
			Port:        r.config.WhisperPort,
			HealthCheck: fmt.Sprintf("http://localhost:%d/api/health", r.config.WhisperPort),
		},
		{
			Name:           "server",
			ExecutablePath: filepath.Join(runtimeDir, r.getExecutableName("server")),
			Args:           []string{},
			Env: []string{
				fmt.Sprintf("SERVER_PORT=%d", r.config.Port),
				fmt.Sprintf("WHISPER_SERVICE_URL=http://localhost:%d", r.config.WhisperPort),
				fmt.Sprintf("WEB_DIST_DIR=%s", filepath.Join(runtimeDir, "web")),
				fmt.Sprintf("DATABASE_URL=%s", filepath.Join(r.config.DataDir, "data", "app.db")),
			},
			Dir:         runtimeDir,
			Port:        r.config.Port,
			HealthCheck: fmt.Sprintf("http://localhost:%d/rpc/health", r.config.Port),
		},
	}

	return services
}

// getExecutableName returns platform-specific executable name
func (r *Runtime) getExecutableName(name string) string {
	if r.config.Platform == "windows" {
		return name + ".exe"
	}
	return name
}

// startServices starts all services
func (r *Runtime) startServices(services []Service) error {
	for _, service := range services {
		if err := r.startService(service); err != nil {
			return fmt.Errorf("failed to start service %s: %w", service.Name, err)
		}
		
		// Brief delay between service starts
		time.Sleep(1 * time.Second)
	}
	return nil
}

// startService starts a single service
func (r *Runtime) startService(service Service) error {
	fmt.Printf("🔄 Starting %s service...\n", service.Name)

	// Check if executable exists
	if _, err := os.Stat(service.ExecutablePath); os.IsNotExist(err) {
		return fmt.Errorf("executable not found: %s", service.ExecutablePath)
	}

	// Create command
	cmd := exec.CommandContext(r.ctx, service.ExecutablePath, service.Args...)
	cmd.Dir = service.Dir
	cmd.Env = append(os.Environ(), service.Env...)

	// Setup logging
	logDir := filepath.Join(r.config.DataDir, "logs")
	if err := os.MkdirAll(logDir, 0755); err != nil {
		return err
	}

	logFile, err := os.OpenFile(
		filepath.Join(logDir, service.Name+".log"),
		os.O_CREATE|os.O_WRONLY|os.O_APPEND,
		0644,
	)
	if err != nil {
		return err
	}

	cmd.Stdout = logFile
	cmd.Stderr = logFile

	// Start the service
	if err := cmd.Start(); err != nil {
		logFile.Close()
		return err
	}

	// Store process reference
	r.mutex.Lock()
	r.processes[service.Name] = cmd
	r.mutex.Unlock()

	// Monitor process in background
	go r.monitorService(service.Name, cmd)

	fmt.Printf("✅ %s service started (PID: %d)\n", service.Name, cmd.Process.Pid)
	return nil
}

// monitorService monitors a service process
func (r *Runtime) monitorService(name string, cmd *exec.Cmd) {
	err := cmd.Wait()
	
	r.mutex.Lock()
	delete(r.processes, name)
	r.mutex.Unlock()

	if err != nil && r.ctx.Err() == nil {
		fmt.Printf("❌ Service %s exited with error: %v\n", name, err)
		// Trigger shutdown if any service fails
		r.cancel()
	} else {
		fmt.Printf("ℹ️  Service %s stopped\n", name)
	}
}

// waitForServices waits for all services to be ready
func (r *Runtime) waitForServices(services []Service) error {
	fmt.Println("⏳ Waiting for services to be ready...")

	for _, service := range services {
		if service.HealthCheck == "" {
			continue
		}

		if err := r.waitForHealthCheck(service); err != nil {
			return fmt.Errorf("service %s failed health check: %w", service.Name, err)
		}

		fmt.Printf("✅ %s service is ready\n", service.Name)
	}

	return nil
}

// waitForHealthCheck waits for a service health check to pass
func (r *Runtime) waitForHealthCheck(service Service) error {
	timeout := 60 * time.Second
	interval := 2 * time.Second
	deadline := time.Now().Add(timeout)

	client := &http.Client{Timeout: 5 * time.Second}

	for time.Now().Before(deadline) {
		resp, err := client.Get(service.HealthCheck)
		if err == nil && resp.StatusCode == 200 {
			resp.Body.Close()
			return nil
		}
		if resp != nil {
			resp.Body.Close()
		}

		select {
		case <-r.ctx.Done():
			return r.ctx.Err()
		case <-time.After(interval):
		}
	}

	return fmt.Errorf("health check timeout after %v", timeout)
}

// Shutdown gracefully stops all services
func (r *Runtime) Shutdown() {
	fmt.Println("🛑 Shutting down services...")

	r.cancel() // Cancel context to stop health checks

	r.mutex.RLock()
	var wg sync.WaitGroup
	for name, cmd := range r.processes {
		wg.Add(1)
		go func(name string, cmd *exec.Cmd) {
			defer wg.Done()
			
			fmt.Printf("🔄 Stopping %s...\n", name)
			
			// Try graceful shutdown first
			if err := cmd.Process.Signal(syscall.SIGTERM); err == nil {
				// Wait up to 10 seconds for graceful shutdown
				done := make(chan error, 1)
				go func() {
					done <- cmd.Wait()
				}()

				select {
				case <-done:
					fmt.Printf("✅ %s stopped gracefully\n", name)
					return
				case <-time.After(10 * time.Second):
					fmt.Printf("⚠️  %s did not stop gracefully, forcing...\n", name)
				}
			}

			// Force kill if graceful shutdown failed
			if err := cmd.Process.Kill(); err != nil {
				fmt.Printf("❌ Failed to kill %s: %v\n", name, err)
			} else {
				fmt.Printf("✅ %s stopped (forced)\n", name)
			}
		}(name, cmd)
	}
	r.mutex.RUnlock()

	// Wait for all shutdowns to complete
	done := make(chan struct{})
	go func() {
		wg.Wait()
		close(done)
	}()

	select {
	case <-done:
		fmt.Println("✅ All services stopped")
	case <-time.After(15 * time.Second):
		fmt.Println("⚠️  Shutdown timeout, some services may still be running")
	}

	os.Exit(0)
}