package handlers

import (
	"ai-assistant/db"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

// @Summary Get all chat threads
// @Description Retrieve a paginated list of all chat threads, ordered by last update time (newest first)
// @Tags Chat Threads
// @Produce json
// @Success 200 {object} PaginatedResponse[db.ChatThread] "List of chat threads with pagination info"
// @Failure 500 {object} ErrorResponse "Internal server error - database error"
// @Router /chat-threads [get]
func (h *Handler) handleGetAllChatThreads(c echo.Context) error {
	start := time.Now()
	log.Info().Msg("Handling get all chat threads request")

	var chatThreads []db.ChatThread
	result := h.db.Order("updated_at DESC").Find(&chatThreads)
	if result.Error != nil {
		log.Error().Err(result.Error).Msg("Failed to fetch chat threads")
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: result.Error.Error(),
		})
	}

	log.Info().
		Int("chat_thread_count", len(chatThreads)).
		Dur("duration_ms", time.Since(start)).
		Msg("Successfully fetched chat threads")

	return c.JSON(http.StatusOK, PaginatedResponse[db.ChatThread]{
		Data:        chatThreads,
		HasNext:     len(chatThreads) > 10,
		HasPrevious: false,
	})
}

// CreateChatThreadRequest represents a request to create a new chat thread
// @Description Request payload for creating a new chat thread
type CreateChatThreadRequest struct {
	Title string `json:"title" example:"My Chat with AI" binding:"required"` // The title of the chat thread
	LLM   string `json:"llm" example:"llama3.2:latest" binding:"required"`   // The default LLM model for this thread
}

// @Summary Create a new chat thread
// @Description Create a new chat thread with a title and default LLM model. This thread will be used to organize related chat messages.
// @Tags Chat Threads
// @Accept json
// @Produce json
// @Param chat_thread body CreateChatThreadRequest true "Chat thread details"
// @Success 201 {object} Response[db.ChatThread] "Chat thread created successfully"
// @Failure 400 {object} ErrorResponse "Bad request - missing required fields"
// @Failure 500 {object} ErrorResponse "Internal server error - database error"
// @Router /chat-threads [post]
func (h *Handler) handleCreateChatThread(c echo.Context) error {
	start := time.Now()
	log.Info().Msg("Handling create chat thread request")

	var request CreateChatThreadRequest
	if err := c.Bind(&request); err != nil {
		log.Error().Err(err).Msg("Failed to bind request")
		return c.JSON(http.StatusBadRequest, ErrorResponse{
			Message: err.Error(),
		})
	}

	log.Info().
		Str("title", request.Title).
		Str("llm", request.LLM).
		Msg("Creating new chat thread")

	chatThread := db.ChatThread{
		Title:     request.Title,
		LLM:       request.LLM,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	result := h.db.Create(&chatThread)
	if result.Error != nil {
		log.Error().Err(result.Error).Msg("Failed to create chat thread")
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: result.Error.Error(),
		})
	}

	log.Info().
		Uint("chat_thread_id", chatThread.ID).
		Str("title", chatThread.Title).
		Dur("duration_ms", time.Since(start)).
		Msg("Chat thread created successfully")

	return c.JSON(http.StatusCreated, Response[db.ChatThread]{
		Data: chatThread,
	})
}

// @Summary Get a chat thread by ID
// @Description Retrieve a specific chat thread by its unique identifier, including all associated messages
// @Tags Chat Threads
// @Produce json
// @Param id path string true "Chat thread ID" example:"123"
// @Success 200 {object} Response[db.ChatThread] "Chat thread details with messages"
// @Failure 404 {object} ErrorResponse "Chat thread not found"
// @Failure 500 {object} ErrorResponse "Internal server error - database error"
// @Router /chat-threads/{id} [get]
func (h *Handler) handleGetChatThread(c echo.Context) error {
	start := time.Now()
	id := c.Param("id")
	log.Info().Str("chat_thread_id", id).Msg("Handling get chat thread request")

	var chatThread db.ChatThread
	result := h.db.Preload("Messages").First(&chatThread, id)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			log.Info().Str("chat_thread_id", id).Msg("Chat thread not found")
			return c.JSON(http.StatusNotFound, ErrorResponse{
				Message: "Chat thread not found",
			})
		}
		log.Error().Err(result.Error).Str("chat_thread_id", id).Msg("Failed to fetch chat thread")
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: result.Error.Error(),
		})
	}

	log.Info().
		Str("chat_thread_id", id).
		Str("title", chatThread.Title).
		Int("message_count", len(chatThread.Messages)).
		Dur("duration_ms", time.Since(start)).
		Msg("Chat thread fetched successfully")

	return c.JSON(http.StatusOK, Response[db.ChatThread]{
		Data: chatThread,
	})
}

