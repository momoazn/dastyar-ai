# Offline Configuration Guide

This guide explains how to configure Dastyar AI for offline use, including all the new offline-specific features and settings.

## Overview

Dastyar AI now supports comprehensive offline configuration with automatic detection, validation, and optimized settings for offline environments.

## Configuration Structure

### New Offline Configuration Section

```json
{
  "offline": {
    "enabled": false,
    "autoDetect": true,
    "services": {
      "ollama": {
        "required": true,
        "autoStart": false
      },
      "lmstudio": {
        "required": false,
        "autoStart": false
      },
      "stableDiffusion": {
        "required": false,
        "autoStart": false
      }
    },
    "models": {
      "autoDownload": false,
      "preferredModel": "Xenova/whisper-tiny",
      "cacheStrategy": "conservative"
    },
    "storage": {
      "validatePaths": true,
      "createDirectories": true,
      "cleanupOrphanedFiles": true
    }
  }
}
```

## Configuration Options

### Offline Mode Settings

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `false` | Explicitly enable offline mode |
| `autoDetect` | boolean | `true` | Automatically detect offline capabilities |

### Service Configuration

#### Ollama
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `required` | boolean | `true` | Whether Ollama is required for offline mode |
| `autoStart` | boolean | `false` | Attempt to auto-start Ollama service |

#### LMStudio
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `required` | boolean | `false` | Whether LMStudio is required for offline mode |
| `autoStart` | boolean | `false` | Attempt to auto-start LMStudio service |

#### Stable Diffusion
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `required` | boolean | `false` | Whether Stable Diffusion is required for offline mode |
| `autoStart` | boolean | `false` | Attempt to auto-start Stable Diffusion service |

### Model Management

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `autoDownload` | boolean | `false` | Automatically download models on startup |
| `preferredModel` | string | `"Xenova/whisper-tiny"` | Default model to use |
| `cacheStrategy` | enum | `"conservative"` | Cache strategy: `aggressive`, `conservative`, `disabled` |

### Storage Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `validatePaths` | boolean | `true` | Validate file system paths on startup |
| `createDirectories` | boolean | `true` | Auto-create missing directories |
| `cleanupOrphanedFiles` | boolean | `true` | Clean up orphaned files automatically |

## Configuration Profiles

### Pure Offline Mode

```json
{
  "offline": {
    "enabled": true,
    "autoDetect": false,
    "services": {
      "ollama": { "required": true, "autoStart": true },
      "lmstudio": { "required": false, "autoStart": false },
      "stableDiffusion": { "required": true, "autoStart": true }
    },
    "models": {
      "autoDownload": true,
      "preferredModel": "Xenova/whisper-tiny",
      "cacheStrategy": "aggressive"
    }
  },
  "ai": {
    "providers": {
      "ollama": { "enabled": true },
      "lmstudio": { "enabled": false },
      "openai": { "enabled": false },
      "groq": { "enabled": false },
      "gemini": { "enabled": false },
      "openrouter": { "enabled": false }
    }
  }
}
```

### Hybrid Mode (Online + Offline Fallback)

```json
{
  "offline": {
    "enabled": false,
    "autoDetect": true,
    "services": {
      "ollama": { "required": false, "autoStart": false },
      "lmstudio": { "required": false, "autoStart": false },
      "stableDiffusion": { "required": false, "autoStart": false }
    },
    "models": {
      "autoDownload": false,
      "preferredModel": "Xenova/whisper-tiny",
      "cacheStrategy": "conservative"
    }
  },
  "ai": {
    "providers": {
      "ollama": { "enabled": true },
      "openai": { "enabled": true },
      "groq": { "enabled": true }
    }
  }
}
```

## Setup Instructions

### 1. Generate Sample Configuration

```bash
cd apps/server
bun run config:generate
```

### 2. Configure for Offline Use

Edit the generated `config.json` file with your preferred offline settings.

### 3. Validate Configuration

```bash
bun run config:validate
```

### 4. Prepare Offline Resources

```bash
bun run prepare-offline
```

### 5. Check Offline Status

```bash
bun run config:show
```

## Automatic Features

### Mode Detection

The system automatically detects the current mode based on:

- Explicit `offline.enabled` setting
- Available AI providers
- Service availability checks

### Service Availability Checks

The system performs health checks on:

- Ollama API (`/api/tags`)
- LMStudio API (`/v1/models`)
- Stable Diffusion API (`/internal/ping`)

### Path Validation

Automatically validates and creates necessary directories:

- Database directory
- Whisper models directory
- Cache directory
- Generated images directory

### Orphaned File Cleanup

Automatically removes files that don't have corresponding database records.

## Troubleshooting

### Common Issues

#### "Offline mode is enabled but no offline AI providers are configured"

**Solution**: Enable at least one offline provider (Ollama or LMStudio) in the configuration.

#### "Ollama is required but not available"

**Solution**:
1. Ensure Ollama is installed and running
2. Check that the `baseUrl` in configuration matches Ollama's actual URL
3. Verify Ollama has the required models installed

#### "Directory does not exist"

**Solution**: The system will auto-create directories if `createDirectories` is enabled. If disabled, manually create the required directories.

### Validation Commands

```bash
# Validate configuration
bun run config:validate

# Show current configuration
bun run config:show

# Generate new sample config
bun run config:generate ./new-config.json
```

## Advanced Configuration

### Custom Model Configuration

```json
{
  "whisper": {
    "allowedModels": [
      "Xenova/whisper-tiny",
      "Xenova/whisper-base",
      "Xenova/whisper-small"
    ]
  },
  "offline": {
    "models": {
      "preferredModel": "Xenova/whisper-base"
    }
  }
}
```

### Performance Optimization

```json
{
  "offline": {
    "models": {
      "cacheStrategy": "aggressive"
    },
    "storage": {
      "cleanupOrphanedFiles": true
    }
  }
}
```

## Migration from Previous Versions

If upgrading from a version without offline configuration:

1. Generate a new sample configuration
2. Copy your existing settings
3. Add the new `offline` section
4. Run validation to ensure compatibility

## API Integration

The offline configuration is accessible through the configuration API:

```typescript
import { getOfflineStatus, validateOfflineConfig } from './config';

// Get current offline status
const status = await getOfflineStatus();
console.log('Mode:', status.mode);
console.log('Services:', status.services);
console.log('Ready:', status.isReady);

// Validate configuration
const validation = validateOfflineConfig();
if (!validation.isValid) {
  console.error('Configuration errors:', validation.errors);
}
```

## Best Practices

1. **Start with Auto-Detection**: Use `autoDetect: true` for initial setup
2. **Enable Required Services**: Set `required: true` for services you need
3. **Use Conservative Caching**: Start with `cacheStrategy: "conservative"`
4. **Regular Validation**: Run `config:validate` after changes
5. **Monitor Storage**: Keep an eye on disk usage with large model collections

## Support

For issues with offline configuration:

1. Check the validation output: `bun run config:validate`
2. Review the configuration: `bun run config:show`
3. Ensure all required services are running
4. Check file system permissions for configured directories