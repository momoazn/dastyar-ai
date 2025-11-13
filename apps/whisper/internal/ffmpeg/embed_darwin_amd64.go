//go:build darwin && amd64

package ffmpeg

import _ "embed"

//go:embed bin/ffmpeg-darwin-amd64
var embeddedFFmpeg []byte