// UpdateChatThreadRequest represents a request to update a chat thread
// @Description Request payload for updating an existing chat thread
type UpdateChatThreadRequest struct {
	Title string `json:"title" example:"Updated Chat Title" binding:"required"` // The new title for the chat thread
}

// @Summary Update a chat thread
// @Description Update the title of an existing chat thread. The updated_at timestamp will be automatically updated.
// @Tags Chat Threads
// @Accept json
// @Produce json
// @Param id path string true "Chat thread ID" example:"123"
// @Param chat_thread body UpdateChatThreadRequest true "Chat thread details"
// @Success 200 {object} Response[db.ChatThread] "Chat thread updated successfully"
// @Failure 400 {object} ErrorResponse "Bad request - missing required fields"
// @Failure 404 {object} ErrorResponse "Chat thread not found"
// @Failure 500 {object} ErrorResponse "Internal server error - database error"
// @Router /chat-threads/{id} [put]
func (h *Handler) handleUpdateChatThread(c echo.Context) error {
	id := c.Param("id")
	var request UpdateChatThreadRequest
	if err := c.Bind(&request); err != nil {
		log.Error().Err(err).Msg("Failed to bind update chat thread request")
		return c.JSON(http.StatusBadRequest, ErrorResponse{
			Message: err.Error(),
		})
	}

	var chatThread db.ChatThread
	result := h.db.First(&chatThread, id)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return c.JSON(http.StatusNotFound, ErrorResponse{
				Message: "Chat thread not found",
			})
		}
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: result.Error.Error(),
		})
	}

	chatThread.Title = request.Title
	chatThread.UpdatedAt = time.Now()

	if err := h.db.Save(&chatThread).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: err.Error(),
		})
	}

	return c.JSON(http.StatusOK, Response[db.ChatThread]{})
}

// @Summary Delete a chat thread
// @Description Delete a chat thread and all associated messages. This action cannot be undone.
// @Tags Chat Threads
// @Produce json
// @Param id path string true "Chat thread ID" example:"123"
// @Success 200 {object} Response[any] "Chat thread deleted successfully"
// @Failure 404 {object} ErrorResponse "Chat thread not found"
// @Failure 500 {object} ErrorResponse "Internal server error - database error"
// @Router /chat-threads/{id} [delete]
func (h *Handler) handleDeleteChatThread(c echo.Context) error {
	id := c.Param("id")
	result := h.db.Delete(&db.ChatThread{}, id)
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: result.Error.Error(),
		})
	}
	if result.RowsAffected == 0 {
		return c.JSON(http.StatusNotFound, ErrorResponse{
			Message: "Chat thread not found",
		})
	}
	return c.JSON(http.StatusOK, Response[any]{})
}

// @Summary Get chat thread messages
// @Description Retrieve all messages in a chat thread, ordered by creation time (oldest first). Only user and assistant messages are returned.
// @Tags Chat Threads
// @Produce json
// @Param id path string true "Chat thread ID" example:"123"
// @Success 200 {object} PaginatedResponse[db.Message] "List of messages in the chat thread"
// @Failure 404 {object} ErrorResponse "Chat thread not found"
// @Failure 500 {object} ErrorResponse "Internal server error - database error"
// @Router /chat-threads/{id}/messages [get]
func (h *Handler) handleGetChatThreadMessages(c echo.Context) error {
	chatThreadID := c.Param("id")
	var messages []db.Message
	result := h.db.
		Where("chat_thread_id = ?", chatThreadID).
		Where("role IN (?, ?)", "user", "assistant").
		Order("sent_at ASC").
		Find(&messages)
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: result.Error.Error(),
		})
	}

	return c.JSON(http.StatusOK, PaginatedResponse[db.Message]{
		Data:        messages,
		HasNext:     len(messages) > 10,
		HasPrevious: false,
	})
}
