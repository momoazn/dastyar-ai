// @title Persian AI Assistant API
// @version 1.0
// @description A comprehensive AI Assistant API that provides chat functionality, translation services, and LLM model management. This API supports streaming chat responses, multi-language translation with tone control, and chat thread management.
// @termsOfService http://swagger.io/terms/
// @contact.name API Support
// @contact.url http://www.swagger.io/support
// @contact.email support@swagger.io
// @license.name MIT
// @license.url https://opensource.org/licenses/MIT
// @host localhost:8080
// @BasePath /api
// @schemes http https
// @securityDefinitions.basic BasicAuth
package main

import (
	"ai-assistant/db"
	"ai-assistant/handlers"
	"ai-assistant/logger"
	"ai-assistant/utils"
	"embed"
	"fmt"
	"os"
	"runtime"

	"github.com/joho/godotenv"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

//go:embed dist
var staticFiles embed.FS

func main() {
	// Initialize logger with configuration
	if err := logger.InitLogger(logger.Config{
		ConsoleLoggingEnabled: true,
		ConsoleLogLevel:       zerolog.InfoLevel,
		FileLoggingEnabled:    true,
		FileLogLevel:          zerolog.InfoLevel,
		FilePath:              "logs/app.log",
	}); err != nil {
		log.Fatal().Err(err).Msg("Failed to setup logger")
	}

	// Log system information
	log.Info().
		Str("os", runtime.GOOS).
		Str("arch", runtime.GOARCH).
		Int("cpus", runtime.NumCPU()).
		Str("version", runtime.Version()).
		Msg("System information")

	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Warn().Err(err).Msg("No .env file found")
	}

	// Initialize database
	log.Info().Msg("Initializing database...")
	db, err := db.InitDB()
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to initialize database")
	}

	// Ensure database cleanup
	defer func() {
		sqlDB, err := db.DB()
		if err != nil {
			log.Error().Err(err).Msg("Error accessing database connection")
			return
		}
		if err := sqlDB.Close(); err != nil {
			log.Error().Err(err).Msg("Error closing database connection")
		} else {
			log.Info().Msg("Database connection closed cleanly")
		}
	}()

	// Setup routes
	log.Info().Msg("Setting up HTTP server...")
	e, err := handlers.SetupServer(db, staticFiles)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to setup server")
	}

	// Define the server address
	serverAddr := os.Getenv("SERVER_ADDR")
	if serverAddr == "" {
		serverAddr = "localhost:8080"
	}
	log.Info().
		Str("address", fmt.Sprintf("http://%s", serverAddr)).
		Msg("Server initialized")

	// Open browser automatically in background
	go func() {
		if os.Getenv("DONT_OPEN_BROWSER") != "true" {
			utils.OpenBrowser(serverAddr)
		}
	}()

	// Start the server
	if err := e.Start(serverAddr); err != nil {
		log.Fatal().Err(err).Msg("Server shutdown unexpectedly")
	}
}
