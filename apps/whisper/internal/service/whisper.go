package service

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"sync"

	whisper "github.com/ggerganov/whisper.cpp/bindings/go/pkg/whisper"
	"whisper/internal/audio"
)

type WhisperService struct {
	modelDir     string
	defaultModel string
	models       map[string]whisper.Model
	modelsMutex  sync.RWMutex
}

// TranscriptionSegment mirrors OpenAI segment metadata.
type TranscriptionSegment struct {
	ID               int     `json:"id"`
	Seek             int     `json:"seek"`
	Start            float64 `json:"start"`
	End              float64 `json:"end"`
	Text             string  `json:"text"`
	Tokens           []int   `json:"tokens"`
	Temperature      float32 `json:"temperature"`
	AvgLogprob       float32 `json:"avg_logprob"`
	CompressionRatio float32 `json:"compression_ratio"`
	NoSpeechProb     float32 `json:"no_speech_prob"`
}

// TranscriptionResult holds the transcription output
type TranscriptionResult struct {
	Text      string                 `json:"text"`
	Language  string                 `json:"language,omitempty"`
	Duration  float64                `json:"duration,omitempty"`
	Segments  []TranscriptionSegment `json:"segments,omitempty"`
	Task      string                 `json:"task,omitempty"`
	Prompt    string                 `json:"prompt,omitempty"`
	Translate bool                   `json:"translate,omitempty"`
}

// TranscriptionOptions configures how the audio is processed.
type TranscriptionOptions struct {
	Model         string
	Language      string
	InitialPrompt string
	Temperature   float32
	Translate     bool
}

// ModelInfo holds information about an available model
type ModelInfo struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Path string `json:"path,omitempty"`
}

// NewWhisperService creates a new Whisper service instance
func NewWhisperService(modelDir string, modelName string) (*WhisperService, error) {
	// Check if model directory exists
	if _, err := os.Stat(modelDir); os.IsNotExist(err) {
		return nil, fmt.Errorf("model directory not found: %s", modelDir)
	}

	service := &WhisperService{
		modelDir:     modelDir,
		defaultModel: modelName,
		models:       make(map[string]whisper.Model),
	}

	// Pre-load the default model
	if err := service.loadModel(modelName); err != nil {
		return nil, fmt.Errorf("failed to load default model %s: %w", modelName, err)
	}

	return service, nil
}

// loadModel loads a model into memory (thread-safe)
func (s *WhisperService) loadModel(modelName string) error {
	s.modelsMutex.Lock()
	defer s.modelsMutex.Unlock()

	// Check if already loaded
	if _, exists := s.models[modelName]; exists {
		return nil
	}

	// Build full model path
	modelPath := filepath.Join(s.modelDir, modelName)

	// Check if model exists
	if _, err := os.Stat(modelPath); os.IsNotExist(err) {
		return fmt.Errorf("model file not found: %s. Please download it first with: bun run download:model", modelPath)
	}

	// Load the model
	model, err := whisper.New(modelPath)
	if err != nil {
		return fmt.Errorf("failed to load model: %w", err)
	}

	s.models[modelName] = model
	return nil
}

// getModel retrieves a loaded model (thread-safe)
func (s *WhisperService) getModel(modelName string) (whisper.Model, error) {
	s.modelsMutex.RLock()
	model, exists := s.models[modelName]
	s.modelsMutex.RUnlock()

	if !exists {
		// Try to load it
		if err := s.loadModel(modelName); err != nil {
			return nil, err
		}
		// Retrieve again
		s.modelsMutex.RLock()
		model = s.models[modelName]
		s.modelsMutex.RUnlock()
	}

	return model, nil
}

// ListModels returns a list of available models in the model directory
func (s *WhisperService) ListModels() ([]ModelInfo, error) {
	var models []ModelInfo

	// Read model directory
	entries, err := os.ReadDir(s.modelDir)
	if err != nil {
		return nil, fmt.Errorf("failed to read model directory: %w", err)
	}

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		name := entry.Name()
		// Only include .bin files (GGML models)
		if !strings.HasSuffix(name, ".bin") {
			continue
		}

		// Generate a human-readable name
		displayName := name
		displayName = strings.TrimPrefix(displayName, "ggml-")
		displayName = strings.TrimSuffix(displayName, ".bin")
		displayName = strings.ReplaceAll(displayName, "-", " ")
		displayName = strings.Title(displayName)

		models = append(models, ModelInfo{
			ID:   name,
			Name: displayName,
			Path: filepath.Join(s.modelDir, name),
		})
	}

	if len(models) == 0 {
		return nil, fmt.Errorf("no models found in %s. Please download a model with: bun run download:model", s.modelDir)
	}

	return models, nil
}

