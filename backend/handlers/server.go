package handlers

import (
	"embed"
	"io"
	"io/fs"
	"net/http"
	"net/url"
	"os"
	"path"
	"strconv"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/ollama/ollama/api"
	"github.com/rs/zerolog/log"
	"gorm.io/gorm"

	_ "ai-assistant/docs"

	echoSwagger "github.com/swaggo/echo-swagger"
)

type Handler struct {
	db           *gorm.DB
	ollamaClient *api.Client
}

func NewHandler(db *gorm.DB, ollamaClient *api.Client) *Handler {
	return &Handler{
		db:           db,
		ollamaClient: ollamaClient,
	}
}

// setupRequestLogger creates a custom request logger middleware
func setupRequestLogger() echo.MiddlewareFunc {
	return middleware.RequestLoggerWithConfig(middleware.RequestLoggerConfig{
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
	})
}

// setupMiddleware configures all middleware for the server
func setupMiddleware(e *echo.Echo) {
	e.Use(setupRequestLogger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{echo.GET, echo.POST, echo.PUT, echo.DELETE},
	}))
	log.Info().Msg("Configured HTTP middlewares")
}

// registerAPIRoutes configures all API routes
func registerAPIRoutes(e *echo.Echo, handler *Handler) {
	apiGroup := e.Group("/api")

	apiGroup.GET("/chat-threads", handler.handleGetAllChatThreads)
	apiGroup.POST("/chat-threads", handler.handleCreateChatThread)
	apiGroup.GET("/chat-threads/:id", handler.handleGetChatThread)
	apiGroup.PUT("/chat-threads/:id", handler.handleUpdateChatThread)
	apiGroup.DELETE("/chat-threads/:id", handler.handleDeleteChatThread)
	apiGroup.GET("/chat-threads/:id/messages", handler.handleGetChatThreadMessages)

	apiGroup.GET("/translations", handler.handleGetAllTranslations)
	apiGroup.GET("/translations/:id", handler.handleGetTranslationById)
	apiGroup.POST("/translations", handler.handleCreateTranslation)
	apiGroup.DELETE("/translations/:id", handler.handleDeleteTranslation)

	apiGroup.POST("/chat", handler.handleStreamChat)

	apiGroup.GET("/health", handler.handleHealthCheck)

	log.Info().Msg("Registered API routes")
}

// createSPAHandler creates a handler for serving the Single Page Application
func createSPAHandler(staticFS fs.FS) http.HandlerFunc {
	fileHandler := http.FileServer(http.FS(staticFS))

	return func(w http.ResponseWriter, r *http.Request) {
		if len(r.URL.Path) >= 4 && r.URL.Path[:4] == "/api" {
			http.NotFound(w, r)
			return
		}

		// First try to serve the file directly
		err := func() error {
			f, err := staticFS.Open(r.URL.Path)
			if err != nil {
				return err
			}
			defer f.Close()
			return nil
		}()

		// If file doesn't exist, check if this is a route (no file extension)
		if err != nil {
			// Check if the path has a file extension
			if path.Ext(r.URL.Path) == "" {
				indexFile, err := staticFS.Open("index.html")
				if err != nil {
					http.Error(w, "Internal Server Error", http.StatusInternalServerError)
					return
				}
				defer indexFile.Close()
				w.Header().Set("Content-Type", "text/html; charset=utf-8")
				http.ServeContent(w, r, "index.html", time.Time{}, indexFile.(io.ReadSeeker))
				return
			}
		}

		fileHandler.ServeHTTP(w, r)
	}
}

// setupStaticFiles configures static file serving for the SPA
func setupStaticFiles(e *echo.Echo, staticFiles embed.FS) (fs.FS, error) {
	staticFS, err := fs.Sub(staticFiles, "dist")
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to create static file system")
		return nil, err
	}

	e.GET("/*", echo.WrapHandler(createSPAHandler(staticFS)))
	log.Info().Str("static_dir", "dist").Msg("Configured static file serving")

	return staticFS, nil
}

// createOllamaClient creates and configures the Ollama client
func createOllamaClient() *api.Client {
	var ollamaHost string = os.Getenv("OLLAMA_HOST")
	if ollamaHost == "" {
		ollamaHost = "http://localhost:11434"
	}
	ollamaURL, _ := url.Parse(ollamaHost)
	ollamaClient := api.NewClient(ollamaURL, &http.Client{})
	log.Info().Str("url", ollamaURL.String()).Msg("Configured Ollama client")
	return ollamaClient
}

func SetupServer(db *gorm.DB, staticFiles embed.FS) (*echo.Echo, error) {
	start := time.Now()
	log.Info().Msg("Setting up HTTP server...")

	// Create Echo instance
	e := echo.New()

	// Setup all components
	setupMiddleware(e)

	e.GET("/docs/*", echoSwagger.WrapHandler)
	log.Info().Msg("Swagger documentation available at /docs/index.html")

	ollamaClient := createOllamaClient()
	handler := NewHandler(db, ollamaClient)
	registerAPIRoutes(e, handler)

	_, err := setupStaticFiles(e, staticFiles)
	if err != nil {
		return nil, err
	}

	log.Info().
		Dur("setup_duration_ms", time.Since(start)).
		Msg("Server setup completed")

	return e, nil
}
