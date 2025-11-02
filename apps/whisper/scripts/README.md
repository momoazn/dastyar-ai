# Whisper Model Downloader

A Go utility for downloading OpenAI Whisper models to use with the Whisper server.

## Features

- Download individual models or all models at once
- Resume interrupted downloads
- Check download status of all models
- Progress tracking for large model files
- Automatic checksum verification (when checksums are provided)
- No external dependencies beyond Go standard library

## Available Models

- **tiny** - Fastest, least accurate (~39 MB)
- **base** - Good balance of speed and accuracy (~74 MB)
- **small** - Better accuracy (~244 MB)
- **medium** - High accuracy (~769 MB)
- **large** - Highest accuracy (~1550 MB)
- **large-v2** - Improved large model (~1550 MB)
- **large-v3** - Latest and best large model (~1550 MB)

## Installation

### From Source

```bash
cd apps/whisper/scripts
go build -o whisper-downloader download_models.go
./whisper-downloader --help
```

### Using the Binary

The binary is already built at: `apps/whisper/scripts/whisper-downloader`

Simply run:
```bash
./whisper-downloader --help
```

## Usage

### List all models and their status
```bash
./whisper-downloader list
```

### Download a specific model
```bash
./whisper-downloader tiny
./whisper-downloader base
./whisper-downloader large-v3
```

### Download all models
```bash
./whisper-downloader all
```

## Model Storage

By default, models are stored in `./whisper-models` relative to where you run the command.

You can override this with the `WHISPER_MODELS_DIR` environment variable:
```bash
export WHISPER_MODELS_DIR=/path/to/custom/models
./whisper-downloader all
```

The Whisper Python server will automatically use models from this directory when configured with the `WHISPER_MODELS_DIR` environment variable.

## Files Downloaded

Each model downloads 4 essential files:
1. **model.bin** - The model weights
2. **config.json** - Model configuration
3. **tokenizer.json** - Tokenizer configuration
4. **vocab.txt** - Vocabulary file

These are the complete set of files required by the OpenAI Whisper Python package.

## Integration with Whisper Server

The downloaded models will be automatically discovered by the Whisper server if:

1. You run the downloader in the same directory as the Whisper server, OR
2. You set `WHISPER_MODELS_DIR` to point to the downloaded models directory, OR
3. You copy/link the `whisper-models` directory to the Whisper server's location

## Examples

```bash
# Check what's already downloaded
./whisper-downloader list

# Download just the tiny model (fastest)
./whisper-downloader tiny

# Download the large-v3 model (best quality)
./whisper-downloader large-v3

# Download all models (takes a while, ~3.7 GB total)
./whisper-downloader all

# Download to a specific directory
WHISPER_MODELS_DIR=/data/whisper-models ./whisper-downloader base
```

## Troubleshooting

### Download Fails
- Check your internet connection
- Verify you have write permissions to the target directory
- Ensure sufficient disk space (large models require 1-2 GB each)

### Model Not Found by Server
- Verify the model directory matches the `WHISPER_MODELS_DIR` environment variable
- Check that all 4 files were downloaded successfully
- Ensure the directory structure is: `whisper-models/<model-name>/`

### Permission Denied
- Make the binary executable: `chmod +x whisper-downloader`
- Run with appropriate permissions

## Requirements

- Go 1.21 or later (for building from source)
- Internet connection for downloading models
- ~3.7 GB disk space for all models

## Notes

- Downloads are done via HTTPS from Hugging Face's CDN
- Large files show progress indicators
- Failed downloads can be retried - existing files are skipped
- Atomic file writes prevent corrupted downloads
