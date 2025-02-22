package main

import (
	"embed"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os/exec"
	"runtime"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
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

func setupRoutes(e *echo.Echo, db *gorm.DB, staticFS fs.FS) {
	// Create a handler for serving static files
	fileHandler := http.FileServer(http.FS(staticFS))
	e.GET("/*", echo.WrapHandler(fileHandler))

	// API group
	api := e.Group("/api")

	// Conversation endpoints
	api.GET("/conversations", handleGetAllConversations(db))
	api.POST("/conversations", handleCreateConversation(db))
	api.GET("/conversations/:id", handleGetConversation(db))
	api.DELETE("/conversations/:id", handleDeleteConversation(db))
	api.POST("/conversations/:id/messages", handleAddMessage(db))
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
