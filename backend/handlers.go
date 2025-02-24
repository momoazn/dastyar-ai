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

type Response struct {
	Data    any    `json:"data"`
	Message string `json:"message"`
}

type PaginatedResponse struct {
	Data        any    `json:"data"`
	Message     string `json:"message"`
	HasNext     bool   `json:"has_next"`
	HasPrevious bool   `json:"has_previous"`
}

type ErrorResponse struct {
	Message string `json:"message"`
}

type Handler struct {
	db           *gorm.DB
	ollamaClient *api.Client
}

func (h *Handler) handleGetAllThreads(c echo.Context) error {
	var threads []Thread
	result := h.db.Preload("Messages").Order("updated_at DESC").Find(&threads)
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: result.Error.Error(),
		})
	}
	return c.JSON(http.StatusOK, PaginatedResponse{
		Data:        threads,
		Message:     "Threads fetched successfully",
		HasNext:     len(threads) > 10,
		HasPrevious: false,
	})
}

func (h *Handler) handleCreateThread(c echo.Context) error {
	var thread Thread
	if err := c.Bind(&thread); err != nil {
		return c.JSON(http.StatusBadRequest, ErrorResponse{
			Message: err.Error(),
		})
	}

	result := h.db.Create(&thread)
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: result.Error.Error(),
		})
	}

	return c.JSON(http.StatusCreated, Response{
		Data:    thread,
		Message: "Thread created successfully",
	})
}

func (h *Handler) handleGetThread(c echo.Context) error {
	id := c.Param("id")
	var thread Thread

	result := h.db.Preload("Messages").First(&thread, id)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return c.JSON(http.StatusNotFound, ErrorResponse{
				Message: "Thread not found",
			})
		}
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: result.Error.Error(),
		})
	}

	return c.JSON(http.StatusOK, Response{
		Data:    thread,
		Message: "Thread fetched successfully",
	})
}

func (h *Handler) handleDeleteThread(c echo.Context) error {
	id := c.Param("id")
	result := h.db.Delete(&Thread{}, id)
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: result.Error.Error(),
		})
	}
	if result.RowsAffected == 0 {
		return c.JSON(http.StatusNotFound, ErrorResponse{
			Message: "Thread not found",
		})
	}
	return c.JSON(http.StatusOK, Response{
		Message: "Thread deleted successfully",
	})
}

func (h *Handler) handleGetMessages(c echo.Context) error {
	ThreadID := c.Param("id")
	var messages []ChatMessage
	result := h.db.Where("thread_id = ?", ThreadID).Order("created_at ASC").Find(&messages)
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: result.Error.Error(),
		})
	}
	return c.JSON(http.StatusOK, PaginatedResponse{
		Data:        messages,
		Message:     "Messages fetched successfully",
		HasNext:     len(messages) > 10,
		HasPrevious: false,
	})
}

type ChatRequest struct {
	Message  string `json:"message"`
	Model    string `json:"model"`
	ThreadID string `json:"thread_id"`
}

func (h *Handler) handleStreamChat(c echo.Context) error {
	var chatReq ChatRequest
	if err := c.Bind(&chatReq); err != nil {
		return c.JSON(http.StatusBadRequest, ErrorResponse{
			Message: err.Error(),
		})
	}

	// Verify session exists
	var thread Thread
	result := h.db.First(&thread, chatReq.ThreadID)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return c.JSON(http.StatusNotFound, ErrorResponse{
				Message: "Thread not found",
			})
		}
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: result.Error.Error(),
		})
	}

	// Create and save user message
	userMsg := ChatMessage{
		ThreadID:  thread.ID,
		Role:      "user",
		Content:   chatReq.Message,
		CreatedAt: time.Now(),
	}
	if err := h.db.Create(&userMsg).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: err.Error(),
		})
	}

	// Create assistant message (will be updated with streamed content)
	assistantMsg := ChatMessage{
		ThreadID:  thread.ID,
		Role:      "assistant",
		Content:   "",
		CreatedAt: time.Now(),
	}
	if err := h.db.Create(&assistantMsg).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: err.Error(),
		})
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
	err := h.ollamaClient.Chat(c.Request().Context(), &api.ChatRequest{
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
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: err.Error(),
		})
	}

	// Update the assistant message with the complete response
	h.db.Model(&assistantMsg).Update("content", fullResponse)
	// Update session's updated_at timestamp
	h.db.Model(&thread).Update("updated_at", time.Now())

	return nil
}

func (h *Handler) handleGetModels(c echo.Context) error {
	models, err := h.ollamaClient.List(c.Request().Context())
	if err != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: err.Error(),
		})
	}
	return c.JSON(http.StatusOK, models)
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

	handler := &Handler{
		db:           db,
		ollamaClient: ollamaClient,
	}

	// Session endpoints
	apiGroup.GET("/threads", handler.handleGetAllThreads)
	apiGroup.POST("/threads", handler.handleCreateThread)
	apiGroup.GET("/threads/:id", handler.handleGetThread)
	apiGroup.DELETE("/threads/:id", handler.handleDeleteThread)
	apiGroup.GET("/threads/:id/messages", handler.handleGetMessages)

	// Streaming chat endpoint
	apiGroup.POST("/chat", handler.handleStreamChat)

	apiGroup.GET("/models", handler.handleGetModels)

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
