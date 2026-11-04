package stt

import "testing"

func TestValidModelName(t *testing.T) {
	valid := []string{"ggml-base.bin", "ggml-large-v3.bin", "a.bin"}
	invalid := []string{
		"", "ggml-base", "ggml-base.bin.exe", "../ggml-base.bin", "a/b.bin",
		`a\b.bin`, "..bin", "x..y.bin", "/etc/passwd.bin", "a\x00.bin",
	}
	for _, name := range valid {
		if !ValidModelName(name) {
			t.Errorf("ValidModelName(%q) = false, want true", name)
		}
	}
	for _, name := range invalid {
		if ValidModelName(name) {
			t.Errorf("ValidModelName(%q) = true, want false", name)
		}
	}
}
