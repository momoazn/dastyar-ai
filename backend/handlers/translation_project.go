package handlers

import (
	"ai-assistant/db"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

func (h *Handler) handleGetAllTranslationProjects(c echo.Context) error {
	start := time.Now()
	log.Info().Msg("Handling get all translation projects request")

	var translationProjects []db.TranslationProject
	result := h.db.Order("updated_at DESC").Find(&translationProjects)
	if result.Error != nil {
		log.Error().Err(result.Error).Msg("Failed to fetch translation projects")
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: result.Error.Error(),
		})
	}

	log.Info().
		Int("translation_project_count", len(translationProjects)).
		Dur("duration_ms", time.Since(start)).
		Msg("Successfully fetched translation projects")

	return c.JSON(http.StatusOK, PaginatedResponse[db.TranslationProject]{
		Data:        translationProjects,
		Message:     "Translation projects fetched successfully",
		HasNext:     len(translationProjects) > 10,
		HasPrevious: false,
	})
}

type CreateTranslationProjectRequest struct {
	Title   string `json:"title"`
	AIModel string `json:"ai_model"`
}

func (h *Handler) handleCreateTranslationProject(c echo.Context) error {
	start := time.Now()
	log.Info().Msg("Handling create translation project request")

	var request CreateTranslationProjectRequest
	if err := c.Bind(&request); err != nil {
		log.Error().Err(err).Msg("Failed to bind request")
		return c.JSON(http.StatusBadRequest, ErrorResponse{
			Message: err.Error(),
		})
	}

	log.Info().
		Str("title", request.Title).
		Str("ai_model", request.AIModel).
		Msg("Creating new translation project")

	translationProject := db.TranslationProject{
		Title:     request.Title,
		AIModel:   request.AIModel,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	result := h.db.Create(&translationProject)
	if result.Error != nil {
		log.Error().Err(result.Error).Msg("Failed to create translation project")
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: result.Error.Error(),
		})
	}

	log.Info().
		Uint("project_id", translationProject.ID).
		Str("title", translationProject.Title).
		Dur("duration_ms", time.Since(start)).
		Msg("Translation project created successfully")

	return c.JSON(http.StatusCreated, Response[db.TranslationProject]{
		Data:    translationProject,
		Message: "Translation project created successfully",
	})
}

func (h *Handler) handleGetTranslationProject(c echo.Context) error {
	start := time.Now()
	id := c.Param("id")
	log.Info().Str("project_id", id).Msg("Handling get translation project request")

	var translationProject db.TranslationProject
	result := h.db.Preload("Translations").First(&translationProject, id)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			log.Info().Str("project_id", id).Msg("Translation project not found")
			return c.JSON(http.StatusNotFound, ErrorResponse{
				Message: "Translation project not found",
			})
		}
		log.Error().Err(result.Error).Str("project_id", id).Msg("Failed to fetch translation project")
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: result.Error.Error(),
		})
	}

	log.Info().
		Str("project_id", id).
		Str("title", translationProject.Title).
		Int("translation_count", len(translationProject.Translations)).
		Dur("duration_ms", time.Since(start)).
		Msg("Translation project fetched successfully")

	return c.JSON(http.StatusOK, Response[db.TranslationProject]{
		Data:    translationProject,
		Message: "Translation project fetched successfully",
	})
}

type UpdateTranslationProjectRequest struct {
	Title string `json:"title"`
}

func (h *Handler) handleUpdateTranslationProject(c echo.Context) error {
	id := c.Param("id")
	var request UpdateTranslationProjectRequest
	if err := c.Bind(&request); err != nil {
		log.Error().Err(err).Msg("Failed to bind update translation project request")
		return c.JSON(http.StatusBadRequest, ErrorResponse{
			Message: err.Error(),
		})
	}

	var translationProject db.TranslationProject
	result := h.db.First(&translationProject, id)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return c.JSON(http.StatusNotFound, ErrorResponse{
				Message: "Translation project not found",
			})
		}
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: result.Error.Error(),
		})
	}

	translationProject.Title = request.Title
	translationProject.UpdatedAt = time.Now()

	if err := h.db.Save(&translationProject).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: err.Error(),
		})
	}

	return c.JSON(http.StatusOK, Response[db.TranslationProject]{
		Data:    translationProject,
		Message: "Translation project updated successfully",
	})
}

func (h *Handler) handleDeleteTranslationProject(c echo.Context) error {
	id := c.Param("id")
	result := h.db.Delete(&db.TranslationProject{}, id)
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: result.Error.Error(),
		})
	}
	if result.RowsAffected == 0 {
		return c.JSON(http.StatusNotFound, ErrorResponse{
			Message: "Translation project not found",
		})
	}
	return c.JSON(http.StatusOK, Response[db.TranslationProject]{
		Message: "Translation project deleted successfully",
	})
}

func (h *Handler) handleGetTranslationProjectTranslations(c echo.Context) error {
	projectID := c.Param("id")
	var translations []db.Translation
	result := h.db.
		Where("project_id = ?", projectID).
		Order("created_at ASC").
		Find(&translations)
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: result.Error.Error(),
		})
	}

	return c.JSON(http.StatusOK, PaginatedResponse[db.Translation]{
		Data:        translations,
		Message:     "Translations fetched successfully",
		HasNext:     len(translations) > 10,
		HasPrevious: false,
	})
}
