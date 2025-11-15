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

### For Windows Users

**Want to USE the application?**
→ See **[windows/docs/WINDOWS-README.md](windows/docs/WINDOWS-README.md)** - User guide

**Want to BUILD/DEPLOY the application?**
→ See **[windows/docs/WINDOWS-DEPLOYMENT-GUIDE.md](windows/docs/WINDOWS-DEPLOYMENT-GUIDE.md)** - Complete deployment guide

**Quick reference?**
→ See **[windows/docs/WINDOWS-QUICK-START.txt](windows/docs/WINDOWS-QUICK-START.txt)** - Quick start card

### For Developers

**Development mode**:
```bash
bun install
bun run dev
```

**Building on Windows**:
```cmd
cd windows/scripts
check-build-prerequisites.bat
build-all-windows.bat
```

---

## 📦 Windows Deployment

### Quick Build (3 Commands)

```cmd
# 1. Verify prerequisites
cd windows\scripts
check-build-prerequisites.bat

# 2. Build everything
build-all-windows.bat

# 3. Test the build
cd ..\..\dist
..\windows\scripts\verify-installation.bat
..\windows\scripts\start-dastyar-ai.bat
```

### Distribution Package

**Self-contained Windows application** with:
- ✅ No internet required (after setup)
- ✅ No external dependencies
- ✅ ~140-200MB (without models)
- ✅ Portable - copy and run

See **[windows/docs/](windows/docs/)** for complete documentation.

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
├── scripts/             # Build scripts
├── windows/             # Windows-specific files
│   ├── scripts/         # Windows batch scripts
│   └── docs/            # Windows documentation
├── docs/                # General documentation
├── dist/                # Build output (gitignored)
└── README.md           # This file
```

---

## 📚 Documentation

### Windows Deployment

Located in **[windows/docs/](windows/docs/)**:

- **[WINDOWS-DEPLOYMENT-GUIDE.md](windows/docs/WINDOWS-DEPLOYMENT-GUIDE.md)** - Complete deployment guide
- **[DEPLOYMENT-CHECKLIST.md](windows/docs/DEPLOYMENT-CHECKLIST.md)** - Step-by-step checklist
- **[WINDOWS-BUILD.md](windows/docs/WINDOWS-BUILD.md)** - Technical build details
- **[WINDOWS-README.md](windows/docs/WINDOWS-README.md)** - End-user guide
- **[WINDOWS-QUICK-START.txt](windows/docs/WINDOWS-QUICK-START.txt)** - Quick reference
- **[WINDOWS-DEPLOYMENT-SUMMARY.md](windows/docs/WINDOWS-DEPLOYMENT-SUMMARY.md)** - Overview

### Windows Scripts

Located in **[windows/scripts/](windows/scripts/)**:

**Build Scripts:**
- `check-build-prerequisites.bat` - Verify build environment
- `build-all-windows.bat` - Build entire application
- `dist-windows.bat` - Assemble distribution package

**User Scripts:**
- `start-dastyar-ai.bat` - Launch application
- `stop-dastyar-ai.bat` - Stop services
- `check-health.bat` - Health check
- `configure.bat` - Configuration helper
- `download-whisper-models.bat` - Download Whisper models
- `verify-installation.bat` - Verify installation

---

## 🔒 Security

### Default Configuration (Development)

- JWT_SECRET: Development default (⚠️ Change for production!)
- HOST: 127.0.0.1 (localhost only)
- CORS_ORIGIN: Localhost URLs only

### Production Recommendations

1. **Change JWT_SECRET**: Use `configure.bat` to set a strong secret (32+ characters)
2. **Use HTTPS**: Deploy behind a reverse proxy
3. **Configure Firewall**: Only expose necessary ports
4. **Regular Updates**: Keep components up to date

See [windows/docs/WINDOWS-README.md](windows/docs/WINDOWS-README.md#security-considerations) for details.

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

- **Documentation**: [windows/docs/](windows/docs/)
- **Issues**: [GitHub Issues](https://github.com/yourusername/dastyar-ai/issues)
- **Troubleshooting**: [WINDOWS-DEPLOYMENT-GUIDE.md](windows/docs/WINDOWS-DEPLOYMENT-GUIDE.md#troubleshooting)

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
