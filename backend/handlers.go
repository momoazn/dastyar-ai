package main

import (
	"embed"
	"encoding/json"
	"fmt"
	"io/fs"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/ollama/ollama/api"
	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

type Response[T any] struct {
	Data    T      `json:"data"`
	Message string `json:"message"`
}

type PaginatedResponse[T any] struct {
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
	start := time.Now()
	log.Info().Msg("Handling get all threads request")

	var threads []Thread
	result := h.db.Preload("Messages").Order("updated_at DESC").Find(&threads)
	if result.Error != nil {
		log.Error().Err(result.Error).Msg("Failed to fetch threads")
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: result.Error.Error(),
		})
	}

	log.Info().
		Int("thread_count", len(threads)).
		Dur("duration_ms", time.Since(start)).
		Msg("Successfully fetched threads")

	return c.JSON(http.StatusOK, PaginatedResponse[Thread]{
		Data:        threads,
		Message:     "Threads fetched successfully",
		HasNext:     len(threads) > 10,
		HasPrevious: false,
	})
}

func (h *Handler) handleCreateThread(c echo.Context) error {
	start := time.Now()
	log.Info().Msg("Handling create thread request")

	var thread Thread
	if err := c.Bind(&thread); err != nil {
		log.Error().Err(err).Msg("Failed to bind request")
		return c.JSON(http.StatusBadRequest, ErrorResponse{
			Message: err.Error(),
		})
	}

	log.Info().
		Str("title", thread.Title).
		Str("model", thread.Model).
		Msg("Creating new thread")

	result := h.db.Create(&thread)
	if result.Error != nil {
		log.Error().Err(result.Error).Msg("Failed to create thread")
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: result.Error.Error(),
		})
	}

	log.Info().
		Uint("thread_id", thread.ID).
		Str("title", thread.Title).
		Dur("duration_ms", time.Since(start)).
		Msg("Thread created successfully")

	return c.JSON(http.StatusCreated, Response[Thread]{
		Data:    thread,
		Message: "Thread created successfully",
	})
}

func (h *Handler) handleGetThread(c echo.Context) error {
	start := time.Now()
	id := c.Param("id")
	log.Info().Str("thread_id", id).Msg("Handling get thread request")

	var thread Thread
	result := h.db.Preload("Messages").First(&thread, id)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			log.Info().Str("thread_id", id).Msg("Thread not found")
			return c.JSON(http.StatusNotFound, ErrorResponse{
				Message: "Thread not found",
			})
		}
		log.Error().Err(result.Error).Str("thread_id", id).Msg("Failed to fetch thread")
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: result.Error.Error(),
		})
	}

	log.Info().
		Str("thread_id", id).
		Str("title", thread.Title).
		Int("message_count", len(thread.Messages)).
		Dur("duration_ms", time.Since(start)).
		Msg("Thread fetched successfully")

	return c.JSON(http.StatusOK, Response[Thread]{
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
	return c.JSON(http.StatusOK, Response[Thread]{
		Message: "Thread deleted successfully",
	})
}

func (h *Handler) handleGetThreadMessages(c echo.Context) error {
	ThreadID := c.Param("id")
	var messages []ChatMessage
	result := h.db.Where("thread_id = ?", ThreadID).Order("timestamp ASC").Find(&messages)
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: result.Error.Error(),
		})
	}
	return c.JSON(http.StatusOK, PaginatedResponse[ChatMessage]{
		Data:        messages,
		Message:     "Messages fetched successfully",
		HasNext:     len(messages) > 10,
		HasPrevious: false,
	})
}

type ChatRequest struct {
	Content  string `json:"content"`
	Model    string `json:"model"`
	ThreadID string `json:"thread_id"`
}

type ChatResponse struct {
	ID        uint      `json:"id"`
	ThreadID  uint      `json:"thread_id"`
	Content   string    `json:"content"`
	Think     string    `json:"think"`
	State     string    `json:"state"`
	Role      string    `json:"role"`
	Model     string    `json:"model"`
	Timestamp time.Time `json:"timestamp"`
}

