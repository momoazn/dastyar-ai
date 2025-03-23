package handlers

import (
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
)

// ModelResponse represents a model in the response
type ModelResponse struct {
	Name       string    `json:"name"`
	ModifiedAt time.Time `json:"modified_at"`
	Size       int64     `json:"size"`
	Digest     string    `json:"digest"`
	// Using map for swagger compatibility
	Details map[string]interface{} `json:"details"`
}

// @Summary Get available LLM models
// @Description Get list of all available LLM models from Ollama
// @Tags LLM
// @Accept json
// @Produce json
// @Success 200 {object} Response[[]ModelResponse] "List of models"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /models [get]
func (h *Handler) handleGetModels(c echo.Context) error {
	models, err := h.ollamaClient.List(c.Request().Context())
	if err != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: err.Error(),
		})
	}

	// Convert api.ListModelResponse to our ModelResponse
	var modelResponses []ModelResponse
	for _, model := range models.Models {
		// Convert model details to map
		detailsMap := make(map[string]interface{})
		if model.Details.ParentModel != "" {
			detailsMap["parent_model"] = model.Details.ParentModel
		}
		if model.Details.Format != "" {
			detailsMap["format"] = model.Details.Format
		}
		if model.Details.Family != "" {
			detailsMap["family"] = model.Details.Family
		}
		if len(model.Details.Families) > 0 {
			detailsMap["families"] = model.Details.Families
		}
		if model.Details.ParameterSize != "" {
			detailsMap["parameter_size"] = model.Details.ParameterSize
		}
		if model.Details.QuantizationLevel != "" {
			detailsMap["quantization_level"] = model.Details.QuantizationLevel
		}

		modelResponses = append(modelResponses, ModelResponse{
			Name:       model.Name,
			ModifiedAt: model.ModifiedAt,
			Size:       model.Size,
			Digest:     model.Digest,
			Details:    detailsMap,
		})
	}

	return c.JSON(http.StatusOK, Response[[]ModelResponse]{
		Data: modelResponses,
	})
}
