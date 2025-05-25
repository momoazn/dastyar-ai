package handlers

// Response represents a standard API response wrapper
// @Description Standard response wrapper for single data items
type Response[T any] struct {
	Data T `json:"data"` // The response data
}

// PaginatedResponse represents a paginated API response
// @Description Standard response wrapper for paginated data
type PaginatedResponse[T any] struct {
	Data        []T  `json:"data"`         // Array of data items
	HasNext     bool `json:"has_next"`     // Whether there are more items available
	HasPrevious bool `json:"has_previous"` // Whether there are previous items available
	Total       int  `json:"total"`        // Total number of items
	CurrentPage int  `json:"current_page"` // Current page number
	TotalPages  int  `json:"total_pages"`  // Total number of pages
}

// ErrorResponse represents an error response
// @Description Standard error response format
type ErrorResponse struct {
	Message string `json:"message" example:"Error message"` // Error message description
}
