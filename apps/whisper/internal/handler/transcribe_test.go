package handler

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"whisper/internal/stt"
)

type fakeTranscriber struct {
	result *stt.Result
	err    error
	gotOpt stt.Options
	gotErr error // error from reading the temp file
	calls  int
}

func (f *fakeTranscriber) Transcribe(_ context.Context, path string, opts stt.Options) (*stt.Result, error) {
	f.calls++
	f.gotOpt = opts
	if _, err := os.Stat(path); err != nil {
		f.gotErr = err
	}
	return f.result, f.err
}

func (f *fakeTranscriber) ListModels() ([]stt.ModelInfo, error) {
	return []stt.ModelInfo{{ID: "ggml-base.bin"}}, f.err
}

func newHandler(t *testing.T, f *fakeTranscriber) (*TranscribeHandler, string) {
	t.Helper()
	dir := filepath.Join(t.TempDir(), "temp")
	h, err := NewTranscribeHandler(f, dir)
	if err != nil {
		t.Fatal(err)
	}
	return h, dir
}

func multipartRequest(t *testing.T, filename string, content []byte, fields map[string]string) *http.Request {
	t.Helper()
	var body bytes.Buffer
	mw := multipart.NewWriter(&body)
	if filename != "" {
		fw, err := mw.CreateFormFile("file", filename)
		if err != nil {
			t.Fatal(err)
		}
		_, _ = fw.Write(content)
	}
	for k, v := range fields {
		_ = mw.WriteField(k, v)
	}
	_ = mw.Close()
	req := httptest.NewRequest(http.MethodPost, "/v1/audio/transcriptions", &body)
	req.Header.Set("Content-Type", mw.FormDataContentType())
	return req
}

func do(h *TranscribeHandler, req *http.Request) *httptest.ResponseRecorder {
	rec := httptest.NewRecorder()
	h.HandleOpenAITranscriptions(rec, req)
	return rec
}

func tempEntries(t *testing.T, dir string) int {
	t.Helper()
	entries, err := os.ReadDir(dir)
	if err != nil {
		t.Fatal(err)
	}
	return len(entries)
}

func TestTranscribeSuccessAndCleanup(t *testing.T) {
	f := &fakeTranscriber{result: &stt.Result{Text: "hello"}}
	h, dir := newHandler(t, f)
	rec := do(h, multipartRequest(t, "a.MP3", []byte("x"), map[string]string{
		"model": "ggml-small.bin", "language": " FA ", "task": "translate", "temperature": "0.2",
	}))
	if rec.Code != 200 || !strings.Contains(rec.Body.String(), `"text":"hello"`) {
		t.Fatalf("code=%d body=%s", rec.Code, rec.Body)
	}
	if f.gotErr != nil {
		t.Errorf("temp file missing during call: %v", f.gotErr)
	}
	want := stt.Options{Model: "ggml-small.bin", Language: "fa", Translate: true, Temperature: 0.2}
	if f.gotOpt != want {
		t.Errorf("opts = %+v, want %+v", f.gotOpt, want)
	}
	if n := tempEntries(t, dir); n != 0 {
		t.Errorf("%d temp files left", n)
	}
}

func TestTranscribeErrorsCleanUp(t *testing.T) {
	cases := []struct {
		name string
		err  error
		code int
	}{
		{"invalid input", fmt.Errorf("x: %w", stt.ErrInvalidInput), 400},
		{"no speech", stt.ErrNoSpeech, 422},
		{"other", errors.New("boom"), 500},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			h, dir := newHandler(t, &fakeTranscriber{err: c.err})
			rec := do(h, multipartRequest(t, "a.wav", []byte("x"), nil))
			if rec.Code != c.code {
				t.Errorf("code = %d, want %d", rec.Code, c.code)
			}
			if !strings.Contains(rec.Body.String(), `"error"`) {
				t.Errorf("body = %s", rec.Body)
			}
			if n := tempEntries(t, dir); n != 0 {
				t.Errorf("%d temp files left", n)
			}
		})
	}
}

func TestTranscribeRejectsBadRequests(t *testing.T) {
	cases := []struct {
		name     string
		filename string
		fields   map[string]string
		code     int
	}{
		{"no file", "", nil, 400},
		{"bad extension", "a.exe", nil, 400},
		{"no extension", "audio", nil, 400},
		{"bad temperature", "a.wav", map[string]string{"temperature": "abc"}, 400},
		{"temperature too high", "a.wav", map[string]string{"temperature": "2"}, 400},
		{"temperature NaN", "a.wav", map[string]string{"temperature": "NaN"}, 400},
		{"bad format", "a.wav", map[string]string{"response_format": "xml"}, 400},
		{"model traversal", "a.wav", map[string]string{"model": "../../etc/x.bin"}, 400},
		{"model no suffix", "a.wav", map[string]string{"model": "base"}, 400},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			f := &fakeTranscriber{result: &stt.Result{Text: "x"}}
			h, dir := newHandler(t, f)
			rec := do(h, multipartRequest(t, c.filename, []byte("x"), c.fields))
			if rec.Code != c.code {
				t.Errorf("code = %d, want %d (%s)", rec.Code, c.code, rec.Body)
			}
			if f.calls != 0 {
				t.Error("transcriber was called")
			}
			if n := tempEntries(t, dir); n != 0 {
				t.Errorf("%d temp files left", n)
			}
		})
	}
}

