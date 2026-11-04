package audio

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"whisper/internal/stt"
)

// getFFmpegPath returns the path to ffmpeg, trying multiple sources in order
func getFFmpegPath() (string, error) {
	// 1. Try current directory first (for standalone deployment)
	currentDirFFmpeg := "./ffmpeg"
	if _, err := os.Stat(currentDirFFmpeg); err == nil {
		return currentDirFFmpeg, nil
	}

	// Windows executable in current directory
	currentDirFFmpegExe := "./ffmpeg.exe"
	if _, err := os.Stat(currentDirFFmpegExe); err == nil {
		return currentDirFFmpegExe, nil
	}

	// 2. Fall back to system ffmpeg in PATH
	path, err := exec.LookPath("ffmpeg")
	if err != nil {
		return "", fmt.Errorf("ffmpeg is not available: not found in current directory (./ffmpeg or ./ffmpeg.exe) and not found in system PATH. Please ensure ffmpeg is bundled or installed")
	}
	return path, nil
}

// maxFFmpegOutput limits how much ffmpeg output goes into an error message.
const maxFFmpegOutput = 2048

// convertTimeout is the hard limit for one ffmpeg run.
const convertTimeout = 10 * time.Minute

// ConvertToWAV converts an audio file to 16kHz mono 16-bit WAV using ffmpeg.
// It returns the path to the converted file. On error no output file is left.
// ffmpeg runs without a shell, and the input path is made absolute so it can
// never be read as an option.
func ConvertToWAV(ctx context.Context, inputPath string) (string, error) {
	ffmpegPath, err := getFFmpegPath()
	if err != nil {
		return "", err
	}

	absInput, err := filepath.Abs(inputPath)
	if err != nil {
		return "", err
	}
	if _, err := os.Stat(absInput); err != nil {
		return "", fmt.Errorf("input file not found: %s", inputPath)
	}

	outputPath := strings.TrimSuffix(absInput, filepath.Ext(absInput)) + "_converted.wav"

	ctx, cancel := context.WithTimeout(ctx, convertTimeout)
	defer cancel()

	cmd := exec.CommandContext(ctx, ffmpegPath,
		"-nostdin",
		"-loglevel", "error",
		"-i", absInput,
		"-vn",
		"-ar", "16000",
		"-ac", "1",
		"-c:a", "pcm_s16le",
		"-f", "wav",
		"-y",
		outputPath,
	)

	output, err := cmd.CombinedOutput()
	if err != nil {
		_ = os.Remove(outputPath)
		if ctx.Err() != nil {
			return "", fmt.Errorf("ffmpeg conversion stopped: %w", ctx.Err())
		}
		msg := strings.TrimSpace(string(output))
		if len(msg) > maxFFmpegOutput {
			msg = msg[:maxFFmpegOutput]
		}
		return "", fmt.Errorf("%w: ffmpeg conversion failed: %v. Output: %s", stt.ErrInvalidInput, err, msg)
	}

	if _, err := os.Stat(outputPath); err != nil {
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
