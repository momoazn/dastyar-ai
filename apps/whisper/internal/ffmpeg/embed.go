package ffmpeg

import (
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"sync"
)

// embeddedFFmpeg is defined in platform-specific files (embed_*.go)
// Only the file matching the current GOOS/GOARCH will be compiled

var (
	extractedPath string
	extractOnce   sync.Once
	extractErr    error
)

// GetFFmpegPath returns the path to the embedded ffmpeg binary.
// It extracts the binary to a temporary location on first call.
func GetFFmpegPath() (string, error) {
	extractOnce.Do(func() {
		extractedPath, extractErr = extractFFmpeg()
	})
	return extractedPath, extractErr
}

func extractFFmpeg() (string, error) {
	// Check if ffmpeg is embedded for this platform
	if len(embeddedFFmpeg) == 0 {
		return "", fmt.Errorf("ffmpeg not embedded for %s/%s", runtime.GOOS, runtime.GOARCH)
	}

	// Determine filename based on platform
	filename := "ffmpeg"
	if runtime.GOOS == "windows" {
		filename = "ffmpeg.exe"
	}

	// Create a temporary directory for the extracted binary
	tmpDir := filepath.Join(os.TempDir(), "whisper-ffmpeg")
	if err := os.MkdirAll(tmpDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create temp directory: %w", err)
	}

	// Write the binary to the temp directory
	binPath := filepath.Join(tmpDir, filename)

	// Check if it already exists and is valid
	if info, err := os.Stat(binPath); err == nil {
		// If file exists and has the same size, assume it's valid
		if info.Size() == int64(len(embeddedFFmpeg)) {
			return binPath, nil
		}
		// Size mismatch, remove and re-extract
		os.Remove(binPath)
	}

	// Write the embedded binary
	if err := os.WriteFile(binPath, embeddedFFmpeg, 0755); err != nil {
		return "", fmt.Errorf("failed to write ffmpeg binary: %w", err)
	}

	return binPath, nil
}

// IsEmbedded returns true if ffmpeg is embedded in the binary
func IsEmbedded() bool {
	return len(embeddedFFmpeg) > 0
}