func (h *Handler) handleStreamChat(c echo.Context) error {
	start := time.Now()
	log.Info().Msg("Handling stream chat request")

	var chatReq ChatRequest
	if err := c.Bind(&chatReq); err != nil {
		log.Error().Err(err).Msg("Failed to bind chat request")
		return c.JSON(http.StatusBadRequest, ErrorResponse{
			Message: err.Error(),
		})
	}

	if chatReq.Content == "" || chatReq.Model == "" || chatReq.ThreadID == "" {
		log.Error().Msg("message, model, and thread_id are required")
		return c.JSON(http.StatusBadRequest, ErrorResponse{
			Message: "message, model, and thread_id are required",
		})
	}

	// Log sanitized request (exclude sensitive data)
	log.Info().
		Str("thread_id", chatReq.ThreadID).
		Str("model", chatReq.Model).
		Int("message_length", len(chatReq.Content)).
		Msg("Chat request received")

	// Verify thread exists
	var thread Thread
	result := h.db.First(&thread, chatReq.ThreadID)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			log.Info().Str("thread_id", chatReq.ThreadID).Msg("Thread not found")
			return c.JSON(http.StatusNotFound, ErrorResponse{
				Message: "Thread not found",
			})
		}
		log.Error().Err(result.Error).Str("thread_id", chatReq.ThreadID).Msg("Failed to fetch thread")
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: result.Error.Error(),
		})
	}

	msgStart := time.Now()
	// Create and save user message
	userMsg := ChatMessage{
		ThreadID:  thread.ID,
		Role:      "user",
		Content:   chatReq.Content,
		Model:     chatReq.Model,
		Timestamp: time.Now(),
	}
	if err := h.db.Create(&userMsg).Error; err != nil {
		log.Error().Err(err).Str("thread_id", chatReq.ThreadID).Msg("Failed to save user message")
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: err.Error(),
		})
	}
	log.Info().
		Uint("message_id", userMsg.ID).
		Str("thread_id", chatReq.ThreadID).
		Dur("duration_ms", time.Since(msgStart)).
		Msg("User message saved")

	// Create assistant message (will be updated with streamed content)
	assistantMsg := ChatMessage{
		ThreadID:  thread.ID,
		Role:      "assistant",
		Content:   "",
		Think:     "",
		Model:     chatReq.Model,
		Timestamp: time.Now(),
		State:     "idle",
	}
	if err := h.db.Create(&assistantMsg).Error; err != nil {
		log.Error().Err(err).Str("thread_id", chatReq.ThreadID).Msg("Failed to create assistant message")
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: err.Error(),
		})
	}

	// Set up SSE headers
	c.Response().Header().Set("Content-Type", "application/x-ndjson")
	c.Response().Header().Set("Cache-Control", "no-cache")
	c.Response().Header().Set("Connection", "keep-alive")
	c.Response().Header().Set("Transfer-Encoding", "chunked")
	c.Response().WriteHeader(http.StatusOK)

	// Create a channel to handle client disconnection
	done := c.Request().Context().Done()
	streamStart := time.Now()
	chunk := ""
	fullContent := ""
	fullThink := ""
	chunkCount := 0
	isThinking := false
	isThinkingModel := isThinkingModel(chatReq.Model)
	currentState := "idle"

	var threadMessages []ChatMessage
	result = h.db.Where("thread_id = ?", chatReq.ThreadID).Order("timestamp ASC").Find(&threadMessages)
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: result.Error.Error(),
		})
	}

	messages := []api.Message{}
	for _, message := range threadMessages {
		messages = append(messages, api.Message{
			Role:    message.Role,
			Content: message.Content,
		})
	}

	// Start streaming response
	err := h.ollamaClient.Chat(c.Request().Context(), &api.ChatRequest{
		Model:    chatReq.Model,
		Messages: messages,
		Stream:   func() *bool { b := true; return &b }(),
	}, func(response api.ChatResponse) error {
		select {
		case <-done:
			log.Info().
				Str("thread_id", chatReq.ThreadID).
				Int("chunks_sent", chunkCount).
				Dur("stream_duration_ms", time.Since(streamStart)).
				Msg("Client disconnected")
			return fmt.Errorf("client disconnected")
		default:
			if isThinkingModel {
				if strings.HasPrefix(response.Message.Content, "<think>") {
					isThinking = true
					currentState = "thinking"
				}

				if strings.HasSuffix(response.Message.Content, "</think>") {
					isThinking = false
					currentState = "responding"
				}
			}

			chunkCount++
			if response.Message.Content != "<think>" && response.Message.Content != "</think>" {
				chunk = response.Message.Content
				if isThinking {
					fullThink += response.Message.Content
				} else {
					fullContent += response.Message.Content
				}
			}

			var res ChatResponse
			if isThinking {
				res = ChatResponse{
					ID:        assistantMsg.ID,
					Content:   "",
					Think:     chunk,
					State:     currentState,
					Role:      assistantMsg.Role,
					Model:     assistantMsg.Model,
					ThreadID:  assistantMsg.ThreadID,
					Timestamp: assistantMsg.Timestamp,
				}
			} else {
				res = ChatResponse{
					ID:        assistantMsg.ID,
					Content:   chunk,
					Think:     fullThink,
					State:     currentState,
					Role:      assistantMsg.Role,
					Model:     assistantMsg.Model,
					ThreadID:  assistantMsg.ThreadID,
					Timestamp: assistantMsg.Timestamp,
				}
			}

			// Send the chunk to the client
			json.NewEncoder(c.Response()).Encode(res)
			c.Response().Flush()
			return nil
		}
	})

	currentState = "done"

	if err != nil {
		log.Error().Err(err).
			Str("thread_id", chatReq.ThreadID).
			Int("chunks_sent", chunkCount).
			Dur("stream_duration_ms", time.Since(streamStart)).
			Msg("Streaming failed")
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: err.Error(),
		})
	}

	// Update the assistant message with the complete response
	updateStart := time.Now()
	if err := h.db.Model(&assistantMsg).
		Update("content", fullContent).
		Update("think", fullThink).
		Update("state", currentState).Error; err != nil {
		log.Error().Err(err).Str("thread_id", chatReq.ThreadID).Msg("Failed to update assistant message")
	}
	// Update thread's updated_at timestamp
	if err := h.db.Model(&thread).Update("updated_at", time.Now()).Error; err != nil {
		log.Error().Err(err).Str("thread_id", chatReq.ThreadID).Msg("Failed to update thread timestamp")
	}

	log.Info().
		Str("thread_id", chatReq.ThreadID).
		Int("response_length", len(fullContent)+len(fullThink)).
		Int("chunks_received", chunkCount).
		Dur("stream_duration_ms", time.Since(streamStart)).
		Dur("update_duration_ms", time.Since(updateStart)).
		Dur("total_duration_ms", time.Since(start)).
		Msg("Chat stream completed")

	return nil
}

