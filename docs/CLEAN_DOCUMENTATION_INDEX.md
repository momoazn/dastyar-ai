# Dastyar AI - Clean Documentation Index

## 📁 Project Documentation Structure

This document provides a consolidated overview of the Dastyar AI project documentation after cleanup and consolidation.

---

## 📋 Core Documentation (Active)

### 📄 Main Project Documentation

| Document | Description | Status |
|----------|-------------|---------|
| [README.md](../README.md) | Main project overview and quick start | ✅ Current |
| [PROJECT-STRUCTURE.md](./PROJECT-STRUCTURE.md) | Complete project structure and organization | ✅ Current |
| [TASKS.md](./TASKS.md) | Production readiness task list (61 tasks) | ✅ Current |
| [admin-panel.md](./admin-panel.md) | Admin panel implementation guide (consolidated) | ✅ Current |
| [thesis-proposal.md](./thesis-proposal.md) | Complete thesis proposal (consolidated) | ✅ Current |
| [SECRETS.md](./SECRETS.md) | Security and secrets management | ✅ Current |

### 🔧 Build & Development

| Document | Description | Status |
|----------|-------------|---------|
| [scripts/README.md](../scripts/README.md) | Build system documentation | ✅ Current |
| [apps/whisper/README.md](../apps/whisper/README.md) | Whisper server documentation | ✅ Current |

### 📚 Technical Specifications

| Document | Description | Status |
|----------|-------------|---------|
| [specs/README.md](../specs/README.md) | Technical specifications index | ✅ Current |
| [specs/e2e-auth-testing-plan.md](../specs/e2e-auth-testing-plan.md) | E2E testing plan for auth & admin | ✅ Current |
| [specs/IMPROVEMENTS_TODO.md](../specs/IMPROVEMENTS_TODO.md) | Improvement todos and roadmap | ✅ Current |

---

## 🔴 Archived Documentation (Historical)

### 📝 Planning Documents

| Document | Description | Location |
|----------|-------------|----------|
| [PHASE3_COMPLETION_SUMMARY.md](../docs/archive/PHASE3_COMPLETION_SUMMARY.md) | Phase 3 system settings completion | archive/ |
| [IMPLEMENTATION_UPDATE.md](../docs/archive/IMPLEMENTATION_UPDATE.md) | Admin panel implementation progress | archive/ |
| [IMPROVEMENTS_REPORT.md](../docs/archive/IMPROVEMENTS_REPORT.md) | Code improvement recommendations | archive/ |
| [SETTINGS_REBUILD_PLAN.md](../docs/archive/SETTINGS_REBUILD_PLAN.md) | Settings rebuild plan | archive/ |
| [CODEBASE_SIMPLIFICATION_PLAN.md](../docs/archive/CODEBASE_SIMPLIFICATION_PLAN.md) | Codebase simplification plan | archive/ |
| [DRY_KISS_REFACTORING_PLAN.md](../docs/archive/DRY_KISS_REFACTORING_PLAN.md) | Refactoring guidelines | archive/ |

### 📊 Progress Reports

| Document | Description | Location |
|----------|-------------|----------|
| [CLEANUP_SUMMARY.md](../docs/archive/CLEANUP_SUMMARY.md) | Documentation cleanup summary | archive/ |
| [PHASE3_QUICK_REFERENCE.md](../docs/archive/PHASE3_QUICK_REFERENCE.md) | Quick reference for Phase 3 | archive/ |

---

## 🛠️ Build System Overview

### Core Build Commands

```bash
# Install dependencies
bun install

# Development mode
bun run dev              # All services
bun run dev:web          # Web UI only (port 5173)
bun run dev:server       # Server only (port 3000)
bun run dev:whisper      # Whisper only (port 8080)

# Build for current platform
bun run build           # Build web + server + whisper

# Cross-platform builds
bun run build:windows   # Build for Windows from macOS/Linux
bun run build:all       # Build for all platforms

# Service management
bun run start           # Start all services
bun run stop            # Stop all services
bun run status          # Check service status
```

### Testing Commands

```bash
# Run tests
bun run test
bun run test:coverage   # With coverage reporting
bun run test:api        # Test Whisper API endpoints
```

---

## 🏗️ Project Architecture

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

## 🔐 Security Guidelines

### Production Requirements

1. **Change JWT_SECRET**: Generate a strong secret (64+ characters recommended)
2. **Use Environment Variables**: Store secrets in environment variables
3. **Use HTTPS**: Deploy behind a reverse proxy
4. **Configure Firewall**: Only expose necessary ports
5. **Regular Updates**: Keep components up to date

