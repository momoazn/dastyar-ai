package handlers

type Response[T any] struct {
	Data T `json:"data"`
}

type PaginatedResponse[T any] struct {
	Data        any  `json:"data"`
	HasNext     bool `json:"has_next"`
	HasPrevious bool `json:"has_previous"`
}

type ErrorResponse struct {
	Message string `json:"message"`
}
