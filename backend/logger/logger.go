package logger

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"time"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"gopkg.in/natefinch/lumberjack.v2"
)

const (
	LogDir           = "logs"
	LogFile          = "app.log"
	MaxSize          = 10 // MB
	MaxBackups       = 5
	MaxAge           = 30 // days
	RotationInterval = 24 * time.Hour
)

// Config holds the logger configuration
type Config struct {
	ConsoleLoggingEnabled bool
	FileLoggingEnabled    bool
	ConsoleLogLevel       zerolog.Level
	FileLogLevel          zerolog.Level
	FilePath              string
}

// InitLogger sets up logging with:
// - JSON formatting for structured logging
// - Console output for development
// - File output with rotation for production
// - Proper timestamp formatting
// - Configurable log levels
func InitLogger(config Config) error {
	// Configure console output
	var writers []io.Writer
	if config.ConsoleLoggingEnabled {
		writers = append(writers, os.Stdout)
	}

	// Configure file output
	if config.FileLoggingEnabled {
		if err := os.MkdirAll(filepath.Dir(config.FilePath), 0755); err != nil {
			return fmt.Errorf("failed to create log directory: %v", err)
		}

		fileLogger := &lumberjack.Logger{
			Filename:   config.FilePath,
			MaxSize:    MaxSize,
			MaxBackups: MaxBackups,
			MaxAge:     MaxAge,
			Compress:   true,
		}
		writers = append(writers, fileLogger)

		// Start log rotation goroutine
		go rotateLogsDaily(fileLogger)
	}

	// Create multi-writer if needed
	var writer io.Writer
	if len(writers) > 1 {
		writer = io.MultiWriter(writers...)
	} else if len(writers) == 1 {
		writer = writers[0]
	} else {
		writer = io.Discard
	}

	// Configure global logger
	zerolog.TimeFieldFormat = time.RFC3339Nano

	// Set console level
	if config.ConsoleLoggingEnabled {
		zerolog.SetGlobalLevel(config.ConsoleLogLevel)
	}

	// Create logger
	log.Logger = zerolog.New(writer).With().Timestamp().Caller().Logger()

	// Log initial configuration
	log.Info().
		Bool("console_enabled", config.ConsoleLoggingEnabled).
		Bool("file_enabled", config.FileLoggingEnabled).
		Str("file_path", config.FilePath).
		Str("console_level", config.ConsoleLogLevel.String()).
		Str("file_level", config.FileLogLevel.String()).
		Int("max_size_mb", MaxSize).
		Int("max_backups", MaxBackups).
		Int("max_age_days", MaxAge).
		Msg("Logger initialized")

	return nil
}

// SetLogLevel updates the global log level
func SetLogLevel(level string) error {
	lvl, err := zerolog.ParseLevel(level)
	if err != nil {
		return fmt.Errorf("invalid log level: %s", level)
	}
	zerolog.SetGlobalLevel(lvl)
	log.Info().Str("level", level).Msg("Log level updated")
	return nil
}

// rotateLogsDaily handles time-based log rotation
func rotateLogsDaily(logger *lumberjack.Logger) {
	for {
		now := time.Now()
		next := now.Add(RotationInterval)
		next = time.Date(next.Year(), next.Month(), next.Day(), 0, 0, 0, 0, next.Location())
		timer := time.NewTimer(next.Sub(now))
		<-timer.C
		logger.Rotate()
		log.Info().
			Str("next_rotation", next.Add(RotationInterval).Format(time.RFC3339)).
			Msg("Log file rotated")
	}
}
