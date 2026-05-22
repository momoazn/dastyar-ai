package main

import (
	"context"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"whisper/internal/handler"
	"whisper/internal/service"
)

type config struct {
	port      string
	modelDir  string
	modelName string
}

func loadConfig() config {
	cfg := config{
		port:      os.Getenv("PORT"),
		modelDir:  os.Getenv("MODEL_PATH"),
		modelName: os.Getenv("MODEL_NAME"),
	}

	if cfg.port == "" {
		cfg.port = "8080"
	}
	if cfg.modelDir == "" {
		cfg.modelDir = "./models"
	}
	if cfg.modelName == "" {
		cfg.modelName = "ggml-base.bin"
	}

	return cfg
}

func main() {
	cfg := loadConfig()

	log.Printf("Loading Whisper model: %s from directory: %s", cfg.modelName, cfg.modelDir)

	whisperService, err := service.NewWhisperService(cfg.modelDir, cfg.modelName)
	if err != nil {
		log.Fatalf("Failed to initialize Whisper service: %v", err)
	}
	defer whisperService.Close()

	log.Println("Whisper model loaded successfully")

	transcribeHandler := handler.NewTranscribeHandler(whisperService)
	mux := http.NewServeMux()

	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	})

	mux.HandleFunc("/v1/audio/transcriptions", transcribeHandler.HandleOpenAITranscriptions)
	mux.HandleFunc("/v1/models", transcribeHandler.HandleOpenAIModels)

	addr := fmt.Sprintf("0.0.0.0:%s", cfg.port)
	server := &http.Server{
		Addr:              addr,
		Handler:           mux,
		ReadHeaderTimeout: 10 * time.Second,
	}

	log.Printf("Starting Whisper Server on %s", addr)
	log.Println("")
	log.Println("Endpoints:")
	log.Println("  GET  /health - Health check")
	log.Println("    POST /v1/audio/transcriptions - Transcribe/translate audio")
	log.Println("    GET  /v1/models - List available models")

	log.Printf("\nAccess the API at:")
	log.Printf("  Local:   http://localhost:%s", cfg.port)

	if ips := getLocalIPs(); len(ips) > 0 {
		for _, ip := range ips {
			log.Printf("  Network: http://%s:%s", ip, cfg.port)
		}
	}

	log.Printf("\n(Server listening on all network interfaces)")
	log.Println("")

	go func() {
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := server.Shutdown(ctx); err != nil {
		log.Printf("Server shutdown error: %v", err)
	}
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
