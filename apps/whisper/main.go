package main

import (
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"whisper/internal/config"
	"whisper/internal/handler"
	"whisper/internal/service"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Initialize Whisper service
	log.Printf("Loading Whisper model: %s from directory: %s", cfg.ModelName, cfg.ModelPath)

	whisperService, err := service.NewWhisperService(cfg.ModelPath, cfg.ModelName)
	if err != nil {
		log.Fatalf("Failed to initialize Whisper service: %v", err)
	}
	defer whisperService.Close()

	log.Println("Whisper model loaded successfully")

	// Create handlers
	transcribeHandler := handler.NewTranscribeHandler(whisperService)

	// Setup routes
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			http.NotFound(w, r)
			return
		}
		http.ServeFile(w, r, "./web/static/index.html")
	})

	// New versioned API endpoints
	http.HandleFunc("/api/v1/transcribe", transcribeHandler.HandleTranscribe)
	http.HandleFunc("/api/v1/models", transcribeHandler.HandleModels)
	http.HandleFunc("/v1/audio/transcriptions", transcribeHandler.HandleOpenAITranscriptions)
	http.HandleFunc("/v1/models", transcribeHandler.HandleOpenAIModels)

	// Python-compatible endpoints (match Python whisper server API)
	http.HandleFunc("/transcribe", transcribeHandler.HandleTranscribeCompat)
	http.HandleFunc("/models", transcribeHandler.HandleModelsCompat)
	http.HandleFunc("/health", transcribeHandler.HandleHealthCompat)

	// Start server
	addr := fmt.Sprintf("0.0.0.0:%s", cfg.Port)

	log.Printf("Starting Whisper Server on %s", addr)
	log.Println("")
	log.Println("Endpoints:")
	log.Println("  GET  / - Web UI")
	log.Println("")
	log.Println("  Python-compatible API:")
	log.Println("    POST /transcribe - Transcribe audio file")
	log.Println("    GET  /models - List available models")
	log.Println("    GET  /health - Health check")
	log.Println("")
	log.Println("  Versioned API:")
	log.Println("    POST /api/v1/transcribe - Transcribe audio file (with metadata)")
	log.Println("    GET  /api/v1/models - List available models")
	log.Println("")
	log.Println("  OpenAI-compatible API:")
	log.Println("    POST /v1/audio/transcriptions - Transcribe/translate audio")
	log.Println("    GET  /v1/models - List available models")

	// Get local IP addresses
	log.Printf("\nAccess the web interface at:")
	log.Printf("  Local:   http://localhost:%s", cfg.Port)
	log.Printf("  Local:   http://127.0.0.1:%s", cfg.Port)

	// Try to get network IP
	if ips := getLocalIPs(); len(ips) > 0 {
		for _, ip := range ips {
			log.Printf("  Network: http://%s:%s", ip, cfg.Port)
		}
	}

	log.Printf("\n(Server listening on all network interfaces)")
	log.Println("")

	// Setup server
	go func() {
		if err := http.ListenAndServe(addr, nil); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")
}

// getLocalIPs returns a list of local IP addresses
func getLocalIPs() []string {
	var ips []string

	addrs, err := net.InterfaceAddrs()
	if err != nil {
		return ips
	}

	for _, addr := range addrs {
		if ipnet, ok := addr.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
			if ipnet.IP.To4() != nil {
				ips = append(ips, ipnet.IP.String())
			}
		}
	}

	return ips
}
