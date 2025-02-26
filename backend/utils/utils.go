package utils

import (
	"fmt"
	"os/exec"
	"runtime"
	"strings"
)

func OpenBrowser(serverAddr string) {
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

func IsThinkingModel(model string) bool {
	for _, m := range thinkingModels {
		if strings.Contains(model, m) {
			return true
		}
	}
	return false
}
