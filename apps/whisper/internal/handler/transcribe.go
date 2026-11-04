package handler

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"whisper/internal/audio"
	"whisper/internal/stt"
)

// MaxUploadBytes is the largest request body the handler accepts.
const MaxUploadBytes = 200 << 20

// multipartMemory is how much of a form stays in memory. Larger files go to disk.
const multipartMemory = 8 << 20

var validFormats = map[string]bool{"json": true, "verbose_json": true, "text": true, "srt": true, "vtt": true}

// Transcriber is the part of the whisper service the handler needs.
type Transcriber interface {
	Transcribe(ctx context.Context, audioPath string, opts stt.Options) (*stt.Result, error)
	ListModels() ([]stt.ModelInfo, error)
}

type TranscribeHandler struct {
	transcriber Transcriber
	tempDir     string
	maxUpload   int64
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

// NewTranscribeHandler creates the handler. Uploads are stored in tempDir.
// Files left in tempDir by a previous run are removed.
func NewTranscribeHandler(transcriber Transcriber, tempDir string) (*TranscribeHandler, error) {
	if err := os.MkdirAll(tempDir, 0o755); err != nil {
		return nil, fmt.Errorf("failed to create temp directory: %w", err)
	}

	if stale, err := filepath.Glob(filepath.Join(tempDir, "upload-*")); err == nil {
		for _, path := range stale {
			_ = os.Remove(path)
		}
	}

	return &TranscribeHandler{transcriber: transcriber, tempDir: tempDir, maxUpload: MaxUploadBytes}, nil
}

// persistUpload copies the upload to a temp file. The extension must already
// be validated, so it is safe to use in the file name.
func (h *TranscribeHandler) persistUpload(file io.Reader, ext string) (string, error) {
	dst, err := os.CreateTemp(h.tempDir, "upload-*"+ext)
	if err != nil {
		return "", err
	}

	if _, err := io.Copy(dst, file); err != nil {
		_ = dst.Close()
		_ = os.Remove(dst.Name())
		return "", err
	}
	if err := dst.Close(); err != nil {
		_ = os.Remove(dst.Name())
		return "", err
	}

	return dst.Name(), nil
}

// parseOptions reads and validates the form fields (after the form is parsed).
func parseOptions(r *http.Request) (opts stt.Options, format string, err error) {
	opts = stt.Options{
		Model:         strings.TrimSpace(r.FormValue("model")),
		Language:      strings.ToLower(strings.TrimSpace(r.FormValue("language"))),
		InitialPrompt: r.FormValue("prompt"),
	}

	if opts.Model != "" && !stt.ValidModelName(opts.Model) {
		return opts, "", fmt.Errorf("invalid model %q", opts.Model)
	}

	if strings.ToLower(strings.TrimSpace(r.FormValue("task"))) == "translate" ||
		strings.ToLower(strings.TrimSpace(r.FormValue("translate"))) == "true" {
		opts.Translate = true
	}

	if tempRaw := strings.TrimSpace(r.FormValue("temperature")); tempRaw != "" {
		tempVal, tempErr := strconv.ParseFloat(tempRaw, 32)
		if tempErr != nil || !(tempVal >= 0 && tempVal <= 1) {
			return opts, "", errors.New("temperature must be a number between 0 and 1")
		}
		opts.Temperature = float32(tempVal)
	}

	format = strings.ToLower(strings.TrimSpace(r.FormValue("response_format")))
	if format == "" {
		format = "json"
	}
	if !validFormats[format] {
		return opts, "", fmt.Errorf("Unsupported response_format %q", format)
	}

	return opts, format, nil
}

// statusFor maps a service error to an HTTP status.
func statusFor(err error) int {
	switch {
	case errors.Is(err, stt.ErrInvalidInput):
		return http.StatusBadRequest
	case errors.Is(err, stt.ErrNoSpeech):
		return http.StatusUnprocessableEntity
	default:
		return http.StatusInternalServerError
	}
}

// HandleOpenAITranscriptions mirrors OpenAI's /v1/audio/transcriptions endpoint
func (h *TranscribeHandler) HandleOpenAITranscriptions(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		h.sendOpenAIError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, h.maxUpload)
	if err := r.ParseMultipartForm(multipartMemory); err != nil {
		var tooLarge *http.MaxBytesError
		if errors.As(err, &tooLarge) {
			h.sendOpenAIError(w, fmt.Sprintf("Upload is larger than %d bytes", h.maxUpload), http.StatusRequestEntityTooLarge)
			return
		}
		h.sendOpenAIError(w, fmt.Sprintf("Failed to parse form: %v", err), http.StatusBadRequest)
		return
	}
	if r.MultipartForm != nil {
		defer func() { _ = r.MultipartForm.RemoveAll() }()
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		h.sendOpenAIError(w, "No audio file provided. Use 'file' field", http.StatusBadRequest)
		return
	}
	defer file.Close()

	if !audio.IsSupportedFormat(header.Filename) {
		h.sendOpenAIError(w, fmt.Sprintf("Unsupported audio format %q", filepath.Ext(header.Filename)), http.StatusBadRequest)
		return
	}

	opts, format, err := parseOptions(r)
	if err != nil {
		h.sendOpenAIError(w, err.Error(), http.StatusBadRequest)
		return
	}

	tempFile, err := h.persistUpload(file, strings.ToLower(filepath.Ext(header.Filename)))
	if err != nil {
		h.sendOpenAIError(w, fmt.Sprintf("Failed to save file: %v", err), http.StatusInternalServerError)
		return
	}
	defer os.Remove(tempFile)

	result, err := h.transcriber.Transcribe(r.Context(), tempFile, opts)
	if err != nil {
		h.sendOpenAIError(w, fmt.Sprintf("Transcription failed: %v", err), statusFor(err))
		return
	}

	switch format {
	case "json":
		writeJSON(w, map[string]string{"text": result.Text})
	case "verbose_json":
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
		writeJSON(w, response)
	case "text":
		writeText(w, result.Text)
	case "srt":
		writeText(w, formatSRT(result.Segments))
	case "vtt":
		writeText(w, formatVTT(result.Segments))
	}
}

func (h *TranscribeHandler) HandleOpenAIModels(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		h.sendOpenAIError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	models, err := h.transcriber.ListModels()
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

	writeJSON(w, openAIModelList{
		Object: "list",
		Data:   openAIModels,
	})
}

func writeJSON(w http.ResponseWriter, body interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(body)
}

func writeText(w http.ResponseWriter, body string) {
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(body))
}

func (h *TranscribeHandler) sendOpenAIError(w http.ResponseWriter, message string, statusCode int) {
	errType := "invalid_request_error"
	if statusCode >= http.StatusInternalServerError {
		errType = "server_error"
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(openAIErrorResponse{
		Error: openAIErrorDetail{
			Message: message,
			Type:    errType,
		},
	})
}

func formatSRT(segments []stt.Segment) string {
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

func formatVTT(segments []stt.Segment) string {
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