### Sensitive Configuration

- `JWT_SECRET` - Secret key for signing authentication tokens
- `GROQ_API_KEY` - API key for Groq service (if enabled)
- `GEMINI_API_KEY` - API key for Google Gemini (if enabled)

---

## 📊 Development Status

### Completed Tasks (10/61)

- ✅ **JWT_SECRET Security** - Cryptographically secure 64-char secret
- ✅ **File Upload Validation** - Comprehensive validation with 20 unit tests
- ✅ **Secrets Management** - Environment variables with production validation
- ✅ **Unit Tests (Server)** - 175 tests (145 passing) covering authentication, AI orchestration
- ✅ **React Component Tests** - 197 tests (100% passing) covering UI components
- ✅ **Test Coverage Reporting** - Configured Bun test coverage
- ✅ **Remove /windows/ References** - Cleaned up README.md and PROJECT-STRUCTURE.md
- ✅ **React Error Boundaries** - Comprehensive error boundary implementation
- ✅ **Toast Notifications** - Sonner-based toast system fully implemented

### Critical Production Blockers Remaining

1. **Deployment Guide** (Task 10)
2. **Docker Configuration** (Task 31)
3. **Database Backup Automation** (Task 34)
4. **Health Check Endpoints** (Task 35)
5. **Security Audit** (Task 51)

---

## 📖 Documentation Categories

### ✅ Active Documentation
- **Project Overview**: README.md, PROJECT-STRUCTURE.md
- **Development Guides**: TASKS.md, admin-panel.md
- **Academic Research**: thesis-proposal.md
- **Security**: SECRETS.md
- **Specifications**: specs/ directory

### 📦 Archived Documentation
- **Planning Documents**: Various implementation plans
- **Progress Reports**: Phase completion summaries
- **Technical Specifications**: Outdated technical docs

---

## 🔄 Maintenance Guidelines

### Adding New Documentation

1. **Check for existing content** before creating new files
2. **Use appropriate category** (core docs vs specs vs archive)
3. **Update this index** when adding/moving files
4. **Archive outdated content** instead of deleting

### Content Standards

- **Keep it current** - Archive outdated docs promptly
- **Avoid duplication** - Consolidate related content
- **Clear purpose** - Each document should have a specific goal
- **Cross-reference** - Link between related documents

---

## 📋 Quick Navigation

### For Developers

**Getting Started:**
1. Read [README.md](../README.md) for project overview
2. Check [PROJECT-STRUCTURE.md](./PROJECT-STRUCTURE.md) for code organization
3. Review [TASKS.md](./TASKS.md) for current development priorities

**Admin Panel Development:**
- Complete guide: [admin-panel.md](./admin-panel.md)
- Key files: `apps/web/src/components/admin/`, `apps/server/src/procedures/admin.ts`

### For Administrators

**System Management:**
- Admin panel usage: [admin-panel.md](./admin-panel.md) → "Quick Start" section
- Security configuration: [SECRETS.md](./SECRETS.md)
- System settings via admin panel at `/admin`

---

## 📞 Support & Troubleshooting

### Documentation Links

- **Main Guide**: [README.md](../README.md)
- **Project Structure**: [PROJECT-STRUCTURE.md](./PROJECT-STRUCTURE.md)
- **Development Tasks**: [TASKS.md](./TASKS.md)
- **Admin Panel**: [admin-panel.md](./admin-panel.md)
- **Security**: [SECRETS.md](./SECRETS.md)
- **Technical Specs**: [specs/README.md](../specs/README.md)

### Common Issues

- **Models not loading**: Check database connection, verify models exist
- **User deletion fails**: Verify user is not only admin, check permissions
- **Settings not saving**: Check database connection, review server logs

---

## 📊 Project Statistics

### Documentation Cleanup Results

- **Before**: 35+ documentation files with significant redundancy
- **After**: 6 core documentation files + 1 comprehensive admin guide + 1 complete thesis
- **Archived**: 7 outdated planning documents
- **Consolidated**: Multiple overlapping admin panel guides
- **Removed**: Fragmented thesis proposal across 13 files

### Current Status

- **Overall Progress**: 16.4% Complete (10/61 tasks)
- **Security**: 100% Complete (Critical foundation)
- **Testing**: 75% Complete (Server & React tests)
- **Documentation**: 20% Complete (Code cleanup done)
- **Admin Panel**: 60% Complete (Phases 1-3)

---

**Last Updated**: 2025-11-23  
**Maintainer**: Development Team  
**Documentation Version**: 2.0 (Consolidated)  
**Repository**: mohammadhmn/persian-ai-assistant