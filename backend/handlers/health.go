package handlers

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

// @Summary Health check endpoint
// @Description Check if the application and Ollama service are running
// @Tags Health
// @Accept json
// @Produce json
// @Success 200 {object} Response[string] "OK"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /health [get]
func (h *Handler) handleHealthCheck(c echo.Context) error {
	err := h.ollamaClient.Heartbeat(c.Request().Context())
	if err != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: err.Error(),
		})
	}
	return c.JSON(http.StatusOK, Response[string]{
		Data: "ok",
	})
}
