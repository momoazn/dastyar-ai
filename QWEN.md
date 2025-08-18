# AI App - Project Context for Qwen Code

This document provides an overview of the `ai-app` project to help Qwen Code understand its structure, technologies, and key operational procedures.

## Project Overview

This is a modern, full-stack TypeScript application built with the [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack). It combines React for the frontend, Hono for the backend, and includes a Python service for Whisper transcription. The project uses Bun as its primary runtime and package manager, and Turborepo for managing the monorepo structure.

### Main Technologies

- **Frontend:** React 18, TanStack Router, TailwindCSS, shadcn/ui
- **Backend:** Hono (server framework), oRPC (type-safe APIs)
- **Database:** SQLite with Drizzle ORM
- **Runtime/Build:** Bun
- **Monorepo Tool:** Turborepo
- **AI/LLM Integration:** Libraries for interacting with OpenAI, Google AI, Groq, and ollama.
- **Additional Service:** Python-based Whisper transcription service (FastAPI)

### Architecture

The project is structured as a monorepo with three main applications:

1.  `apps/web`: The React frontend application.
2.  `apps/server`: The Hono backend API server.
3.  `apps/whisper`: A Python service for audio transcription using Whisper.

## Building and Running

### Prerequisites

- [Bun](https://bun.sh/) installed as the runtime and package manager.
- For the Whisper service, `uv` is used for Python dependency management. Ensure it's installed if you plan to run the Whisper service locally.

### Initial Setup

1.  Install dependencies:
    ```bash
    bun install
    ```
2.  Set up environment variables by copying the example files:

    ```bash
    cp apps/web/.env.local apps/web/.env
    cp apps/server/.env.local apps/server/.env
    cp apps/whisper/.env.local apps/whisper/.env
    ```

    _(Note: The root `README.md` mentions `env.local` files in the root `apps` directory, but they are actually located within each app's subdirectory. The `ports.config` file provides details on port assignments.)_

3.  Set up the database (SQLite):
    ```bash
    cd apps/server && bun db:local # Starts the local SQLite DB instance
    # In another terminal, from the project root:
    bun db:push # Applies the schema
    ```

### Development

- **Start All Services:** To run the entire development environment:

  ```bash
  bun dev
  ```

  This command uses Turborepo to start the web app (port 40000), server (port 40001), and whisper service (port 40002) concurrently.

- **Start Individual Services:**
  - Web App: `bun dev:web` (or `cd apps/web && bun dev`)
  - Server: `bun dev:server` (or `cd apps/server && bun dev`)
  - Whisper Service: `bun dev:whisper` (or `cd apps/whisper && bun dev:env`)

### Building

- **Build All Apps:** `bun build` or `bun build:all`
- **Build Specific Apps:**
  - Web: `bun build:web`
  - Server: `bun build:server`
  - Whisper: `bun build:whisper` (This likely involves Python packaging)

### Database Management

- **Push Schema Changes:** `bun db:push` (from project root, targets `apps/server`)
- **Open Drizzle Studio:** `bun db:studio` (from project root, targets `apps/server`)
- **Generate Migrations:** `bun db:generate` (from project root, targets `apps/server`)
- **Apply Migrations:** `bun db:migrate` (from project root, targets `apps/server`)

## Development Conventions

- **Monorepo Structure:** The project uses Turbo workspaces (defined in root `package.json`) to manage `apps/*` and potentially `packages/*`.
- **Type Safety:** Heavy emphasis on TypeScript for both frontend and backend.
- **API Contract:** Uses oRPC for end-to-end type-safe API communication between the frontend and backend.
- **Routing:** The web app uses file-based routing via TanStack Router.
- **Styling:** TailwindCSS is the primary styling solution.
- **UI Components:** shadcn/ui components are utilized, which are built on top of Radix UI and TailwindCSS.
- **Code Quality:** Biome is used for linting and formatting (`bun check`).
- **Python Service (Whisper):** Uses `uv` for dependency management and `ruff` for linting/formatting.