func TestTranscribeMethodNotAllowed(t *testing.T) {
	h, _ := newHandler(t, &fakeTranscriber{})
	rec := httptest.NewRecorder()
	h.HandleOpenAITranscriptions(rec, httptest.NewRequest(http.MethodGet, "/", nil))
	if rec.Code != http.StatusMethodNotAllowed {
		t.Errorf("code = %d", rec.Code)
	}
}

func TestTranscribeUploadTooLarge(t *testing.T) {
	f := &fakeTranscriber{result: &stt.Result{Text: "x"}}
	h, dir := newHandler(t, f)
	h.maxUpload = 1024
	rec := do(h, multipartRequest(t, "a.wav", bytes.Repeat([]byte("a"), 4096), nil))
	if rec.Code != http.StatusRequestEntityTooLarge {
		t.Errorf("code = %d, want 413", rec.Code)
	}
	if f.calls != 0 || tempEntries(t, dir) != 0 {
		t.Error("work done for an oversized upload")
	}
}

func TestResponseFormats(t *testing.T) {
	res := &stt.Result{
		Text:     "hi there",
		Language: "en",
		Duration: 2.5,
		Task:     "transcribe",
		Segments: []stt.Segment{{Start: 0, End: 1.5, Text: " hi "}, {Start: 1.5, End: 3725.25, Text: "there"}},
	}
	cases := map[string]string{
		"text":         "hi there",
		"srt":          "1\n00:00:00,000 --> 00:00:01,500\nhi\n\n2\n00:00:01,500 --> 01:02:05,250\nthere",
		"vtt":          "WEBVTT\n\n00:00:00.000 --> 00:00:01.500\nhi\n\n00:00:01.500 --> 01:02:05.250\nthere",
		"verbose_json": `"segments"`,
	}
	for format, want := range cases {
		t.Run(format, func(t *testing.T) {
			h, _ := newHandler(t, &fakeTranscriber{result: res})
			rec := do(h, multipartRequest(t, "a.wav", []byte("x"), map[string]string{"response_format": format}))
			if rec.Code != 200 {
				t.Fatalf("code = %d: %s", rec.Code, rec.Body)
			}
			if format == "verbose_json" {
				if !strings.Contains(rec.Body.String(), want) {
					t.Errorf("body = %s", rec.Body)
				}
			} else if rec.Body.String() != want {
				t.Errorf("body = %q, want %q", rec.Body.String(), want)
			}
		})
	}
}

func TestFormatEmptySegments(t *testing.T) {
	blank := []stt.Segment{{Text: "  "}}
	if got := formatSRT(blank); got != "" {
		t.Errorf("srt = %q", got)
	}
	if got := formatVTT(blank); got != "WEBVTT" {
		t.Errorf("vtt = %q", got)
	}
}

func TestStartupRemovesStaleUploads(t *testing.T) {
	dir := t.TempDir()
	stale := filepath.Join(dir, "upload-123.mp3")
	keep := filepath.Join(dir, "keep.txt")
	_ = os.WriteFile(stale, nil, 0o600)
	_ = os.WriteFile(keep, nil, 0o600)
	if _, err := NewTranscribeHandler(&fakeTranscriber{}, dir); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(stale); !os.IsNotExist(err) {
		t.Error("stale upload not removed")
	}
	if _, err := os.Stat(keep); err != nil {
		t.Error("unrelated file removed")
	}
}

func TestModels(t *testing.T) {
	h, _ := newHandler(t, &fakeTranscriber{})
	rec := httptest.NewRecorder()
	h.HandleOpenAIModels(rec, httptest.NewRequest(http.MethodGet, "/v1/models", nil))
	if rec.Code != 200 || !strings.Contains(rec.Body.String(), "ggml-base.bin") {
		t.Errorf("code=%d body=%s", rec.Code, rec.Body)
	}
	rec = httptest.NewRecorder()
	h.HandleOpenAIModels(rec, httptest.NewRequest(http.MethodPost, "/v1/models", nil))
	if rec.Code != http.StatusMethodNotAllowed {
		t.Errorf("code = %d", rec.Code)
	}
}
