package handlers

type Response[T any] struct {
	Data T `json:"data"`
}

type PaginatedResponse[T any] struct {
	Data        []T  `json:"data"`
	HasNext     bool `json:"has_next"`
	HasPrevious bool `json:"has_previous"`
	Total       int  `json:"total"`
	CurrentPage int  `json:"current_page"`
	TotalPages  int  `json:"total_pages"`
}

type ErrorResponse struct {
	Message string `json:"message"`
}
