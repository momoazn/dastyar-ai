package main

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
)

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

	// Setup routes
	e, err := setupServer(db)
	if err != nil {
		log.Fatal(err)
	}

	// Define the server address
	serverAddr := "localhost:8080"
	fmt.Printf("Server starting on http://%s\n", serverAddr)

	// Open browser automatically
	go func() {
		godotenv.Load()
		if os.Getenv("DONT_OPEN_BROWSER") != "true" {
			openBrowser(serverAddr)
		}
	}()

	// Start the server
	log.Fatal(e.Start(serverAddr))
}
