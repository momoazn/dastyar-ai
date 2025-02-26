package handlers

import (
	"ai-assistant/db"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

func (h *Handler) handleGetAllThreads(c echo.Context) error {
	start := time.Now()
	log.Info().Msg("Handling get all threads request")

	var threads []db.Thread
	result := h.db.Order("updated_at DESC").Find(&threads)
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

	return c.JSON(http.StatusOK, PaginatedResponse[db.Thread]{
		Data:        threads,
		Message:     "Threads fetched successfully",
		HasNext:     len(threads) > 10,
		HasPrevious: false,
	})
}

type CreateThreadRequest struct {
	Title string `json:"title"`
	Model string `json:"model"`
}

func (h *Handler) handleCreateThread(c echo.Context) error {
	start := time.Now()
	log.Info().Msg("Handling create thread request")

	var request CreateThreadRequest
	if err := c.Bind(&request); err != nil {
		log.Error().Err(err).Msg("Failed to bind request")
		return c.JSON(http.StatusBadRequest, ErrorResponse{
			Message: err.Error(),
		})
	}

	log.Info().
		Str("title", request.Title).
		Str("model", request.Model).
		Msg("Creating new thread")

	thread := db.Thread{
		Title:     request.Title,
		Model:     request.Model,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
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

	return c.JSON(http.StatusCreated, Response[db.Thread]{
		Data:    thread,
		Message: "Thread created successfully",
	})
}

func (h *Handler) handleGetThread(c echo.Context) error {
	start := time.Now()
	id := c.Param("id")
	log.Info().Str("thread_id", id).Msg("Handling get thread request")

	var thread db.Thread
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

	return c.JSON(http.StatusOK, Response[db.Thread]{
		Data:    thread,
		Message: "Thread fetched successfully",
	})
}

func (h *Handler) handleDeleteThread(c echo.Context) error {
	id := c.Param("id")
	result := h.db.Delete(&db.Thread{}, id)
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
	return c.JSON(http.StatusOK, Response[db.Thread]{
		Message: "Thread deleted successfully",
	})
}

func (h *Handler) handleGetThreadMessages(c echo.Context) error {
	ThreadID := c.Param("id")
	var messages []db.ChatMessage
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

	return c.JSON(http.StatusOK, PaginatedResponse[db.ChatMessage]{
		Data:        messages,
		Message:     "Messages fetched successfully",
		HasNext:     len(messages) > 10,
		HasPrevious: false,
	})
}

func (h *Handler) handleGetThreadTranslations(c echo.Context) error {
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
