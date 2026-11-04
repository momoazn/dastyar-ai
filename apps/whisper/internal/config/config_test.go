package config

import (
	"os"
	"path/filepath"
	"testing"
)

func TestFirstModelName(t *testing.T) {
	cases := map[string]string{
		"":                              "",
		" , ,":                          "",
		"ggml-base.bin":                 "ggml-base.bin",
		" ggml-small.bin , ggml-b.bin ": "ggml-small.bin",
		",ggml-b.bin":                   "ggml-b.bin",
	}
	for in, want := range cases {
		if got := FirstModelName(in); got != want {
			t.Errorf("FirstModelName(%q) = %q, want %q", in, got, want)
		}
	}
}

func TestPortFromURL(t *testing.T) {
	cases := map[string]string{
		"http://localhost:8081":   "8081",
		"http://127.0.0.1:9000/x": "9000",
		"http://localhost":        "",
		"":                        "",
		"http://[::1]:7000":       "7000",
		"://bad":                  "",
	}
	for in, want := range cases {
		if got := PortFromURL(in); got != want {
			t.Errorf("PortFromURL(%q) = %q, want %q", in, got, want)
		}
	}
}

func TestLoadDefaultsWhenNoFile(t *testing.T) {
	cfg, err := Load([]string{filepath.Join(t.TempDir(), "missing.json")})
	if err != nil {
		t.Fatal(err)
	}
	want := Config{Port: "8080", ModelDir: "./models", ModelName: "ggml-base.bin"}
	if cfg != want {
		t.Errorf("got %+v, want %+v", cfg, want)
	}
}

func TestLoadFromFile(t *testing.T) {
	path := filepath.Join(t.TempDir(), "config.json")
	data := `{"WHISPER_MODEL_DIR":"/m","WHISPER_MODELS":"a.bin,b.bin","WHISPER_SERVER_URL":"http://localhost:9001","OTHER":1}`
	if err := os.WriteFile(path, []byte(data), 0o600); err != nil {
		t.Fatal(err)
	}
	cfg, err := Load([]string{"missing.json", path})
	if err != nil {
		t.Fatal(err)
	}
	want := Config{Port: "9001", ModelDir: "/m", ModelName: "a.bin"}
	if cfg != want {
		t.Errorf("got %+v, want %+v", cfg, want)
	}
}

func TestLoadInvalidJSON(t *testing.T) {
	path := filepath.Join(t.TempDir(), "config.json")
	if err := os.WriteFile(path, []byte("{not json"), 0o600); err != nil {
		t.Fatal(err)
	}
	if _, err := Load([]string{path}); err == nil {
		t.Fatal("expected error for invalid JSON")
	}
}
