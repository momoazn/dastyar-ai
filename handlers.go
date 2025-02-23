package main

import (
	"embed"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"net/url"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/ollama/ollama/api"
	"gorm.io/gorm"
)

func handleGetAllSessions(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		var sessions []Session
		result := db.Preload("Messages").Order("updated_at DESC").Find(&sessions)
		if result.Error != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": result.Error.Error()})
		}
		return c.JSON(http.StatusOK, sessions)
	}
}

func handleCreateSession(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		var session Session
		if err := c.Bind(&session); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}

		result := db.Create(&session)
		if result.Error != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": result.Error.Error()})
		}

		return c.JSON(http.StatusCreated, session)
	}
}

func handleGetSession(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		id := c.Param("id")
		var session Session

		result := db.Preload("Messages").First(&session, id)
		if result.Error != nil {
			if result.Error == gorm.ErrRecordNotFound {
				return c.JSON(http.StatusNotFound, map[string]string{"error": "Session not found"})
			}
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": result.Error.Error()})
		}

		return c.JSON(http.StatusOK, session)
	}
}

func handleDeleteSession(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		id := c.Param("id")
		result := db.Delete(&Session{}, id)
		if result.Error != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": result.Error.Error()})
		}
		if result.RowsAffected == 0 {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "Session not found"})
		}
		return c.NoContent(http.StatusOK)
	}
}

func handleAddMessage(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		sessionID := c.Param("id")
		var msg ChatMessage
		if err := c.Bind(&msg); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}

		// Verify session exists
		var session Session
		result := db.First(&session, sessionID)
		if result.Error != nil {
			if result.Error == gorm.ErrRecordNotFound {
				return c.JSON(http.StatusNotFound, map[string]string{"error": "Session not found"})
			}
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": result.Error.Error()})
		}

		// Set session ID and create message
		msg.SessionID = session.ID
		result = db.Create(&msg)
		if result.Error != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": result.Error.Error()})
		}

		// Update session's updated_at timestamp
		db.Model(&session).Update("updated_at", time.Now())

		return c.JSON(http.StatusCreated, msg)
	}
}

type ChatRequest struct {
	Message string `json:"message"`
	Model   string `json:"model"`
}

func handleStreamChat(db *gorm.DB, ollamaClient *api.Client) echo.HandlerFunc {
	return func(c echo.Context) error {
		sessionID := c.Param("id")
		var chatReq ChatRequest
		if err := c.Bind(&chatReq); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}

		// Verify session exists
		var session Session
		result := db.First(&session, sessionID)
		if result.Error != nil {
			if result.Error == gorm.ErrRecordNotFound {
				return c.JSON(http.StatusNotFound, map[string]string{"error": "Session not found"})
			}
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": result.Error.Error()})
		}

		// Create and save user message
		userMsg := ChatMessage{
			SessionID: session.ID,
			Role:      "user",
			Content:   chatReq.Message,
			CreatedAt: time.Now(),
		}
		if err := db.Create(&userMsg).Error; err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}

		// Create assistant message (will be updated with streamed content)
		assistantMsg := ChatMessage{
			SessionID: session.ID,
			Role:      "assistant",
			Content:   "",
			CreatedAt: time.Now(),
		}
		if err := db.Create(&assistantMsg).Error; err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}

		// Set up SSE headers
		c.Response().Header().Set("Content-Type", "text/event-stream")
		c.Response().Header().Set("Cache-Control", "no-cache")
		c.Response().Header().Set("Connection", "keep-alive")
		c.Response().WriteHeader(http.StatusOK)

		// Create a channel to handle client disconnection
		done := c.Request().Context().Done()
		fullResponse := ""

		// Start streaming response
		err := ollamaClient.Chat(c.Request().Context(), &api.ChatRequest{
			Model: chatReq.Model,
			Messages: []api.Message{
				{Role: "user", Content: chatReq.Message},
			},
			Stream: func() *bool { b := true; return &b }(),
		}, func(response api.ChatResponse) error {
			select {
			case <-done:
				return fmt.Errorf("client disconnected")
			default:
				fullResponse += response.Message.Content
				// Send the chunk to the client
				fmt.Fprintf(c.Response(), "data: %s\n\n", response.Message.Content)
				c.Response().Flush()
				return nil
			}
		})

		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}

		// Update the assistant message with the complete response
		db.Model(&assistantMsg).Update("content", fullResponse)
		// Update session's updated_at timestamp
		db.Model(&session).Update("updated_at", time.Now())

		return nil
	}
}

func handleGetModels(ollamaClient *api.Client) echo.HandlerFunc {
	return func(c echo.Context) error {
		models, err := ollamaClient.List(c.Request().Context())
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusOK, models)
	}
}

//go:embed dist
var staticFiles embed.FS

func setupServer(db *gorm.DB) (*echo.Echo, error) {
	// Create Echo instance
	e := echo.New()

	// Create a file system from the embedded static directory
	staticFS, err := fs.Sub(staticFiles, "dist")
	if err != nil {
		log.Fatal(err)
	}

	// Middleware
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{echo.GET, echo.POST, echo.PUT, echo.DELETE},
	}))

	// API group
	apiGroup := e.Group("/api")

	// Create Ollama client
	ollamaURL, _ := url.Parse("http://localhost:11434")
	ollamaClient := api.NewClient(ollamaURL, &http.Client{})

	// Session endpoints
	apiGroup.GET("/sessions", handleGetAllSessions(db))
	apiGroup.POST("/sessions", handleCreateSession(db))
	apiGroup.GET("/sessions/:id", handleGetSession(db))
	apiGroup.DELETE("/sessions/:id", handleDeleteSession(db))
	apiGroup.POST("/sessions/:id/messages", handleAddMessage(db))

	// Streaming chat endpoint
	apiGroup.POST("/sessions/:id/chat", handleStreamChat(db, ollamaClient))

	apiGroup.GET("/models", handleGetModels(ollamaClient))

	// Create a handler for serving static files
	// This should be last to ensure API routes are handled first
	fileHandler := http.FileServer(http.FS(staticFS))
	e.GET("/*", echo.WrapHandler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// If path starts with /api, return 404 as it means no API route was matched
		if len(r.URL.Path) >= 4 && r.URL.Path[:4] == "/api" {
			http.NotFound(w, r)
			return
		}
		fileHandler.ServeHTTP(w, r)
	})))

	return e, nil
}
