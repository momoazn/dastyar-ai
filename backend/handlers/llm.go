package handlers

import (
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
)

// LLMListResponse represents a model in the response
// @Description Information about an available LLM model
type LLMListResponse struct {
	Name       string                 `json:"name" example:"llama3.2:latest"`             // Model name and tag
	ModifiedAt time.Time              `json:"modified_at" example:"2023-01-01T00:00:00Z"` // Last modification timestamp
	Size       int64                  `json:"size" example:"4661224676"`                  // Model size in bytes
	Digest     string                 `json:"digest" example:"sha256:abc123..."`          // Model digest/hash
	Details    map[string]interface{} `json:"details"`                                    // Additional model details (format, family, etc.)
}

// @Summary Get available LLM models
// @Description Get list of all available LLM models from Ollama
// @Tags LLM
// @Accept json
// @Produce json
// @Success 200 {object} Response[[]LLMListResponse] "List of models"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /list-llm [get]
func (h *Handler) handleGetLLMList(c echo.Context) error {
	models, err := h.ollamaClient.List(c.Request().Context())
	if err != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: err.Error(),
		})
	}

	// Convert api.LLMListResponse to our LLMListResponse
	var llmListResponses []LLMListResponse
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

		llmListResponses = append(llmListResponses, LLMListResponse{
			Name:       model.Name,
			ModifiedAt: model.ModifiedAt,
			Size:       model.Size,
			Digest:     model.Digest,
			Details:    detailsMap,
		})
	}

	return c.JSON(http.StatusOK, Response[[]LLMListResponse]{
		Data: llmListResponses,
	})
}
