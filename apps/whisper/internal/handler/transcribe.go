package handler

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"

	"whisper/internal/service"
)

type TranscribeHandler struct {
	whisperService *service.WhisperService
	tempDir        string
}

type ErrorResponse struct {
	Error string `json:"error"`
}

// PythonCompatResponse matches the Python API response format
type PythonCompatResponse struct {
	Text string `json:"text"`
}

func NewTranscribeHandler(whisperService *service.WhisperService) *TranscribeHandler {
	// Create temp directory for uploaded files
	tempDir := "./temp"
	os.MkdirAll(tempDir, 0755)

	return &TranscribeHandler{
		whisperService: whisperService,
		tempDir:        tempDir,
	}
}

// HandleTranscribe handles POST requests to transcribe audio files
func (h *TranscribeHandler) HandleTranscribe(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		h.sendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse multipart form (max 100MB)
	err := r.ParseMultipartForm(100 << 20)
	if err != nil {
		h.sendError(w, fmt.Sprintf("Failed to parse form: %v", err), http.StatusBadRequest)
		return
	}

	// Get the audio file from form
	file, header, err := r.FormFile("audio")
	if err != nil {
		h.sendError(w, "No audio file provided. Use 'audio' field", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Get optional model parameter
	modelName := r.FormValue("model")

	// Create temporary file
	tempFile := filepath.Join(h.tempDir, header.Filename)
	dst, err := os.Create(tempFile)
	if err != nil {
		h.sendError(w, fmt.Sprintf("Failed to create temp file: %v", err), http.StatusInternalServerError)
		return
	}
	defer dst.Close()
	defer os.Remove(tempFile) // Clean up after processing

	// Copy uploaded file to temp location
	_, err = io.Copy(dst, file)
	if err != nil {
		h.sendError(w, fmt.Sprintf("Failed to save file: %v", err), http.StatusInternalServerError)
		return
	}

	// Close the file before processing
	dst.Close()

	// Transcribe the audio with specified model (or default if empty)
	result, err := h.whisperService.Transcribe(r.Context(), tempFile, modelName)
	if err != nil {
		h.sendError(w, fmt.Sprintf("Transcription failed: %v", err), http.StatusInternalServerError)
		return
	}

	// Send response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(result)
}

// HandleModels handles GET requests to list available models
func (h *TranscribeHandler) HandleModels(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		h.sendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	models, err := h.whisperService.ListModels()
	if err != nil {
		h.sendError(w, fmt.Sprintf("Failed to list models: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(models)
}

// HandleHealth handles health check requests
func (h *TranscribeHandler) HandleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"status": "healthy",
	})
}

// HandleTranscribeCompat handles POST requests to /transcribe (Python API compatibility)
// Accepts: multipart/form-data with 'file' field, 'model', 'language', 'initial_prompt'
// Returns: {"text": "..."} to match Python API
func (h *TranscribeHandler) HandleTranscribeCompat(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		h.sendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse multipart form (max 100MB to match Python's 50MB + buffer)
	err := r.ParseMultipartForm(100 << 20)
	if err != nil {
		h.sendError(w, fmt.Sprintf("Failed to parse form: %v", err), http.StatusBadRequest)
		return
	}

	// Try 'file' field first (Python API), then 'audio' field (Go API)
	file, header, err := r.FormFile("file")
	if err != nil {
		file, header, err = r.FormFile("audio")
		if err != nil {
			h.sendError(w, "No audio file provided. Use 'file' or 'audio' field", http.StatusBadRequest)
			return
		}
	}
	defer file.Close()

	// Get optional parameters
	modelName := r.FormValue("model")
	// Note: language and initial_prompt are accepted for API compatibility
	// but whisper.cpp handles language detection automatically
	// and doesn't support initial_prompt like openai-whisper does

	// Create temporary file
	tempFile := filepath.Join(h.tempDir, header.Filename)
	dst, err := os.Create(tempFile)
	if err != nil {
		h.sendError(w, fmt.Sprintf("Failed to create temp file: %v", err), http.StatusInternalServerError)
		return
	}
	defer dst.Close()
	defer os.Remove(tempFile) // Clean up after processing

	// Copy uploaded file to temp location
	_, err = io.Copy(dst, file)
	if err != nil {
		h.sendError(w, fmt.Sprintf("Failed to save file: %v", err), http.StatusInternalServerError)
		return
	}

	// Close the file before processing
	dst.Close()

	// Transcribe the audio with specified model (or default if empty)
	result, err := h.whisperService.Transcribe(r.Context(), tempFile, modelName)
	if err != nil {
		h.sendError(w, fmt.Sprintf("Transcription failed: %v", err), http.StatusInternalServerError)
		return
	}

	// Return Python-compatible response format (just text field)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(PythonCompatResponse{Text: result.Text})
}

// HandleModelsCompat handles GET requests to /models (Python API compatibility)
// Returns: [{"id": "model-name", "name": "Display Name"}]
func (h *TranscribeHandler) HandleModelsCompat(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		h.sendError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	models, err := h.whisperService.ListModels()
	if err != nil {
		h.sendError(w, fmt.Sprintf("Failed to list models: %v", err), http.StatusInternalServerError)
		return
	}

	// Return models in Python-compatible format (already matches)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(models)
}

// HandleHealthCompat handles GET requests to /health with Python-compatible response
func (h *TranscribeHandler) HandleHealthCompat(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	// Python returns {"status": "ok"}
	json.NewEncoder(w).Encode(map[string]string{
		"status": "ok",
	})
}

func (h *TranscribeHandler) sendError(w http.ResponseWriter, message string, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(ErrorResponse{Error: message})
}
