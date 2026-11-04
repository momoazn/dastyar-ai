package audio

import (
	"context"
	"encoding/binary"
	"os"
	"os/exec"
	"path/filepath"
	"testing"
)

// buildWAV makes a PCM16 WAV file in memory.
func buildWAV(rate uint32, channels uint16, samples []int16) []byte {
	dataLen := uint32(len(samples) * 2)
	b := []byte("RIFF")
	b = binary.LittleEndian.AppendUint32(b, 36+dataLen)
	b = append(b, "WAVEfmt "...)
	b = binary.LittleEndian.AppendUint32(b, 16)
	b = binary.LittleEndian.AppendUint16(b, 1)
	b = binary.LittleEndian.AppendUint16(b, channels)
	b = binary.LittleEndian.AppendUint32(b, rate)
	b = binary.LittleEndian.AppendUint32(b, rate*uint32(channels)*2)
	b = binary.LittleEndian.AppendUint16(b, channels*2)
	b = binary.LittleEndian.AppendUint16(b, 16)
	b = append(b, "data"...)
	b = binary.LittleEndian.AppendUint32(b, dataLen)
	for _, s := range samples {
		b = binary.LittleEndian.AppendUint16(b, uint16(s))
	}
	return b
}

func writeTemp(t *testing.T, name string, data []byte) string {
	t.Helper()
	path := filepath.Join(t.TempDir(), name)
	if err := os.WriteFile(path, data, 0o600); err != nil {
		t.Fatal(err)
	}
	return path
}

func TestLoadWAVMonoSamples(t *testing.T) {
	path := writeTemp(t, "a.wav", buildWAV(16000, 1, []int16{0, 16384, -32768}))
	samples, rate, ch, err := LoadWAVMonoSamples(path)
	if err != nil {
		t.Fatal(err)
	}
	if rate != 16000 || ch != 1 {
		t.Errorf("rate=%d channels=%d", rate, ch)
	}
	want := []float32{0, 0.5, -1}
	if len(samples) != len(want) {
		t.Fatalf("got %d samples", len(samples))
	}
	for i := range want {
		if samples[i] != want[i] {
			t.Errorf("sample %d = %v, want %v", i, samples[i], want[i])
		}
	}
}

func TestLoadWAVMonoSamplesErrors(t *testing.T) {
	good := buildWAV(16000, 1, []int16{1, 2, 3, 4})

	notRiff := append([]byte(nil), good...)
	copy(notRiff, "XXXX")

	truncated := good[:len(good)-4]

	noData := append([]byte(nil), good[:36]...)

	floatFmt := append([]byte(nil), good...)
	binary.LittleEndian.PutUint16(floatFmt[20:], 3)

	bits24 := append([]byte(nil), good...)
	binary.LittleEndian.PutUint16(bits24[34:], 24)

	cases := map[string][]byte{
		"short":     []byte("RIFF"),
		"not riff":  notRiff,
		"truncated": truncated,
		"no data":   noData,
		"float":     floatFmt,
		"24 bit":    bits24,
	}
	for name, data := range cases {
		t.Run(name, func(t *testing.T) {
			if _, _, _, err := LoadWAVMonoSamples(writeTemp(t, "x.wav", data)); err == nil {
				t.Error("expected error")
			}
		})
	}

	if _, _, _, err := LoadWAVMonoSamples(filepath.Join(t.TempDir(), "none.wav")); err == nil {
		t.Error("expected error for missing file")
	}
}

func TestFormatHelpers(t *testing.T) {
	for _, name := range []string{"a.mp3", "A.WEBM", "x.y.m4a", "a.wav"} {
		if !IsSupportedFormat(name) {
			t.Errorf("IsSupportedFormat(%q) = false", name)
		}
	}
	for _, name := range []string{"", "a", "a.txt", "a.exe", "mp3", "a.mp3.exe"} {
		if IsSupportedFormat(name) {
			t.Errorf("IsSupportedFormat(%q) = true", name)
		}
	}
	if !IsWAVFile("a.WAV") || IsWAVFile("a.mp3") {
		t.Error("IsWAVFile wrong")
	}
}

func TestConvertToWAV(t *testing.T) {
	if _, err := exec.LookPath("ffmpeg"); err != nil {
		if _, err := os.Stat("./ffmpeg"); err != nil {
			t.Skip("ffmpeg not available")
		}
	}

	// A 44.1 kHz stereo file must come out as 16 kHz mono.
	stereo := make([]int16, 44100*2)
	for i := range stereo {
		stereo[i] = int16(i % 2000)
	}
	in := writeTemp(t, "-weird name.wav", buildWAV(44100, 2, stereo))
	out, err := ConvertToWAV(context.Background(), in)
	if err != nil {
		t.Fatal(err)
	}
	_, rate, ch, err := LoadWAVMonoSamples(out)
	if err != nil {
		t.Fatal(err)
	}
	if rate != 16000 || ch != 1 {
		t.Errorf("rate=%d channels=%d", rate, ch)
	}

	// Garbage input fails and leaves no output file.
	bad := writeTemp(t, "bad.mp3", []byte("not audio"))
	if _, err := ConvertToWAV(context.Background(), bad); err == nil {
		t.Fatal("expected error")
	}
	if _, err := os.Stat(filepath.Join(filepath.Dir(bad), "bad_converted.wav")); !os.IsNotExist(err) {
		t.Error("partial output left behind")
	}
}
