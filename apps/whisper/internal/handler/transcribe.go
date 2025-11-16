package handler

import (
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"whisper/internal/service"
)

type TranscribeHandler struct {
	whisperService *service.WhisperService
	tempDir        string
}

type openAIModel struct {
	ID      string `json:"id"`
	Object  string `json:"object"`
	OwnedBy string `json:"owned_by"`
}

type openAIModelList struct {
	Object string        `json:"object"`
	Data   []openAIModel `json:"data"`
}

type openAIErrorDetail struct {
	Message string `json:"message"`
	Type    string `json:"type,omitempty"`
	Param   string `json:"param,omitempty"`
	Code    string `json:"code,omitempty"`
}

type openAIErrorResponse struct {
	Error openAIErrorDetail `json:"error"`
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

func (h *TranscribeHandler) persistUpload(file multipart.File, header *multipart.FileHeader) (string, error) {
	tempFile := filepath.Join(h.tempDir, header.Filename)
	dst, err := os.Create(tempFile)
	if err != nil {
		return "", err
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		return "", err
	}

	return tempFile, nil
}

// HandleOpenAITranscriptions mirrors OpenAI's /v1/audio/transcriptions endpoint
func (h *TranscribeHandler) HandleOpenAITranscriptions(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		h.sendOpenAIError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if err := r.ParseMultipartForm(100 << 20); err != nil {
		h.sendOpenAIError(w, fmt.Sprintf("Failed to parse form: %v", err), http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		h.sendOpenAIError(w, "No audio file provided. Use 'file' field", http.StatusBadRequest)
		return
	}
	defer file.Close()

	tempFile, err := h.persistUpload(file, header)
	if err != nil {
		h.sendOpenAIError(w, fmt.Sprintf("Failed to save file: %v", err), http.StatusInternalServerError)
		return
	}
	defer os.Remove(tempFile)

	opts := service.TranscriptionOptions{
		Model:         strings.TrimSpace(r.FormValue("model")),
		Language:      strings.TrimSpace(r.FormValue("language")),
		InitialPrompt: r.FormValue("prompt"),
	}

	task := strings.ToLower(strings.TrimSpace(r.FormValue("task")))
	if task == "translate" {
		opts.Translate = true
	}

	if translate := strings.ToLower(strings.TrimSpace(r.FormValue("translate"))); translate == "true" {
		opts.Translate = true
	}

	if tempRaw := strings.TrimSpace(r.FormValue("temperature")); tempRaw != "" {
		tempVal, tempErr := strconv.ParseFloat(tempRaw, 32)
		if tempErr != nil {
			h.sendOpenAIError(w, "temperature must be a number", http.StatusBadRequest)
			return
		}
		opts.Temperature = float32(tempVal)
	}

	format := strings.ToLower(strings.TrimSpace(r.FormValue("response_format")))
	if format == "" {
		format = "json"
	}

	result, err := h.whisperService.Transcribe(r.Context(), tempFile, opts)
	if err != nil {
		h.sendOpenAIError(w, fmt.Sprintf("Transcription failed: %v", err), http.StatusInternalServerError)
		return
	}

	switch format {
	case "json":
		// OpenAI json format: only return text field
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{
			"text": result.Text,
		})
	case "verbose_json":
		// OpenAI verbose_json format: return full object with all fields
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		// Build OpenAI-compatible response structure
		response := map[string]interface{}{
			"text": result.Text,
		}
		if result.Language != "" {
			response["language"] = result.Language
		}
		if result.Duration > 0 {
			response["duration"] = result.Duration
		}
		if result.Task != "" {
			response["task"] = result.Task
		}
		if len(result.Segments) > 0 {
			response["segments"] = result.Segments
		}
		json.NewEncoder(w).Encode(response)
	case "text":
		w.Header().Set("Content-Type", "text/plain")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(result.Text))
	case "srt":
		w.Header().Set("Content-Type", "text/plain")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(formatSRT(result.Segments)))
	case "vtt":
		w.Header().Set("Content-Type", "text/plain")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(formatVTT(result.Segments)))
	default:
		h.sendOpenAIError(w, fmt.Sprintf("Unsupported response_format %q", format), http.StatusBadRequest)
	}
}

func (h *TranscribeHandler) HandleOpenAIModels(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		h.sendOpenAIError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	models, err := h.whisperService.ListModels()
	if err != nil {
		h.sendOpenAIError(w, fmt.Sprintf("Failed to list models: %v", err), http.StatusInternalServerError)
		return
	}

	openAIModels := make([]openAIModel, len(models))
	for i, model := range models {
		openAIModels[i] = openAIModel{
			ID:      model.ID,
			Object:  "model",
			OwnedBy: "local",
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(openAIModelList{
		Object: "list",
		Data:   openAIModels,
	})
}

func (h *TranscribeHandler) sendOpenAIError(w http.ResponseWriter, message string, statusCode int) {
	errType := "invalid_request_error"
	if statusCode >= http.StatusInternalServerError {
		errType = "server_error"
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(openAIErrorResponse{
		Error: openAIErrorDetail{
			Message: message,
			Type:    errType,
		},
	})
}

func formatSRT(segments []service.TranscriptionSegment) string {
	var builder strings.Builder
	index := 1

	for _, segment := range segments {
		text := strings.TrimSpace(segment.Text)
		if text == "" {
			continue
		}

		builder.WriteString(strconv.Itoa(index))
		builder.WriteString("\n")
		builder.WriteString(formatSRTTimestamp(segment.Start))
		builder.WriteString(" --> ")
		builder.WriteString(formatSRTTimestamp(segment.End))
		builder.WriteString("\n")
		builder.WriteString(text)
		builder.WriteString("\n\n")
		index++
	}

	return strings.TrimSpace(builder.String())
}

func formatVTT(segments []service.TranscriptionSegment) string {
	var builder strings.Builder
	builder.WriteString("WEBVTT\n\n")
	segmentAdded := false

	for _, segment := range segments {
		text := strings.TrimSpace(segment.Text)
		if text == "" {
			continue
		}

		segmentAdded = true
		builder.WriteString(formatVTTTimestamp(segment.Start))
		builder.WriteString(" --> ")
		builder.WriteString(formatVTTTimestamp(segment.End))
		builder.WriteString("\n")
		builder.WriteString(text)
		builder.WriteString("\n\n")
	}

	if !segmentAdded {
		return "WEBVTT"
	}

	return strings.TrimSpace(builder.String())
}

func formatSRTTimestamp(seconds float64) string {
	d := time.Duration(seconds * float64(time.Second))
	hours := int(d / time.Hour)
	d -= time.Duration(hours) * time.Hour
	minutes := int(d / time.Minute)
	d -= time.Duration(minutes) * time.Minute
	secondsPart := int(d / time.Second)
	d -= time.Duration(secondsPart) * time.Second
	milliseconds := int(d / time.Millisecond)
	return fmt.Sprintf("%02d:%02d:%02d,%03d", hours, minutes, secondsPart, milliseconds)
}

func formatVTTTimestamp(seconds float64) string {
	d := time.Duration(seconds * float64(time.Second))
	hours := int(d / time.Hour)
	d -= time.Duration(hours) * time.Hour
	minutes := int(d / time.Minute)
	d -= time.Duration(minutes) * time.Minute
	secondsPart := int(d / time.Second)
	d -= time.Duration(secondsPart) * time.Second
	milliseconds := int(d / time.Millisecond)
	return fmt.Sprintf("%02d:%02d:%02d.%03d", hours, minutes, secondsPart, milliseconds)
}
