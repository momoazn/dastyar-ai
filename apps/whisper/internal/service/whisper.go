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
	"whisper/internal/stt"
)

type WhisperService struct {
	modelDir     string
	defaultModel string
	models       map[string]whisper.Model
	modelsMutex  sync.RWMutex

	// inference allows one whisper_full call at a time. All contexts of a
	// model share one native whisper_context, which is not thread-safe.
	// A channel is used so waiting can be cancelled with the request context.
	inference chan struct{}
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
		inference:    make(chan struct{}, 1),
	}

	// Pre-load the default model
	if err := service.loadModel(modelName); err != nil {
		return nil, fmt.Errorf("failed to load default model %s: %w", modelName, err)
	}

	return service, nil
}

// loadModel loads a model into memory (thread-safe)
func (s *WhisperService) loadModel(modelName string) error {
	if !stt.ValidModelName(modelName) {
		return fmt.Errorf("%w: invalid model name %q", stt.ErrInvalidInput, modelName)
	}

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
		return fmt.Errorf("%w: model file not found: %s. Please download it first with: bun run download:model", stt.ErrInvalidInput, modelPath)
	}

	// Load the model
	model, err := whisper.New(modelPath)
	if err != nil {
		return fmt.Errorf("failed to load model: %w", err)
	}

	s.models[modelName] = model
	return nil
}

// getModel retrieves a loaded model, loading it on first use (thread-safe)
func (s *WhisperService) getModel(modelName string) (whisper.Model, error) {
	s.modelsMutex.RLock()
	model, exists := s.models[modelName]
	s.modelsMutex.RUnlock()
	if exists {
		return model, nil
	}

	if err := s.loadModel(modelName); err != nil {
		return nil, err
	}

	s.modelsMutex.RLock()
	defer s.modelsMutex.RUnlock()
	return s.models[modelName], nil
}

// ListModels returns a list of available models in the model directory
func (s *WhisperService) ListModels() ([]stt.ModelInfo, error) {
	var models []stt.ModelInfo

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

		models = append(models, stt.ModelInfo{
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

// Transcribe transcribes an audio file and returns the text.
// If opts.Model is empty, it uses the default model.
// Calls run one at a time; a waiting call stops when ctx ends.
func (s *WhisperService) Transcribe(ctx context.Context, audioPath string, opts stt.Options) (*stt.Result, error) {
	if _, err := os.Stat(audioPath); err != nil {
		return nil, fmt.Errorf("audio file not found: %s", audioPath)
	}

	if !audio.IsSupportedFormat(audioPath) {
		return nil, fmt.Errorf("%w: unsupported audio format: %s. Supported formats: WAV, MP3, MP4, M4A, OGG, OPUS, WEBM, FLAC, AAC, WMA", stt.ErrInvalidInput, filepath.Ext(audioPath))
	}

	if opts.Model == "" {
		opts.Model = s.defaultModel
	}
	if !stt.ValidModelName(opts.Model) {
		return nil, fmt.Errorf("%w: invalid model name %q", stt.ErrInvalidInput, opts.Model)
	}

	data, err := s.prepareAudio(ctx, audioPath)
	if err != nil {
		return nil, err
	}

	// One inference at a time.
	select {
	case s.inference <- struct{}{}:
		defer func() { <-s.inference }()
	case <-ctx.Done():
		return nil, ctx.Err()
	}

	model, err := s.getModel(opts.Model)
	if err != nil {
		return nil, err
	}

	wctx, err := model.NewContext()
	if err != nil {
		return nil, fmt.Errorf("failed to create context: %w", err)
	}

	if opts.Language != "" {
		if err := wctx.SetLanguage(opts.Language); err != nil {
			return nil, fmt.Errorf("%w: failed to set language %q: %v", stt.ErrInvalidInput, opts.Language, err)
		}
	}

	if opts.InitialPrompt != "" {
		wctx.SetInitialPrompt(opts.InitialPrompt)
	}

	if opts.Temperature > 0 {
		wctx.SetTemperature(opts.Temperature)
	}

	if opts.Translate {
		wctx.SetTranslate(true)
	}

	// The encoder callback lets a cancelled request stop between audio windows.
	if err := wctx.Process(data, func() bool { return ctx.Err() == nil }, nil, nil); err != nil {
		if ctx.Err() != nil {
			return nil, ctx.Err()
		}
		return nil, fmt.Errorf("failed to process audio: %w", err)
	}

	result := &stt.Result{
		Task:      "transcribe",
		Prompt:    opts.InitialPrompt,
		Translate: opts.Translate,
	}
	if opts.Translate {
		result.Task = "translate"
	}

	var textBuilder strings.Builder
	var segments []stt.Segment

	for {
		segment, err := wctx.NextSegment()
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

		ts := stt.Segment{
			ID:    len(segments),
			Seek:  int(segment.Start.Milliseconds()),
			Start: segment.Start.Seconds(),
			End:   segment.End.Seconds(),
			Text:  segmentText,
		}

		for _, token := range segment.Tokens {
			ts.Tokens = append(ts.Tokens, token.Id)
		}

		segments = append(segments, ts)

		if segment.End.Seconds() > result.Duration {
			result.Duration = segment.End.Seconds()
		}
	}

	result.Text = strings.TrimSpace(textBuilder.String())
	result.Language = wctx.DetectedLanguage()
	result.Segments = segments

	if result.Text == "" {
		return nil, stt.ErrNoSpeech
	}

	return result, nil
}

// prepareAudio returns 16kHz mono samples. A WAV file in that format is read
// directly. Any other file, including other WAV formats, goes through ffmpeg.
func (s *WhisperService) prepareAudio(ctx context.Context, audioPath string) ([]float32, error) {
	if audio.IsWAVFile(audioPath) {
		if data, err := s.loadAudioData(audioPath); err == nil {
			return data, nil
		}
	}

	convertedPath, err := audio.ConvertToWAV(ctx, audioPath)
	if err != nil {
		return nil, fmt.Errorf("failed to convert audio to WAV: %w", err)
	}
	defer os.Remove(convertedPath)

	data, err := s.loadAudioData(convertedPath)
	if err != nil {
		return nil, fmt.Errorf("failed to load audio: %w", err)
	}
	return data, nil
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

// Close releases resources. It waits for a running transcription to end.
func (s *WhisperService) Close() error {
	s.inference <- struct{}{}
	defer func() { <-s.inference }()

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
