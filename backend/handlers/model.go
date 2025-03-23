package handlers

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/ollama/ollama/api"
)

func (h *Handler) handleGetModels(c echo.Context) error {
	models, err := h.ollamaClient.List(c.Request().Context())
	if err != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: err.Error(),
		})
	}
	return c.JSON(http.StatusOK, Response[[]api.ListModelResponse]{
		Data: models.Models,
	})
}
