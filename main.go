package main

import (
	"embed"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os/exec"
	"runtime"
)

//go:embed dist
var staticFiles embed.FS

func main() {
	// Create a file system from the embedded static directory
	staticFS, err := fs.Sub(staticFiles, "dist")
	if err != nil {
		log.Fatal(err)
	}

	// Create a handler for serving static files
	fileHandler := http.FileServer(http.FS(staticFS))
	http.Handle("/", fileHandler)

	// Define the server address
	serverAddr := "localhost:5173"
	fmt.Printf("Server starting on http://%s\n", serverAddr)

	// Open browser automatically
	go func() {
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
	}()

	// Start the server
	log.Fatal(http.ListenAndServe(serverAddr, nil))
}