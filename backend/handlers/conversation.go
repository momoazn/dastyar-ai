package handlers

import (
	"ai-assistant/db"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

func (h *Handler) handleGetAllConversations(c echo.Context) error {
	start := time.Now()
	log.Info().Msg("Handling get all conversations request")

	var conversations []db.Conversation
	result := h.db.Order("updated_at DESC").Find(&conversations)
	if result.Error != nil {
		log.Error().Err(result.Error).Msg("Failed to fetch conversations")
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: result.Error.Error(),
		})
	}

	log.Info().
		Int("conversation_count", len(conversations)).
		Dur("duration_ms", time.Since(start)).
		Msg("Successfully fetched conversations")

	return c.JSON(http.StatusOK, PaginatedResponse[db.Conversation]{
		Data:        conversations,
		Message:     "Conversations fetched successfully",
		HasNext:     len(conversations) > 10,
		HasPrevious: false,
	})
}

type CreateConversationRequest struct {
	Title   string `json:"title"`
	AIModel string `json:"ai_model"`
}

func (h *Handler) handleCreateConversation(c echo.Context) error {
	start := time.Now()
	log.Info().Msg("Handling create conversation request")

	var request CreateConversationRequest
	if err := c.Bind(&request); err != nil {
		log.Error().Err(err).Msg("Failed to bind request")
		return c.JSON(http.StatusBadRequest, ErrorResponse{
			Message: err.Error(),
		})
	}

	log.Info().
		Str("title", request.Title).
		Str("ai_model", request.AIModel).
		Msg("Creating new conversation")

	conversation := db.Conversation{
		Title:     request.Title,
		AIModel:   request.AIModel,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	result := h.db.Create(&conversation)
	if result.Error != nil {
		log.Error().Err(result.Error).Msg("Failed to create conversation")
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: result.Error.Error(),
		})
	}

	log.Info().
		Uint("conversation_id", conversation.ID).
		Str("title", conversation.Title).
		Dur("duration_ms", time.Since(start)).
		Msg("Conversation created successfully")

	return c.JSON(http.StatusCreated, Response[db.Conversation]{
		Data:    conversation,
		Message: "Conversation created successfully",
	})
}

func (h *Handler) handleGetConversation(c echo.Context) error {
	start := time.Now()
	id := c.Param("id")
	log.Info().Str("conversation_id", id).Msg("Handling get conversation request")

	var conversation db.Conversation
	result := h.db.Preload("Messages").First(&conversation, id)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			log.Info().Str("conversation_id", id).Msg("Conversation not found")
			return c.JSON(http.StatusNotFound, ErrorResponse{
				Message: "Conversation not found",
			})
		}
		log.Error().Err(result.Error).Str("conversation_id", id).Msg("Failed to fetch conversation")
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: result.Error.Error(),
		})
	}

	log.Info().
		Str("conversation_id", id).
		Str("title", conversation.Title).
		Int("message_count", len(conversation.Messages)).
		Dur("duration_ms", time.Since(start)).
		Msg("Conversation fetched successfully")

	return c.JSON(http.StatusOK, Response[db.Conversation]{
		Data:    conversation,
		Message: "Conversation fetched successfully",
	})
}

type UpdateConversationRequest struct {
	Title string `json:"title"`
}

func (h *Handler) handleUpdateConversation(c echo.Context) error {
	id := c.Param("id")
	var request UpdateConversationRequest
	if err := c.Bind(&request); err != nil {
		log.Error().Err(err).Msg("Failed to bind update conversation request")
		return c.JSON(http.StatusBadRequest, ErrorResponse{
			Message: err.Error(),
		})
	}

	var conversation db.Conversation
	result := h.db.First(&conversation, id)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return c.JSON(http.StatusNotFound, ErrorResponse{
				Message: "Conversation not found",
			})
		}
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: result.Error.Error(),
		})
	}

	conversation.Title = request.Title
	conversation.UpdatedAt = time.Now()

	if err := h.db.Save(&conversation).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: err.Error(),
		})
	}

	return c.JSON(http.StatusOK, Response[db.Conversation]{
		Data:    conversation,
		Message: "Conversation updated successfully",
	})
}

func (h *Handler) handleDeleteConversation(c echo.Context) error {
	id := c.Param("id")
	result := h.db.Delete(&db.Conversation{}, id)
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: result.Error.Error(),
		})
	}
	if result.RowsAffected == 0 {
		return c.JSON(http.StatusNotFound, ErrorResponse{
			Message: "Conversation not found",
		})
	}
	return c.JSON(http.StatusOK, Response[db.Conversation]{
		Message: "Conversation deleted successfully",
	})
}

func (h *Handler) handleGetConversationMessages(c echo.Context) error {
	conversationID := c.Param("id")
	var messages []db.Message
	result := h.db.
		Where("conversation_id = ?", conversationID).
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
		Message:     "Messages fetched successfully",
		HasNext:     len(messages) > 10,
		HasPrevious: false,
	})
}
