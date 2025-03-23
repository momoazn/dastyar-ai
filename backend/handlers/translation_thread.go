package handlers

import (
	"ai-assistant/db"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

// @Summary Get all translation threads
// @Description Get all translation threads
// @Tags Translation Threads
// @Produce json
// @Success 200 {object} PaginatedResponse[db.TranslationThread]
// @Failure 500 {object} ErrorResponse
// @Router /translation-threads [get]
func (h *Handler) handleGetAllTranslationThreads(c echo.Context) error {
	start := time.Now()
	log.Info().Msg("Handling get all translation threads request")

	var translationThreads []db.TranslationThread
	result := h.db.Order("updated_at DESC").Find(&translationThreads)
	if result.Error != nil {
		log.Error().Err(result.Error).Msg("Failed to fetch translation threads")
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: result.Error.Error(),
		})
	}

	log.Info().
		Int("translation_thread_count", len(translationThreads)).
		Dur("duration_ms", time.Since(start)).
		Msg("Successfully fetched translation threads")

	return c.JSON(http.StatusOK, PaginatedResponse[db.TranslationThread]{
		Data:        translationThreads,
		HasNext:     len(translationThreads) > 10,
		HasPrevious: false,
	})
}

type CreateTranslationThreadRequest struct {
	Title   string `json:"title"`
	AIModel string `json:"ai_model"`
}

// @Summary Create a new translation thread
// @Description Create a new translation thread
// @Tags Translation Threads
// @Accept json
// @Produce json
// @Param translation_thread body CreateTranslationThreadRequest true "Translation thread details"
// @Success 201 {object} Response[db.TranslationThread]
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /translation-threads [post]
func (h *Handler) handleCreateTranslationThread(c echo.Context) error {
	start := time.Now()
	log.Info().Msg("Handling create translation thread request")

	var request CreateTranslationThreadRequest
	if err := c.Bind(&request); err != nil {
		log.Error().Err(err).Msg("Failed to bind request")
		return c.JSON(http.StatusBadRequest, ErrorResponse{
			Message: err.Error(),
		})
	}

	log.Info().
		Str("title", request.Title).
		Str("ai_model", request.AIModel).
		Msg("Creating new translation thread")

	translationThread := db.TranslationThread{
		Title:     request.Title,
		AIModel:   request.AIModel,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	result := h.db.Create(&translationThread)
	if result.Error != nil {
		log.Error().Err(result.Error).Msg("Failed to create translation thread")
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: result.Error.Error(),
		})
	}

	log.Info().
		Uint("translation_thread_id", translationThread.ID).
		Str("title", translationThread.Title).
		Dur("duration_ms", time.Since(start)).
		Msg("Translation thread created successfully")

	return c.JSON(http.StatusCreated, Response[db.TranslationThread]{
		Data: translationThread,
	})
}

// @Summary Get a translation thread by ID
// @Description Get a translation thread by ID with its translations
// @Tags Translation Threads
// @Produce json
// @Param id path string true "Translation thread ID"
// @Success 200 {object} Response[db.TranslationThread]
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /translation-threads/{id} [get]
func (h *Handler) handleGetTranslationThread(c echo.Context) error {
	start := time.Now()
	id := c.Param("id")
	log.Info().Str("translation_thread_id", id).Msg("Handling get translation thread request")

	var translationThread db.TranslationThread
	result := h.db.Preload("Translations").First(&translationThread, id)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			log.Info().Str("translation_thread_id", id).Msg("Translation thread not found")
			return c.JSON(http.StatusNotFound, ErrorResponse{
				Message: "Translation thread not found",
			})
		}
		log.Error().Err(result.Error).Str("translation_thread_id", id).Msg("Failed to fetch translation thread")
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: result.Error.Error(),
		})
	}

	log.Info().
		Str("translation_thread_id", id).
		Str("title", translationThread.Title).
		Int("translation_count", len(translationThread.Translations)).
		Dur("duration_ms", time.Since(start)).
		Msg("Translation thread fetched successfully")

	return c.JSON(http.StatusOK, Response[db.TranslationThread]{
		Data: translationThread,
	})
}

type UpdateTranslationThreadRequest struct {
	Title string `json:"title"`
}

// @Summary Update a translation thread
// @Description Update a translation thread's title
// @Tags Translation Threads
// @Accept json
// @Produce json
// @Param id path string true "Translation thread ID"
// @Param thread body UpdateTranslationThreadRequest true "Translation thread details"
// @Success 200 {object} Response[db.TranslationThread]
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /translation-threads/{id} [put]
func (h *Handler) handleUpdateTranslationThread(c echo.Context) error {
	id := c.Param("id")
	var request UpdateTranslationThreadRequest
	if err := c.Bind(&request); err != nil {
		log.Error().Err(err).Msg("Failed to bind update translation thread request")
		return c.JSON(http.StatusBadRequest, ErrorResponse{
			Message: err.Error(),
		})
	}

	var translationThread db.TranslationThread
	result := h.db.First(&translationThread, id)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return c.JSON(http.StatusNotFound, ErrorResponse{
				Message: "Translation thread not found",
			})
		}
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: result.Error.Error(),
		})
	}

	translationThread.Title = request.Title
	translationThread.UpdatedAt = time.Now()

	if err := h.db.Save(&translationThread).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: err.Error(),
		})
	}

	return c.JSON(http.StatusOK, Response[db.TranslationThread]{
		Data: translationThread,
	})
}

// @Summary Delete a translation thread
// @Description Delete a translation thread by ID
// @Tags Translation Threads
// @Produce json
// @Param id path string true "Translation thread ID"
// @Success 200 {object} Response[any]
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /translation-threads/{id} [delete]
func (h *Handler) handleDeleteTranslationThread(c echo.Context) error {
	id := c.Param("id")
	result := h.db.Delete(&db.TranslationThread{}, id)
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: result.Error.Error(),
		})
	}
	if result.RowsAffected == 0 {
		return c.JSON(http.StatusNotFound, ErrorResponse{
			Message: "Translation thread not found",
		})
	}
	return c.JSON(http.StatusOK, Response[any]{})
}

// @Summary Get translations from a thread
// @Description Get all translations from a translation thread
// @Tags Translation Threads
// @Produce json
// @Param id path string true "Translation thread ID"
// @Success 200 {object} PaginatedResponse[db.Translation]
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /translation-threads/{id}/translations [get]
func (h *Handler) handleGetTranslationThreadTranslations(c echo.Context) error {
	threadID := c.Param("id")
	var translations []db.Translation
	result := h.db.
		Where("translation_thread_id = ?", threadID).
		Order("created_at ASC").
		Find(&translations)
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: result.Error.Error(),
		})
	}

	return c.JSON(http.StatusOK, PaginatedResponse[db.Translation]{
		Data:        translations,
		HasNext:     len(translations) > 10,
		HasPrevious: false,
	})
}
