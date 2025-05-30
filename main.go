package main

import (
	"embed"
	"fmt"
	"io"
	"io/fs"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path"
	"runtime"
	"strings"
	"time"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/cmd"
	"github.com/pocketbase/pocketbase/core"
)

//go:embed dist
var staticFiles embed.FS

//go:embed pb_schema.json
var schemaJSON []byte

func main() {
	app := pocketbase.NewWithConfig(pocketbase.Config{
		DefaultDataDir: "./data",
	})

	// --- Bind Serve Event Handlers ---
	app.OnServe().BindFunc(importSchema)
	app.OnServe().BindFunc(ensureSuperuserExists)
	app.OnServe().BindFunc(serveStaticFilesAndOpenBrowser)

	// --- Start Application ---
	startApp(app)
}

// --- Helper Functions ---

func openBrowser(serverAddr string) {
	var err error
	switch runtime.GOOS {
	case "linux":
		err = exec.Command("xdg-open", serverAddr).Start()
	case "windows":
		err = exec.Command("rundll32", "url.dll,FileProtocolHandler", serverAddr).Start()
	case "darwin":
		err = exec.Command("open", serverAddr).Start()
	default:
		fmt.Printf("Unsupported OS %q for automatic browser opening. Please open %s manually.", runtime.GOOS, serverAddr)
		return
	}
	if err != nil {
		fmt.Printf("Error opening browser: %v", err)
	}
}

func staticHandler(staticFS fs.FS, w http.ResponseWriter, r *http.Request) error {
	// Prevent API access through the static handler
	if strings.HasPrefix(r.URL.Path, "/api/") {
		return apis.NewNotFoundError("", nil) // Let PocketBase handle API routing
	}

	// Check if the requested file exists in the embedded FS
	filePath := strings.TrimPrefix(r.URL.Path, "/")
	f, err := staticFS.Open(filePath)
	if err != nil {
		// If the file doesn't exist and it's a route (no extension), serve index.html
		if os.IsNotExist(err) && path.Ext(filePath) == "" {
			indexFile, indexErr := staticFS.Open("index.html")
			if indexErr != nil {
				log.Printf("Error opening index.html: %v", indexErr)
				http.Error(w, "Internal Server Error", http.StatusInternalServerError)
				return indexErr // Return the error from opening index.html
			}
			defer indexFile.Close()

			// Explicitly cast to io.ReadSeeker for ServeContent
			seeker, ok := indexFile.(io.ReadSeeker)
			if !ok {
				log.Printf("index.html does not implement io.ReadSeeker")
				http.Error(w, "Internal Server Error", http.StatusInternalServerError)
				return fmt.Errorf("index.html is not seekable")
			}

			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			http.ServeContent(w, r, "index.html", time.Time{}, seeker)
			return nil // Successfully served index.html
		}
		// For other errors or files with extensions that don't exist, let the FileServer handle it (will likely 404)
	} else {
		// File exists, close it and let the FileServer handle serving
		f.Close()
	}

	// Use http.FileServer to serve the static file
	http.FileServer(http.FS(staticFS)).ServeHTTP(w, r)
	return nil // Let the FileServer handle the response
}

func startApp(app *pocketbase.PocketBase) {
	if app.IsDev() {
		log.Println("Starting App in development mode...")
		if err := app.Start(); err != nil {
			log.Fatalf("Failed to start App in dev mode: %v", err)
		}
	} else {
		log.Println("Starting App in production mode...")
		if err := app.Bootstrap(); err != nil {
			log.Fatalf("Failed to bootstrap App: %v", err)
		}
		serveCmd := cmd.NewServeCommand(app, false) // Assuming true means daemonize=false
		if err := serveCmd.Execute(); err != nil {
			log.Fatalf("Failed to execute serve command: %v", err)
		}
	}
}

// --- Serve Event Handlers ---

func importSchema(e *core.ServeEvent) error {
	// Use the embedded schemaJSON instead of reading from file
	if len(schemaJSON) == 0 {
		log.Println("Warning: schema is empty. Skipping schema import.")
		return e.Next() // Continue without importing if schema is empty
	}

	if err := e.App.ImportCollectionsByMarshaledJSON(schemaJSON, false); err != nil {
		log.Printf("Error importing collections from schema: %v", err)
		return err
	}
	log.Println("Successfully imported collections from schema.")
	return e.Next()
}

func ensureSuperuserExists(e *core.ServeEvent) error {
	adminCollection, err := e.App.FindCollectionByNameOrId("_superusers")
	if err != nil {
		log.Printf("Error finding admin collection: %v", err)
		return err
	}

	// Use TotalAdmins for a more direct check
	totalAdmins, err := e.App.CountRecords(adminCollection.Id)
	if err != nil {
		log.Printf("Error counting admins: %v", err)
		return err
	}

	if totalAdmins > 0 {
		log.Println("Superuser(s) already exist (admin@example.com / admin12345).")
		return e.Next() // Superuser exists, nothing more to do
	}

	record := core.NewRecord(adminCollection)
	record.Set("email", "admin@example.com")
	record.Set("password", "admin12345")

	if err := e.App.Save(record); err != nil {
		log.Printf("Error saving default admin: %v", err)
		return err
	}

	log.Println("Default superuser created successfully (admin@example.com / admin12345).")
	return e.Next()

}

func serveStaticFilesAndOpenBrowser(e *core.ServeEvent) error {
	staticFS, err := fs.Sub(staticFiles, "dist")
	if err != nil {
		log.Fatalf("Failed to create sub FS for static files: %v", err)
		return err
	}

	// Register the fallback route handler for static files
	e.Router.GET("/{path...}", func(e *core.RequestEvent) error {
		return staticHandler(staticFS, e.Response, e.Request)
	})

	// Open browser only in production mode after server starts
	if !e.App.IsDev() {
		openBrowser(e.App.Settings().Meta.AppURL)
	}

	return e.Next()
}
