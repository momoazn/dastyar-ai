package main

import (
	"fmt"
	"os/exec"
	"runtime"
	"slices"
)

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

var thinkingModels = []string{"deepseek-r1", "deepscaler"}

func isThinkingModel(model string) bool {
	return slices.Contains(thinkingModels, model)
}
