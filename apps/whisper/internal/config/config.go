// Package config reads the shared config.json for the whisper service.
package config

import (
	"encoding/json"
	"fmt"
	"net/url"
	"os"
	"strings"
)

const (
	defaultPort     = "8080"
	defaultModelDir = "./models"
	defaultModel    = "ggml-base.bin"
)

// Config holds the settings the whisper service needs.
type Config struct {
	Port      string
	ModelDir  string
	ModelName string
}

type appConfig struct {
	WhisperModelDir  string `json:"WHISPER_MODEL_DIR"`
	WhisperModels    string `json:"WHISPER_MODELS"`
	WhisperServerURL string `json:"WHISPER_SERVER_URL"`
}

// DefaultPaths are the places config.json is searched for.
var DefaultPaths = []string{"config.json", "../config.json", "../../config.json"}

// Load reads the first config file found in paths and applies defaults.
// A missing file is not an error. An unreadable or invalid file is.
func Load(paths []string) (Config, error) {
	app, err := readAppConfig(paths)
	if err != nil {
		return Config{}, err
	}
	return fromApp(app), nil
}

func fromApp(app appConfig) Config {
	cfg := Config{
		Port:      PortFromURL(app.WhisperServerURL),
		ModelDir:  app.WhisperModelDir,
		ModelName: FirstModelName(app.WhisperModels),
	}
	if cfg.Port == "" {
		cfg.Port = defaultPort
	}
	if cfg.ModelDir == "" {
		cfg.ModelDir = defaultModelDir
	}
	if cfg.ModelName == "" {
		cfg.ModelName = defaultModel
	}
	return cfg
}

func readAppConfig(paths []string) (appConfig, error) {
	for _, path := range paths {
		data, err := os.ReadFile(path)
		if err != nil {
			continue
		}
		var cfg appConfig
		if err := json.Unmarshal(data, &cfg); err != nil {
			return appConfig{}, fmt.Errorf("parse %s: %w", path, err)
		}
		return cfg, nil
	}
	return appConfig{}, nil
}

// FirstModelName returns the first non-empty entry of a comma-separated list.
func FirstModelName(models string) string {
	for _, model := range strings.Split(models, ",") {
		if trimmed := strings.TrimSpace(model); trimmed != "" {
			return trimmed
		}
	}
	return ""
}

// PortFromURL returns the port of rawURL, or an empty string if there is none.
func PortFromURL(rawURL string) string {
	parsed, err := url.Parse(rawURL)
	if err != nil {
		return ""
	}
	return parsed.Port()
}
