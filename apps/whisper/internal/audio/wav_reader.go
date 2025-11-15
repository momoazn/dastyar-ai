package audio

import (
	"encoding/binary"
	"fmt"
	"os"
)

const (
	riffHeader      = "RIFF"
	waveHeader      = "WAVE"
	fmtChunkID      = "fmt "
	dataChunkID     = "data"
	pcmFormat       = 1
	bitsPerSample16 = 16
)

// LoadWAVMonoSamples reads a WAV file and returns the PCM data as float32 samples
// along with the detected sample rate and channel count.
func LoadWAVMonoSamples(path string) ([]float32, uint32, uint16, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, 0, 0, err
	}

	if len(data) < 12 {
		return nil, 0, 0, fmt.Errorf("invalid WAV file: header too short")
	}

	if string(data[0:4]) != riffHeader || string(data[8:12]) != waveHeader {
		return nil, 0, 0, fmt.Errorf("invalid WAV file: missing RIFF/WAVE headers")
	}

	offset := 12
	var (
		gotFmt        bool
		sampleRate    uint32
		numChannels   uint16
		bitsPerSample uint16
		audioFormat   uint16
		dataOffset    int
		dataSize      int
	)

	for offset+8 <= len(data) {
		chunkID := string(data[offset : offset+4])
		chunkSize := int(binary.LittleEndian.Uint32(data[offset+4 : offset+8]))
		offset += 8

		if offset+chunkSize > len(data) {
			return nil, 0, 0, fmt.Errorf("invalid WAV chunk %s exceeds file size", chunkID)
		}

		switch chunkID {
		case fmtChunkID:
			if chunkSize < 16 {
				return nil, 0, 0, fmt.Errorf("invalid fmt chunk size: %d", chunkSize)
			}
			audioFormat = binary.LittleEndian.Uint16(data[offset : offset+2])
			numChannels = binary.LittleEndian.Uint16(data[offset+2 : offset+4])
			sampleRate = binary.LittleEndian.Uint32(data[offset+4 : offset+8])
			bitsPerSample = binary.LittleEndian.Uint16(data[offset+14 : offset+16])
			gotFmt = true
		case dataChunkID:
			dataOffset = offset
			dataSize = chunkSize
			// Data chunk is typically last, but continue to validate remaining chunks if present.
		}

		offset += chunkSize
		if chunkSize%2 == 1 {
			offset++
		}
	}

	if !gotFmt {
		return nil, 0, 0, fmt.Errorf("invalid WAV file: missing fmt chunk")
	}

	if dataSize == 0 {
		return nil, 0, 0, fmt.Errorf("invalid WAV file: missing data chunk")
	}

	if audioFormat != pcmFormat {
		return nil, 0, 0, fmt.Errorf("unsupported WAV encoding: format code %d", audioFormat)
	}

	if bitsPerSample != bitsPerSample16 {
		return nil, 0, 0, fmt.Errorf("unsupported WAV bit depth: %d", bitsPerSample)
	}

	if dataOffset+dataSize > len(data) {
		return nil, 0, 0, fmt.Errorf("invalid WAV data chunk length")
	}

	sampleCount := dataSize / 2 // 16-bit samples
	samples := make([]float32, sampleCount)
	for i := 0; i < sampleCount; i++ {
		start := dataOffset + i*2
		value := int16(binary.LittleEndian.Uint16(data[start : start+2]))
		samples[i] = float32(value) / 32768.0
	}

	return samples, sampleRate, numChannels, nil
}
