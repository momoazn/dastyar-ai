.PHONY: help setup build build-full run download-model clean test

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

setup: ## Setup dependencies (clone whisper.cpp, create models dir)
	@echo "Setting up dependencies..."
	@if [ ! -d "whisper.cpp" ]; then \
		echo "Cloning whisper.cpp..."; \
		git clone https://github.com/ggerganov/whisper.cpp.git; \
	fi
	@mkdir -p models
	@mkdir -p temp
	@echo "✓ Setup complete"

build-full: ## Full build (whisper.cpp + Go server)
	./build.sh

build: setup ## Quick build (Go only, assumes whisper.cpp is built)
	@echo "Building Go whisper server..."
	@export C_INCLUDE_PATH="$(PWD)/whisper.cpp/include:$(PWD)/whisper.cpp/ggml/include"; \
	export LIBRARY_PATH="$(PWD)/whisper.cpp/build_go/src:$(PWD)/whisper.cpp/build_go/ggml/src"; \
	export CGO_LDFLAGS="-L$(PWD)/whisper.cpp/build_go/src -L$(PWD)/whisper.cpp/build_go/ggml/src"; \
	if [[ "$$OSTYPE" == "darwin"* ]]; then \
		export CGO_LDFLAGS="$$CGO_LDFLAGS -framework Foundation -framework Metal -framework MetalKit"; \
	fi; \
	go build -o whisper .
	@chmod +x whisper
	@echo "✓ Build complete: ./whisper"

run: ## Run the application
	./whisper

dev: ## Run in development mode
	go run main.go

download-model: ## Download base model (use MODEL=model-name to specify)
	./download-model.sh $(or $(MODEL),ggml-base.bin)

clean: ## Clean build artifacts
	rm -f whisper
	rm -rf temp/*
	rm -rf whisper.cpp/build_go

clean-all: clean ## Clean everything including whisper.cpp
	rm -rf whisper.cpp

test: ## Run tests
	go test -v ./...
