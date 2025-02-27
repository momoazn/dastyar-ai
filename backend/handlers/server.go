package handlers

import (
	"embed"
	"io/fs"
	"net/http"
	"net/url"
	"strconv"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/ollama/ollama/api"
	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

func SetupServer(db *gorm.DB, staticFiles embed.FS) (*echo.Echo, error) {
	start := time.Now()
	log.Info().Msg("Setting up HTTP server...")

	// Create Echo instance
	e := echo.New()

	// Create a file system from the embedded static directory
	staticFS, err := fs.Sub(staticFiles, "dist")
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to create static file system")
		return nil, err
	}

	// Middleware
	e.Use(middleware.RequestLoggerWithConfig(middleware.RequestLoggerConfig{
		LogURI:           true,
		LogStatus:        true,
		LogLatency:       true,
		LogProtocol:      true,
		LogRemoteIP:      true,
		LogHost:          true,
		LogMethod:        true,
		LogContentLength: true,
		LogResponseSize:  true,
		LogReferer:       true,
		LogUserAgent:     true,
		LogError:         true,
		LogRequestID:     true,
		LogValuesFunc: func(c echo.Context, v middleware.RequestLoggerValues) error {
			logger := log.Info()
			if v.Error != nil {
				logger = log.Error().Err(v.Error)
			}

			// Add essential fields first
			logger.
				Str("method", v.Method).
				Str("uri", v.URI).
				Int("status", v.Status)

			// Add latency with proper formatting
			if v.Latency > 0 {
				logger.Dur("latency", v.Latency)
			}

			// Add request details
			if v.ContentLength != "" {
				if contentLength, err := strconv.ParseInt(v.ContentLength, 10, 64); err == nil && contentLength > 0 {
					logger.Int64("req_size", contentLength)
				}
			}
			if v.ResponseSize > 0 {
				logger.Int64("res_size", v.ResponseSize)
			}

			// Add client information
			logger.
				Str("ip", v.RemoteIP).
				Str("protocol", v.Protocol)

			// Add optional fields if present
			if v.RequestID != "" {
				logger.Str("request_id", v.RequestID)
			}
			if v.UserAgent != "" {
				logger.Str("user_agent", v.UserAgent)
			}
			if v.Referer != "" {
				logger.Str("referer", v.Referer)
			}

			// Log the request with appropriate message based on status
			msg := "Request handled"
			if v.Status >= 400 {
				msg = "Request failed"
			}
			logger.Msg(msg)
			return nil
		},
	}))
	e.Use(middleware.Recover())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{echo.GET, echo.POST, echo.PUT, echo.DELETE},
	}))

	log.Info().Msg("Configured HTTP middleware")

	// API group
	apiGroup := e.Group("/api")

	// Create Ollama client
	ollamaURL, _ := url.Parse("http://localhost:11434")
	ollamaClient := api.NewClient(ollamaURL, &http.Client{})
	log.Info().Str("url", ollamaURL.String()).Msg("Configured Ollama client")

	handler := NewHandler(db, ollamaClient)

	// Threads and messages endpoints
	apiGroup.GET("/threads", handler.handleGetAllThreads)
	apiGroup.POST("/threads", handler.handleCreateThread)
	apiGroup.GET("/threads/:id", handler.handleGetThread)
	apiGroup.PUT("/threads/:id", handler.handleUpdateThread)
	apiGroup.DELETE("/threads/:id", handler.handleDeleteThread)
	apiGroup.GET("/threads/:id/messages", handler.handleGetThreadMessages)
	apiGroup.GET("/threads/:id/translations", handler.handleGetThreadTranslations)

	// Streaming chat endpoint
	apiGroup.POST("/chat", handler.handleStreamChat)
	apiGroup.POST("/translate", handler.handleTranslate)
	apiGroup.GET("/models", handler.handleGetModels)

	// Health check endpoint
	apiGroup.GET("/health", handler.handleHealthCheck)

	log.Info().Msg("Registered API routes")

	// Create a handler for serving static files
	fileHandler := http.FileServer(http.FS(staticFS))
	e.GET("/*", echo.WrapHandler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if len(r.URL.Path) >= 4 && r.URL.Path[:4] == "/api" {
			http.NotFound(w, r)
			return
		}
		fileHandler.ServeHTTP(w, r)
	})))

	log.Info().
		Str("static_dir", "dist").
		Dur("setup_duration_ms", time.Since(start)).
		Msg("Server setup completed")

	return e, nil
}
