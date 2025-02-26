package handlers

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

func (h *Handler) handleHealthCheck(c echo.Context) error {
	err := h.ollamaClient.Heartbeat(c.Request().Context())
	if err != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{
			Message: err.Error(),
		})
	}
	return c.JSON(http.StatusOK, Response[string]{
		Data:    "ok",
		Message: "Server is running",
	})
}