func (h *Handler) handleGetModels(c echo.Context) error {
	models, err := h.ollamaClient.List(c.Request().Context())
	if err != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: err.Error(),
		})
	}
	return c.JSON(http.StatusOK, Response[[]api.ListModelResponse]{
		Data:    models.Models,
		Message: "Models fetched successfully",
	})
}

//go:embed dist
var staticFiles embed.FS

func setupServer(db *gorm.DB) (*echo.Echo, error) {
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
			if contentLength, err := strconv.ParseInt(v.ContentLength, 10, 64); err == nil && contentLength > 0 {
				logger.Int64("req_size", contentLength)
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

	handler := &Handler{
		db:           db,
		ollamaClient: ollamaClient,
	}

	// Threads and messages endpoints
	apiGroup.GET("/threads", handler.handleGetAllThreads)
	apiGroup.POST("/threads", handler.handleCreateThread)
	apiGroup.GET("/threads/:id", handler.handleGetThread)
	apiGroup.DELETE("/threads/:id", handler.handleDeleteThread)
	apiGroup.GET("/threads/:id/messages", handler.handleGetThreadMessages)

	// Streaming chat endpoint
	apiGroup.POST("/chat", handler.handleStreamChat)
	apiGroup.GET("/models", handler.handleGetModels)

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
