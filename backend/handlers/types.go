package handlers

import (
	"github.com/ollama/ollama/api"
	"gorm.io/gorm"
)

type Response[T any] struct {
	Data    T      `json:"data"`
	Message string `json:"message"`
}

type PaginatedResponse[T any] struct {
	Data        any    `json:"data"`
	Message     string `json:"message"`
	HasNext     bool   `json:"has_next"`
	HasPrevious bool   `json:"has_previous"`
}

type ErrorResponse struct {
	Message string `json:"message"`
}

type Handler struct {
	db           *gorm.DB
	ollamaClient *api.Client
}

func NewHandler(db *gorm.DB, ollamaClient *api.Client) *Handler {
	return &Handler{
		db:           db,
		ollamaClient: ollamaClient,
	}
}
