# Dastyar AI

**AI-Powered Assistant for Persian/Farsi Language Processing**

Dastyar AI is a comprehensive, offline-capable AI platform featuring:
- 🎤 Speech-to-text transcription (Whisper)
- 💬 Local LLM integration (Ollama, LM Studio)
- 🎨 Image generation (Stable Diffusion)
- 📄 Document processing and RAG
- 🌐 Modern web interface (React 19)

---

## 🚀 Quick Start

### Development Mode

**Start all services**:
```bash
bun install
bun run dev
```

Access the application at `http://localhost:5173`

### Production Build

**Build for current platform**:
```bash
# Build all components
bun run build

# Start services
bun run start
```

**Cross-platform builds**:
```bash
# Build for Windows from Linux/macOS
bun run build:windows

# Build for all platforms
bun run build:all
```

See [CLAUDE.md](CLAUDE.md) for detailed build instructions and project guidelines.

---

## 🏗️ Architecture

### Components

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Server** | Bun + Hono + ORPC | API server, serves web UI |
| **Web** | React 19 + Vite + TanStack | User interface |
| **Whisper** | Go + whisper.cpp | Speech-to-text transcription |
| **Database** | SQLite + Drizzle ORM | Data persistence |

### External Services (Optional)

- **Ollama** - Local LLM (http://localhost:11434)
- **Stable Diffusion WebUI** - Image generation (http://localhost:7860)
- **LM Studio** - Alternative LLM (http://localhost:1234/v1)

---

## 🛠️ Development

### Prerequisites

- Bun 1.3.0+
- Go 1.23+ (for Whisper server)
- CMake (for Whisper server)

### Development Scripts

```bash
# Install dependencies
bun install

# Development mode
bun run dev              # All services
bun run dev:web          # Web UI only (port 5173)
bun run dev:server       # Server only (port 3000)
bun run dev:whisper      # Whisper only (port 8080)

# Type checking
bun run check-types

# Linting
bun run lint:check
bun run lint:fix

# Database
bun run db:push          # Push schema changes
bun run db:studio        # Open Drizzle Studio
bun run db:generate      # Generate migrations
```

### Project Structure

```
dastyar-ai/
├── apps/
│   ├── server/          # Bun/Hono API server
│   ├── web/             # React 19 frontend
│   └── whisper/         # Go Whisper server
├── scripts/             # Build & utility scripts
├── docs/                # Documentation
├── dist/                # Build output (gitignored)
├── CLAUDE.md            # Project guidelines
└── README.md            # This file
```

See [docs/PROJECT-STRUCTURE.md](docs/PROJECT-STRUCTURE.md) for complete directory structure.

---

## 📚 Documentation

### Available Documentation

- **[CLAUDE.md](CLAUDE.md)** - Project guidelines, structure, and coding conventions
- **[docs/PROJECT-STRUCTURE.md](docs/PROJECT-STRUCTURE.md)** - Detailed directory structure
- **[docs/TASKS.md](docs/TASKS.md)** - Production readiness task list
- **[docs/SECRETS.md](docs/SECRETS.md)** - Secrets management guide

### Build Scripts

Located in **[scripts/](scripts/)**:

**Core Scripts:**
- `build.ts` - Main build orchestrator (cross-platform)
- `start.ts` - Start all services
- `stop.ts` - Stop all services
- `status.ts` - Check service status

**Download Utilities:**
- `downloads/download-ffmpeg.ts` - Download FFmpeg binaries
- `downloads/download-model.ts` - Download Whisper models

**Testing:**
- See `apps/server/src/**/*.test.ts` for server tests
- See `apps/web/src/**/*.test.ts` for web tests

---

## 🔒 Security

### Default Configuration (Development)

- JWT_SECRET: Development default (⚠️ Change for production!)
- HOST: 127.0.0.1 (localhost only)
- CORS_ORIGIN: Localhost URLs only

### Production Recommendations

1. **Change JWT_SECRET**: Generate a strong secret (64+ characters recommended)
2. **Use Environment Variables**: Store secrets in environment variables (see [docs/SECRETS.md](docs/SECRETS.md))
3. **Use HTTPS**: Deploy behind a reverse proxy
4. **Configure Firewall**: Only expose necessary ports
5. **Regular Updates**: Keep components up to date

See [docs/SECRETS.md](docs/SECRETS.md) for comprehensive security guidelines and secrets management.

---

## 🎯 Features

- ✅ **Speech-to-Text**: Whisper-powered transcription
- ✅ **LLM Integration**: Ollama and LM Studio support
- ✅ **Image Generation**: Stable Diffusion integration
- ✅ **Document Processing**: PDF parsing and RAG
- ✅ **Multi-language**: Full Persian/Farsi support
- ✅ **Offline Mode**: No internet required after setup
- ✅ **Modern UI**: React 19 with Tailwind CSS
- ✅ **RESTful API**: ORPC with OpenAI-compatible endpoints

---

## 🤝 Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run linting: `bun run lint:fix`
5. Run type checking: `bun run check-types`
6. Test your changes
7. Submit a pull request

### Code Style

- Follow Biome/Ultracite rules (enforced automatically)
- Use TypeScript for type safety
- Write meaningful commit messages

---

## 📄 License

See [LICENSE](LICENSE) file for details.

---

## 🆘 Support

- **Documentation**: [docs/](docs/)
- **Project Guidelines**: [CLAUDE.md](CLAUDE.md)
- **Tasks & Roadmap**: [docs/TASKS.md](docs/TASKS.md)
- **Issues**: [GitHub Issues](https://github.com/mohammadhmn/persian-ai-assistant/issues)

---

## 🙏 Acknowledgments

Built with:
- [Whisper.cpp](https://github.com/ggerganov/whisper.cpp)
- [Bun](https://bun.sh/)
- [React](https://react.dev/)
- [Hono](https://hono.dev/)
- [Ollama](https://ollama.ai/)
- [Drizzle ORM](https://orm.drizzle.team/)

**Made with ❤️ for the Persian/Farsi community**
