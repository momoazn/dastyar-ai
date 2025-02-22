package main

import (
	"embed"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"net/url"
	"os/exec"
	"runtime"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	ollama "github.com/ollama/ollama/api"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

type Message struct {
	ID             uint         `json:"id" gorm:"primaryKey"`
	ConversationID uint         `json:"conversation_id"`
	Conversation   Conversation `json:"-" gorm:"constraint:OnDelete:CASCADE"`
	Role           string       `json:"role"`
	Content        string       `json:"content"`
	CreatedAt      time.Time    `json:"created_at"`
}

type Conversation struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Title     string    `json:"title"`
	Messages  []Message `json:"messages,omitempty" gorm:"foreignKey:ConversationID"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type ChatRequest struct {
	Message string `json:"message"`
	Model   string `json:"model"`
}

// Initialize database connection and create tables
func initDB() (*gorm.DB, error) {
	db, err := gorm.Open(sqlite.Open("chats.db"), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	// Auto migrate the schema
	err = db.AutoMigrate(&Conversation{}, &Message{})
	if err != nil {
		return nil, err
	}

	return db, nil
}

//go:embed dist
var staticFiles embed.FS

// Database handler functions
func handleGetAllConversations(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		var conversations []Conversation
		result := db.Preload("Messages").Order("updated_at DESC").Find(&conversations)
		if result.Error != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": result.Error.Error()})
		}
		return c.JSON(http.StatusOK, conversations)
	}
}

func handleCreateConversation(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		var conv Conversation
		if err := c.Bind(&conv); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}

		result := db.Create(&conv)
		if result.Error != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": result.Error.Error()})
		}

		return c.JSON(http.StatusCreated, conv)
	}
}

func handleGetConversation(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		id := c.Param("id")
		var conv Conversation

		result := db.Preload("Messages").First(&conv, id)
		if result.Error != nil {
			if result.Error == gorm.ErrRecordNotFound {
				return c.JSON(http.StatusNotFound, map[string]string{"error": "Conversation not found"})
			}
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": result.Error.Error()})
		}

		return c.JSON(http.StatusOK, conv)
	}
}

func handleDeleteConversation(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		id := c.Param("id")
		result := db.Delete(&Conversation{}, id)
		if result.Error != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": result.Error.Error()})
		}
		if result.RowsAffected == 0 {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "Conversation not found"})
		}
		return c.NoContent(http.StatusOK)
	}
}

func handleAddMessage(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		convID := c.Param("id")
		var msg Message
		if err := c.Bind(&msg); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}

		// Verify conversation exists
		var conv Conversation
		result := db.First(&conv, convID)
		if result.Error != nil {
			if result.Error == gorm.ErrRecordNotFound {
				return c.JSON(http.StatusNotFound, map[string]string{"error": "Conversation not found"})
			}
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": result.Error.Error()})
		}

		// Set conversation ID and create message
		msg.ConversationID = conv.ID
		result = db.Create(&msg)
		if result.Error != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": result.Error.Error()})
		}

		// Update conversation's updated_at timestamp
		db.Model(&conv).Update("updated_at", time.Now())

		return c.JSON(http.StatusCreated, msg)
	}
}

func handleStreamChat(db *gorm.DB, ollamaClient *ollama.Client) echo.HandlerFunc {
	return func(c echo.Context) error {
		convID := c.Param("id")
		var chatReq ChatRequest
		if err := c.Bind(&chatReq); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}

		// Verify conversation exists
		var conv Conversation
		result := db.First(&conv, convID)
		if result.Error != nil {
			if result.Error == gorm.ErrRecordNotFound {
				return c.JSON(http.StatusNotFound, map[string]string{"error": "Conversation not found"})
			}
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": result.Error.Error()})
		}

		// Create and save user message
		userMsg := Message{
			ConversationID: conv.ID,
			Role:           "user",
			Content:        chatReq.Message,
			CreatedAt:      time.Now(),
		}
		if err := db.Create(&userMsg).Error; err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}

		// Create assistant message (will be updated with streamed content)
		assistantMsg := Message{
			ConversationID: conv.ID,
			Role:           "assistant",
			Content:        "",
			CreatedAt:      time.Now(),
		}
		if err := db.Create(&assistantMsg).Error; err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}

		// Set up SSE headers
		c.Response().Header().Set("Content-Type", "text/event-stream")
		c.Response().Header().Set("Cache-Control", "no-cache")
		c.Response().Header().Set("Connection", "keep-alive")
		c.Response().WriteHeader(http.StatusOK)

		// Create a channel to handle client disconnection
		done := c.Request().Context().Done()
		fullResponse := ""

		// Start streaming response
		err := ollamaClient.Chat(c.Request().Context(), &api.ChatRequest{
			Model: chatReq.Model,
			Messages: []api.Message{
				{Role: "user", Content: chatReq.Message},
			},
		}, func(response api.ChatResponse) error {
			select {
			case <-done:
				return fmt.Errorf("client disconnected")
			default:
				fullResponse += response.Message.Content
				// Send the chunk to the client
				fmt.Fprintf(c.Response(), "data: %s\n\n", response.Message.Content)
				c.Response().Flush()
				return nil
			}
		})

		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}

		// Update the assistant message with the complete response
		db.Model(&assistantMsg).Update("content", fullResponse)
		// Update conversation's updated_at timestamp
		db.Model(&conv).Update("updated_at", time.Now())

		return nil
	}
}

func setupRoutes(e *echo.Echo, db *gorm.DB, staticFS fs.FS) {
	// API group
	api := e.Group("/api")

	// Create Ollama client
	ollamaURL, _ := url.Parse("http://localhost:11434")
	ollamaClient := ollama.NewClient(ollamaURL, &http.Client{})

	// Conversation endpoints
	api.GET("/conversations", handleGetAllConversations(db))
	api.POST("/conversations", handleCreateConversation(db))
	api.GET("/conversations/:id", handleGetConversation(db))
	api.DELETE("/conversations/:id", handleDeleteConversation(db))
	api.POST("/conversations/:id/messages", handleAddMessage(db))

	// Streaming chat endpoint
	api.POST("/conversations/:id/chat", handleStreamChat(db, ollamaClient))

	// Create a handler for serving static files
	// This should be last to ensure API routes are handled first
	fileHandler := http.FileServer(http.FS(staticFS))
	e.GET("/*", echo.WrapHandler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// If path starts with /api, return 404 as it means no API route was matched
		if len(r.URL.Path) >= 4 && r.URL.Path[:4] == "/api" {
			http.NotFound(w, r)
			return
		}
		fileHandler.ServeHTTP(w, r)
	})))
}

func openBrowser(serverAddr string) {
	var err error
	switch runtime.GOOS {
	case "linux":
		err = exec.Command("xdg-open", fmt.Sprintf("http://%s", serverAddr)).Start()
	case "windows":
		err = exec.Command("rundll32", "url.dll,FileProtocolHandler", fmt.Sprintf("http://%s", serverAddr)).Start()
	case "darwin":
		err = exec.Command("open", fmt.Sprintf("http://%s", serverAddr)).Start()
	default:
		fmt.Println("Unsupported OS for automatic browser opening")
		return
	}
	if err != nil {
		fmt.Printf("Error opening browser: %v\n", err)
	}
}

func main() {
	// Initialize database
	db, err := initDB()
	if err != nil {
		log.Fatal(err)
	}
	defer func() {
		sqlDB, _ := db.DB()
		sqlDB.Close()
	}()

	// Create a file system from the embedded static directory
	staticFS, err := fs.Sub(staticFiles, "dist")
	if err != nil {
		log.Fatal(err)
	}

	// Create Echo instance
	e := echo.New()

	// Middleware
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORS())

	// Setup routes
	setupRoutes(e, db, staticFS)

	// Define the server address
	serverAddr := "localhost:5173"
	fmt.Printf("Server starting on http://%s\n", serverAddr)

	// Open browser automatically
	go openBrowser(serverAddr)

	// Start the server
	log.Fatal(e.Start(serverAddr))
}
