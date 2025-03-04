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
		consoleWriter := zerolog.ConsoleWriter{
			Out:        os.Stdout,
			TimeFormat: "15:04:05",
			NoColor:    false,
			PartsOrder: []string{
				zerolog.TimestampFieldName,
				zerolog.LevelFieldName,
				zerolog.MessageFieldName,
				zerolog.CallerFieldName,
			},
			FormatMessage: func(i interface{}) string {
				return fmt.Sprintf("%s |", i)
			},
			FieldsExclude: []string{"caller", "time", "level"},
			FormatFieldName: func(i interface{}) string {
				return fmt.Sprintf("%s:", i)
			},
			FormatFieldValue: func(i interface{}) string {
				switch v := i.(type) {
				case time.Duration:
					return v.Round(time.Millisecond).String()
				case string:
					return v
				case int:
					return fmt.Sprintf("%d", v)
				case bool:
					if v {
						return "yes"
					}
					return "no"
				default:
					return fmt.Sprintf("%v", i)
				}
			},
			FormatLevel: func(i interface{}) string {
				if ll, ok := i.(string); ok {
					switch ll {
					case "trace":
						return "\x1b[97mTRACE\x1b[0m"
					case "debug":
						return "\x1b[36mDEBUG\x1b[0m"
					case "info":
						return "\x1b[32mINFO\x1b[0m"
					case "warn":
						return "\x1b[33mWARN\x1b[0m"
					case "error":
						return "\x1b[31mERROR\x1b[0m"
					case "fatal":
						return "\x1b[31;1mFATAL\x1b[0m"
					case "panic":
						return "\x1b[41;97mPANIC\x1b[0m"
					default:
						return ll
					}
				}
				return "???"
			},
			FormatCaller: func(i interface{}) string {
				if i == nil {
					return ""
				}
				if c, ok := i.(string); ok {
					if len(c) > 0 {
						return filepath.Base(c)
					}
				}
				return "???"
			},
		}
		writers = append(writers, consoleWriter)
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
	zerolog.TimeFieldFormat = "2006-01-02T15:04:05.000Z07:00"

	// Set console level
	if config.ConsoleLoggingEnabled {
		zerolog.SetGlobalLevel(config.ConsoleLogLevel)
	}

	// Create logger with additional context
	logger := zerolog.New(writer).
		With().
		Timestamp().
		Caller().
		Logger().
		Level(zerolog.InfoLevel)

	// Set global logger
	log.Logger = logger

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