// Transcribe transcribes an audio file and returns the text
// If opts.Model is empty, uses the default model
func (s *WhisperService) Transcribe(ctx context.Context, audioPath string, opts TranscriptionOptions) (*TranscriptionResult, error) {
	// Check if file exists
	if _, err := os.Stat(audioPath); os.IsNotExist(err) {
		return nil, fmt.Errorf("audio file not found: %s", audioPath)
	}

	// Check if format is supported
	if !audio.IsSupportedFormat(audioPath) {
		return nil, fmt.Errorf("unsupported audio format: %s. Supported formats: WAV, MP3, MP4, M4A, OGG, OPUS, WEBM, FLAC, AAC, WMA", filepath.Ext(audioPath))
	}

	// Convert to WAV if needed
	processPath := audioPath
	var convertedPath string
	if !audio.IsWAVFile(audioPath) {
		var err error
		convertedPath, err = audio.ConvertToWAV(audioPath)
		if err != nil {
			return nil, fmt.Errorf("failed to convert audio to WAV: %w", err)
		}
		processPath = convertedPath
		defer os.Remove(convertedPath) // Clean up converted file
	}

	// Use default model if not specified
	if opts.Model == "" {
		opts.Model = s.defaultModel
	}

	// Get the model (loads if not already loaded)
	model, err := s.getModel(opts.Model)
	if err != nil {
		return nil, err
	}

	// Load and decode the WAV file
	data, err := s.loadAudioData(processPath)
	if err != nil {
		return nil, fmt.Errorf("failed to load audio: %w", err)
	}

	// Create a processing context
	context, err := model.NewContext()
	if err != nil {
		return nil, fmt.Errorf("failed to create context: %w", err)
	}

	if opts.Language != "" {
		if err := context.SetLanguage(opts.Language); err != nil {
			return nil, fmt.Errorf("failed to set language %q: %w", opts.Language, err)
		}
	}

	if opts.InitialPrompt != "" {
		context.SetInitialPrompt(opts.InitialPrompt)
	}

	if opts.Temperature > 0 {
		context.SetTemperature(opts.Temperature)
	}

	if opts.Translate {
		context.SetTranslate(true)
	}

	// Process the audio data
	if err := context.Process(data, nil, nil, nil); err != nil {
		return nil, fmt.Errorf("failed to process audio: %w", err)
	}

	// Collect results
	result := &TranscriptionResult{
		Task:      "transcribe",
		Prompt:    opts.InitialPrompt,
		Translate: opts.Translate,
	}
	if opts.Translate {
		result.Task = "translate"
	}

	var textBuilder strings.Builder
	var segments []TranscriptionSegment

	// Iterate through segments
	for {
		segment, err := context.NextSegment()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("failed to get segment: %w", err)
		}

		segmentText := strings.TrimSpace(segment.Text)
		if segmentText != "" {
			textBuilder.WriteString(segmentText)
			textBuilder.WriteString(" ")
		}

		id := len(segments)
		ts := TranscriptionSegment{
			ID:    id,
			Seek:  int(segment.Start.Milliseconds()),
			Start: segment.Start.Seconds(),
			End:   segment.End.Seconds(),
			Text:  segmentText,
		}

		if len(segment.Tokens) > 0 {
			for _, token := range segment.Tokens {
				ts.Tokens = append(ts.Tokens, token.Id)
			}
		}

		segments = append(segments, ts)

		// Track duration
		if segment.End.Seconds() > result.Duration {
			result.Duration = segment.End.Seconds()
		}
	}

	result.Text = strings.TrimSpace(textBuilder.String())
	result.Language = context.DetectedLanguage()
	result.Segments = segments

	// If no text was extracted, return an error
	if result.Text == "" {
		return nil, fmt.Errorf("no transcription generated from audio file")
	}

	return result, nil
}

// loadAudioData loads a WAV file and converts it to the format whisper expects
func (s *WhisperService) loadAudioData(audioPath string) ([]float32, error) {
	// Decode the WAV file
	samples, sampleRate, channels, err := audio.LoadWAVMonoSamples(audioPath)
	if err != nil {
		return nil, fmt.Errorf("failed to decode WAV: %w", err)
	}

	// Check sample rate (whisper requires 16kHz)
	if sampleRate != whisper.SampleRate {
		return nil, fmt.Errorf(
			"audio conversion failed: sample rate is %d Hz instead of required %d Hz",
			sampleRate,
			whisper.SampleRate,
		)
	}

	// Check number of channels (whisper requires mono)
	if channels != 1 {
		return nil, fmt.Errorf(
			"audio conversion failed: audio has %d channels instead of required 1 (mono)",
			channels,
		)
	}

	return samples, nil
}

// Close releases resources
func (s *WhisperService) Close() error {
	s.modelsMutex.Lock()
	defer s.modelsMutex.Unlock()

	var lastErr error
	for name, model := range s.models {
		if err := model.Close(); err != nil {
			lastErr = fmt.Errorf("failed to close model %s: %w", name, err)
		}
	}
	s.models = make(map[string]whisper.Model)
	return lastErr
}
