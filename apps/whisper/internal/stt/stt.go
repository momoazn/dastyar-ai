// Package stt holds the plain types shared by the HTTP handler and the
// whisper service. It does not import the CGo bindings, so it can be tested
// without whisper.cpp.
package stt

import (
	"errors"
	"strings"
)

var (
	// ErrInvalidInput marks an error caused by the request, not the server.
	ErrInvalidInput = errors.New("invalid input")
	// ErrNoSpeech means the model found no text in the audio.
	ErrNoSpeech = errors.New("no transcription generated from audio file")
)

// Segment mirrors OpenAI segment metadata.
type Segment struct {
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

// Result holds the transcription output.
type Result struct {
	Text      string    `json:"text"`
	Language  string    `json:"language,omitempty"`
	Duration  float64   `json:"duration,omitempty"`
	Segments  []Segment `json:"segments,omitempty"`
	Task      string    `json:"task,omitempty"`
	Prompt    string    `json:"prompt,omitempty"`
	Translate bool      `json:"translate,omitempty"`
}

// Options configures how the audio is processed.
type Options struct {
	Model         string
	Language      string
	InitialPrompt string
	Temperature   float32
	Translate     bool
}

// ModelInfo holds information about an available model.
type ModelInfo struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Path string `json:"path,omitempty"`
}

// ValidModelName reports whether name is a plain GGML file name. It blocks
// path traversal because the name is joined with the model directory.
func ValidModelName(name string) bool {
	if name == "" || !strings.HasSuffix(name, ".bin") {
		return false
	}
	return !strings.ContainsAny(name, `/\`) && !strings.Contains(name, "..") && !strings.ContainsRune(name, 0)
}
