# Configuration Management

Dastyar AI uses an intelligent configuration system that automatically adapts to development and production environments.

## Environment Detection

The system automatically detects the environment based on:

1. **Binary Execution**: If running as `dastyar-ai` binary → Production mode
2. **NODE_ENV**: If `NODE_ENV=production` → Production mode  
3. **Bun Hot Reload**: If `--hot` flag is present → Development mode
4. **Default**: Development mode for `bun run dev`

## Development vs Production Defaults

### Development Mode (`bun run dev`)
```typescript
{
  server: {
    host: "127.0.0.1",        // Local only
    port: 3000,
    corsOrigin: "http://localhost:3001"
  },
  whisper: {
    allowRemoteModels: true,   // Can download models
    modelsDir: "./whisper-models"
  },
  database: {
    file: "./apps/server/data.db"
  }
}
```

### Production Mode (Binary)
```typescript
{
  server: {
    host: "0.0.0.0",          // Accept all connections
    port: 3000,
    corsOrigin: "*"           // Allow all origins by default
  },
  whisper: {
    allowRemoteModels: false, // Offline by default
    modelsDir: "./whisper-models" // Relative to binary
  },
  database: {
    file: "./data.db"         // Next to binary
  }
}
```

## Configuration Priority

Configurations are merged in this order (highest priority first):

1. **Environment Variables** (e.g., `PORT`, `SERVER_PORT`)
2. **APP_CONFIG** environment variable pointing to JSON file
3. **config.json** next to binary (production) or workspace root (development)
4. **Default values** based on detected environment

## Configuration Commands

Generate a sample configuration file:
```bash
bun run config:generate [path]
```

Show current configuration:
```bash
bun run config:show
```

Validate current configuration:
```bash
bun run config:validate
```

## Configuration File Format

Create a `config.json` file to customize settings:

```json
{
  "server": {
    "port": 8080,
    "corsOrigin": "https://yourdomain.com",
    "host": "0.0.0.0"
  },
  "database": {
    "file": "./custom-data.db"
  },
  "whisper": {
    "allowRemoteModels": false,
    "allowedModels": ["Xenova/whisper-base", "Xenova/whisper-small"]
  },
  "ai": {
    "providers": {
      "openai": {
        "apiKey": "your-openai-api-key"
      },
      "groq": {
        "apiKey": "your-groq-api-key"
      }
    }
  },
  "stableDiffusion": {
    "url": "http://your-sd-server:7860",
    "enabled": true
  }
}
```

## Environment Variables

Common environment variables:

### Server Configuration
- `PORT` or `SERVER_PORT` - Server port (default: 3000)
- `HOST` - Server host (default: 127.0.0.1 in dev, 0.0.0.0 in prod)
- `CORS_ORIGIN` - CORS origin (default: localhost:3001 in dev, * in prod)

### AI Providers
- `OPENAI_API_KEY` - OpenAI API key
- `GROQ_API_KEY` - Groq API key  
- `GEMINI_API_KEY` - Google Gemini API key
- `OPENROUTER_API_KEY` - OpenRouter API key

### Paths and Storage
- `DATABASE_URL` - Database file path
- `WEB_DIST_DIR` - Web assets directory
- `MODELS_DIR` - Whisper models directory

### Services
- `STABLE_DIFFUSION_URL` - Stable Diffusion server URL (default: http://localhost:7860)
- `STABLE_DIFFUSION_ENABLED` - Enable/disable Stable Diffusion (default: true)

## Production Deployment

### 1. Build the Binary
```bash
bun run compile
```

### 2. Deploy with Configuration
```
dist/
├── dastyar-ai              # Compiled binary
├── config.json             # Optional configuration file
├── web/                    # Web assets (copied from build)
├── whisper-models/         # AI models (from prepare-offline)
├── wasm/                   # WASM files (copied during build)
└── data.db                 # SQLite database (created automatically)
```

### 3. Configuration Options

**Option A: Environment Variables**
```bash
export PORT=8080
export OPENAI_API_KEY="your-key"
./dastyar-ai
```

**Option B: Configuration File**
```bash
# Create config.json next to binary
echo '{"server":{"port":8080}}' > config.json
./dastyar-ai
```

**Option C: External Config**
```bash
export APP_CONFIG="/path/to/your/config.json"
./dastyar-ai
```

## Configuration Validation

The system validates configurations at startup:

- ✅ Port numbers (1-65535)
- ✅ Required directories exist (production)
- ✅ Database directory creation
- ✅ Whisper model directories

## Offline Support

In production mode, the app runs completely offline by default:

- `allowRemoteModels: false` - No internet required for Whisper models
- Pre-downloaded models in `whisper-models/` directory
- Pre-built WASM files in `wasm/` directory
- Self-contained web assets in `web/` directory

To enable offline support:
```bash
# Download models and prepare for offline use
bun run prepare-offline
```

## Troubleshooting

**Binary not detecting production mode?**
- Ensure binary is named `dastyar-ai`
- Set `NODE_ENV=production` explicitly

**Configuration not loading?**
- Check file permissions
- Validate JSON syntax
- Use `bun run config:validate` to debug

**Models not found?**
- Run `bun run prepare-offline` before deployment
- Check `whisper-models/` directory exists
- Verify model paths in configuration