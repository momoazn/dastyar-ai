package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"whisper/internal/config"
	"whisper/internal/handler"
	"whisper/internal/service"
)

// Server limits. Uploads can be large and transcription can be slow,
// so the read and write timeouts are long.
const (
	readHeaderTimeout = 10 * time.Second
	readTimeout       = 10 * time.Minute
	writeTimeout      = 60 * time.Minute
	idleTimeout       = 2 * time.Minute
	shutdownTimeout   = 2 * time.Minute
)

func main() {
	os.Exit(run())
}

func run() int {
	cfg, err := config.Load(config.DefaultPaths)
	if err != nil {
		log.Printf("Failed to load config: %v", err)
		return 1
	}

	log.Printf("Loading Whisper model: %s from directory: %s", cfg.ModelName, cfg.ModelDir)

	whisperService, err := service.NewWhisperService(cfg.ModelDir, cfg.ModelName)
	if err != nil {
		log.Printf("Failed to initialize Whisper service: %v", err)
		return 1
	}
	defer func() { _ = whisperService.Close() }()

	log.Println("Whisper model loaded successfully")

	transcribeHandler, err := handler.NewTranscribeHandler(whisperService, "./temp")
	if err != nil {
		log.Printf("Failed to create handler: %v", err)
		return 1
	}
	mux := http.NewServeMux()

	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	})

	mux.HandleFunc("/v1/audio/transcriptions", transcribeHandler.HandleOpenAITranscriptions)
	mux.HandleFunc("/v1/models", transcribeHandler.HandleOpenAIModels)

	addr := fmt.Sprintf("0.0.0.0:%s", cfg.Port)
	server := &http.Server{
		Addr:              addr,
		Handler:           mux,
		ReadHeaderTimeout: readHeaderTimeout,
		ReadTimeout:       readTimeout,
		WriteTimeout:      writeTimeout,
		IdleTimeout:       idleTimeout,
	}

	log.Printf("Starting Whisper Server on %s", addr)
	log.Println("")
	log.Println("Endpoints:")
	log.Println("  GET  /health - Health check")
	log.Println("  POST /v1/audio/transcriptions - Transcribe/translate audio")
	log.Println("  GET  /v1/models - List available models")

	log.Printf("\nAccess the API at:")
	log.Printf("  Local:   http://localhost:%s", cfg.Port)

	for _, ip := range getLocalIPs() {
		log.Printf("  Network: http://%s:%s", ip, cfg.Port)
	}

	log.Printf("\n(Server listening on all network interfaces)")
	log.Println("")

	serverErr := make(chan error, 1)
	go func() {
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			serverErr <- err
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	select {
	case err := <-serverErr:
		log.Printf("Server error: %v", err)
		return 1
	case <-quit:
	}

	log.Println("Shutting down server...")
	ctx, cancel := context.WithTimeout(context.Background(), shutdownTimeout)
	defer cancel()
	if err := server.Shutdown(ctx); err != nil {
		// A transcription may still run. Freeing the model now would crash it,
		// so skip the deferred Close and let the process exit.
		log.Printf("Server shutdown error: %v", err)
		os.Exit(1)
	}
	return 0
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
