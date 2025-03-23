# Variables
FRONTEND_DIR := frontend
BACKEND_DIR := backend

# Default target
.PHONY: all
all: dev

# Install dependencies
.PHONY: install
install: install-frontend install-backend

.PHONY: install-frontend
install-frontend:
	cd $(FRONTEND_DIR) && bun install

.PHONY: install-backend
install-backend:
	cd $(BACKEND_DIR) && go mod tidy

# Development servers
.PHONY: dev
dev: dev-backend dev-frontend

.PHONY: dev-backend
dev-backend:
	cd $(BACKEND_DIR) && air

.PHONY: dev-frontend
dev-frontend:
	cd $(FRONTEND_DIR) && bun run dev

# Production servers
.PHONY: run
run: build-frontend build-backend
	./persian-ai-assistant

# Build projects
.PHONY: build
build: build-frontend build-backend

.PHONY: build-in-win
build-in-win: build-frontend build-backend-in-win

.PHONY: build-frontend
build-frontend:
	cd $(FRONTEND_DIR) && bun run build

.PHONY: build-backend
build-backend:
	cd $(BACKEND_DIR) && go build -o persian-ai-assistant && mv persian-ai-assistant ../

.PHONY: build-backend-in-win
build-backend-in-win:
	cd $(BACKEND_DIR) && go build -o ../persian-ai-assistant.exe

# Misc
.PHONY: build-docs
build-docs:
	cd $(BACKEND_DIR) && swag init --generalInfo handlers/server.go --output docs

.PHONY: clean
clean: clean-frontend clean-backend

.PHONY: clean-frontend
clean-frontend:
	rm -rf $(FRONTEND_DIR)/dist
	rm -rf $(FRONTEND_DIR)/node_modules

.PHONY: clean-backend
clean-backend:
	rm -rf $(BACKEND_DIR)/tmp
	rm -f $(BACKEND_DIR)/app
	rm -f $(BACKEND_DIR)/chats.db

# Help
.PHONY: help
help:
	@echo "Available targets:"
	@echo "  all            - Install dependencies and run development servers (default)"
	@echo "  install        - Install all dependencies"
	@echo "  run           - Run both frontend and backend development servers"
	@echo "  build         - Build both frontend and backend"
	@echo "  clean         - Clean up build artifacts and dependencies"
	@echo ""
	@echo "Individual targets:"
	@echo "  install-frontend  - Install frontend dependencies"
	@echo "  install-backend   - Install backend dependencies"
	@echo "  run-frontend     - Run frontend development server"
	@echo "  run-backend      - Run backend development server"
	@echo "  build-frontend   - Build frontend project"
	@echo "  build-backend    - Build backend project"
