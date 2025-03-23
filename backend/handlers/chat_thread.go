package handlers

import (
	"ai-assistant/db"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

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

type CreateChatThreadRequest struct {
	Title   string `json:"title"`
	AIModel string `json:"ai_model"`
}

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
		Str("ai_model", request.AIModel).
		Msg("Creating new chat thread")

	chatThread := db.ChatThread{
		Title:     request.Title,
		AIModel:   request.AIModel,
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

type UpdateChatThreadRequest struct {
	Title string `json:"title"`
}

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
	return c.JSON(http.StatusOK, Response[db.ChatThread]{})
}

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
