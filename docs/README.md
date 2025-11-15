# Documentation Index

This directory contains all project documentation organized by feature and domain.

## Transcription System

The transcription system allows users to transcribe audio in Farsi or English using OpenAI's Whisper API with WhisperX or standard Whisper engines.

### Core Documentation
- **[transcription-guide.md](./transcription-guide.md)** - Quick start guide and system overview
  - User guide for the transcription UI
  - Supported languages and models
  - System architecture at a glance

- **[transcription-architecture.md](./transcription-architecture.md)** - Detailed technical architecture
  - Three-layer system design (Web/Server/Whisper API)
  - Data flow and component relationships
  - Deployment considerations

- **[transcription-api.md](./transcription-api.md)** - API reference
  - ORPC endpoint specifications
  - Request/response schemas
  - Model management endpoints

- **[transcription-testing.md](./transcription-testing.md)** - Testing procedures
  - End-to-end testing checklist
  - Manual testing scenarios
  - Error case testing

- **[transcription-refactor-summary.md](./transcription-refactor-summary.md)** - Recent refactoring summary
  - Changes made to simplify the transcription flow
  - Key architectural improvements
  - Breaking changes (if any)

### Language-Specific Improvements
- **[persian-transcription-improvements.md](./persian-transcription-improvements.md)** - Farsi/Persian optimization
  - Model selection for Persian
  - Text normalization for Persian text
  - Usage guidelines and performance expectations
  - Fine-tuning options for domain-specific accuracy

## Code Assistant

The Code Assistant provides AI-powered code generation, explanation, review, and debugging capabilities.

- **[code-assist-plan.md](./code-assist-plan.md)** - Investigation & fix plan
  - Security audit findings
  - Authorization and access control improvements
  - UX enhancements and data readiness
  - Implementation roadmap

- **[code-assist-redesign.md](./code-assist-redesign.md)** - Ground-up redesign vision
  - Next-generation architecture
  - Unified run/artifact/patch model
  - Provider-agnostic design (Ollama/LM Studio/OpenAI)
  - Audit logging and observability

## Image Generation

Integration with Stable Diffusion for AI-powered image generation.

- **[ai-sdk-automatic1111.md](./ai-sdk-automatic1111.md)** - AUTOMATIC1111 integration
  - Setup instructions
  - Model management
  - API integration details

## Authentication & Authorization

- **[auth-simplified-tasks.md](./auth-simplified-tasks.md)** - Authentication implementation tasks
  - Session management
  - User verification
  - Permission scoping

---

## Quick Links

### For Developers
- New to the project? Start with [transcription-guide.md](./transcription-guide.md)
- Building features? See [transcription-architecture.md](./transcription-architecture.md)
- Working on Code Assistant? Check [code-assist-plan.md](./code-assist-plan.md)

### For DevOps/Deployment
- Deploying transcription? Review [transcription-architecture.md](./transcription-architecture.md)
- Setting up image generation? See [ai-sdk-automatic1111.md](./ai-sdk-automatic1111.md)
- Testing before deployment? Use [transcription-testing.md](./transcription-testing.md)

### For QA/Testing
- Transcription testing? Use [transcription-testing.md](./transcription-testing.md)
- Need Persian language guidance? Check [persian-transcription-improvements.md](./persian-transcription-improvements.md)

---

## Documentation Standards

When adding new documentation:
1. Use clear, descriptive filenames (kebab-case)
2. Include a brief summary at the top
3. Organize with clear sections (## Headers)
4. Link to related documents
5. Keep technical and user documentation separate

For project guidelines, coding standards, and development setup, see the main [CLAUDE.md](../CLAUDE.md) file.
