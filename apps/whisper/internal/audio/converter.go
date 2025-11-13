package audio

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"whisper/internal/ffmpeg"
)

// getFFmpegPath returns the path to ffmpeg, trying embedded version first
func getFFmpegPath() (string, error) {
	// Try embedded ffmpeg first
	if ffmpeg.IsEmbedded() {
		if path, err := ffmpeg.GetFFmpegPath(); err == nil {
			return path, nil
		}
	}

	// Fall back to system ffmpeg
	path, err := exec.LookPath("ffmpeg")
	if err != nil {
		return "", fmt.Errorf("ffmpeg is not available: not embedded in binary and not found in PATH. Please install ffmpeg or use a build with embedded ffmpeg")
	}
	return path, nil
}

// ConvertToWAV converts an audio file to 16kHz mono WAV format using ffmpeg
// Returns the path to the converted file and an error if conversion fails
func ConvertToWAV(inputPath string) (string, error) {
	// Get ffmpeg path (embedded or system)
	ffmpegPath, err := getFFmpegPath()
	if err != nil {
		return "", err
	}

	// Check if input file exists
	if _, err := os.Stat(inputPath); os.IsNotExist(err) {
		return "", fmt.Errorf("input file not found: %s", inputPath)
	}

	// Create output path
	ext := filepath.Ext(inputPath)
	outputPath := strings.TrimSuffix(inputPath, ext) + "_converted.wav"

	// Build ffmpeg command
	// -i: input file
	// -ar 16000: set sample rate to 16kHz
	// -ac 1: set to mono (1 channel)
	// -y: overwrite output file if exists
	// -loglevel error: only show errors
	cmd := exec.Command(ffmpegPath,
		"-i", inputPath,
		"-ar", "16000",
		"-ac", "1",
		"-y",
		"-loglevel", "error",
		outputPath,
	)

	// Run the conversion
	output, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("ffmpeg conversion failed: %w. Output: %s", err, string(output))
	}

	// Verify output file was created
	if _, err := os.Stat(outputPath); os.IsNotExist(err) {
		return "", fmt.Errorf("converted file was not created: %s", outputPath)
	}

	return outputPath, nil
}

// IsWAVFile checks if a file is a WAV file based on extension
func IsWAVFile(filename string) bool {
	ext := strings.ToLower(filepath.Ext(filename))
	return ext == ".wav"
}

// IsSupportedFormat checks if the audio format is commonly supported
func IsSupportedFormat(filename string) bool {
	ext := strings.ToLower(filepath.Ext(filename))
	supportedFormats := []string{
		".wav", ".mp3", ".mp4", ".m4a", ".ogg", ".opus",
		".webm", ".flac", ".aac", ".wma", ".oga",
	}

	for _, format := range supportedFormats {
		if ext == format {
			return true
		}
	}

	return false
}
