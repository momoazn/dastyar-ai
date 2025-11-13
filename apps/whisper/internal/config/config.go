package config

import "os"

type Config struct {
	Port      string
	ModelPath string
	ModelName string
}

func Load() (*Config, error) {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	modelPath := os.Getenv("MODEL_PATH")
	if modelPath == "" {
		modelPath = "./models"
	}

	modelName := os.Getenv("MODEL_NAME")
	if modelName == "" {
		modelName = "ggml-base.bin"
	}

	return &Config{
		Port:      port,
		ModelPath: modelPath,
		ModelName: modelName,
	}, nil
}
