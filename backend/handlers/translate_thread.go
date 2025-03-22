package handlers

import (
	"ai-assistant/db"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

func (h *Handler) handleGetAllTranslateThreads(c echo.Context) error {
	start := time.Now()
	log.Info().Msg("Handling get all translate threads request")

	var translateThreads []db.TranslateThread
	result := h.db.Order("updated_at DESC").Find(&translateThreads)
	if result.Error != nil {
		log.Error().Err(result.Error).Msg("Failed to fetch translate threads")
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: result.Error.Error(),
		})
	}

	log.Info().
		Int("translate_thread_count", len(translateThreads)).
		Dur("duration_ms", time.Since(start)).
		Msg("Successfully fetched translate threads")

	return c.JSON(http.StatusOK, PaginatedResponse[db.TranslateThread]{
		Data:        translateThreads,
		Message:     "Translate threads fetched successfully",
		HasNext:     len(translateThreads) > 10,
		HasPrevious: false,
	})
}

type CreateTranslateThreadRequest struct {
	Title string `json:"title"`
	Model string `json:"model"`
}

func (h *Handler) handleCreateTranslateThread(c echo.Context) error {
	start := time.Now()
	log.Info().Msg("Handling create translate thread request")

	var request CreateTranslateThreadRequest
	if err := c.Bind(&request); err != nil {
		log.Error().Err(err).Msg("Failed to bind request")
		return c.JSON(http.StatusBadRequest, ErrorResponse{
			Message: err.Error(),
		})
	}

	log.Info().
		Str("title", request.Title).
		Str("model", request.Model).
		Msg("Creating new translate thread")

	translateThread := db.TranslateThread{
		Title:     request.Title,
		Model:     request.Model,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	result := h.db.Create(&translateThread)
	if result.Error != nil {
		log.Error().Err(result.Error).Msg("Failed to create translate thread")
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: result.Error.Error(),
		})
	}

	log.Info().
		Uint("thread_id", translateThread.ID).
		Str("title", translateThread.Title).
		Dur("duration_ms", time.Since(start)).
		Msg("Translate thread created successfully")

	return c.JSON(http.StatusCreated, Response[db.TranslateThread]{
		Data:    translateThread,
		Message: "Translate thread created successfully",
	})
}

func (h *Handler) handleGetTranslateThread(c echo.Context) error {
	start := time.Now()
	id := c.Param("id")
	log.Info().Str("thread_id", id).Msg("Handling get translate thread request")

	var translateThread db.TranslateThread
	result := h.db.Preload("Messages").First(&translateThread, id)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			log.Info().Str("thread_id", id).Msg("Translate thread not found")
			return c.JSON(http.StatusNotFound, ErrorResponse{
				Message: "Translate thread not found",
			})
		}
		log.Error().Err(result.Error).Str("thread_id", id).Msg("Failed to fetch translate thread")
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: result.Error.Error(),
		})
	}

	log.Info().
		Str("thread_id", id).
		Str("title", translateThread.Title).
		Int("message_count", len(translateThread.Messages)).
		Dur("duration_ms", time.Since(start)).
		Msg("Translate thread fetched successfully")

	return c.JSON(http.StatusOK, Response[db.TranslateThread]{
		Data:    translateThread,
		Message: "Translate thread fetched successfully",
	})
}

type UpdateTranslateThreadRequest struct {
	Title string `json:"title"`
}

func (h *Handler) handleUpdateTranslateThread(c echo.Context) error {
	id := c.Param("id")
	var request UpdateTranslateThreadRequest
	if err := c.Bind(&request); err != nil {
		log.Error().Err(err).Msg("Failed to bind update translate thread request")
		return c.JSON(http.StatusBadRequest, ErrorResponse{
			Message: err.Error(),
		})
	}

	var translateThread db.TranslateThread
	result := h.db.First(&translateThread, id)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return c.JSON(http.StatusNotFound, ErrorResponse{
				Message: "Translate thread not found",
			})
		}
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: result.Error.Error(),
		})
	}

	translateThread.Title = request.Title
	translateThread.UpdatedAt = time.Now()

	if err := h.db.Save(&translateThread).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: err.Error(),
		})
	}

	return c.JSON(http.StatusOK, Response[db.TranslateThread]{
		Data:    translateThread,
		Message: "Translate thread updated successfully",
	})
}

func (h *Handler) handleDeleteTranslateThread(c echo.Context) error {
	id := c.Param("id")
	result := h.db.Delete(&db.TranslateThread{}, id)
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: result.Error.Error(),
		})
	}
	if result.RowsAffected == 0 {
		return c.JSON(http.StatusNotFound, ErrorResponse{
			Message: "Translate thread not found",
		})
	}
	return c.JSON(http.StatusOK, Response[db.TranslateThread]{
		Message: "Translate thread deleted successfully",
	})
}

func (h *Handler) handleGetTranslateThreadMessages(c echo.Context) error {
	ThreadID := c.Param("id")
	var messages []db.TranslateMessage
	result := h.db.
		Where("thread_id = ?", ThreadID).
		Where("role IN (?, ?)", "user", "assistant").
		Order("timestamp ASC").
		Find(&messages)
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: result.Error.Error(),
		})
	}

	return c.JSON(http.StatusOK, PaginatedResponse[db.TranslateMessage]{
		Data:        messages,
		Message:     "Messages fetched successfully",
		HasNext:     len(messages) > 10,
		HasPrevious: false,
	})
}

func (h *Handler) handleGetTranslateThreadTranslations(c echo.Context) error {
	ThreadID := c.Param("id")
	var translations []db.TranslateMessage
	result := h.db.Where("thread_id = ?", ThreadID).Find(&translations)
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: result.Error.Error(),
		})
	}

	return c.JSON(http.StatusOK, PaginatedResponse[db.TranslateMessage]{
		Data:        translations,
		Message:     "Translations fetched successfully",
		HasNext:     len(translations) > 10,
		HasPrevious: false,
	})
}
