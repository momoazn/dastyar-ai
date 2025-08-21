# Project: AI-App

## Project Overview

This is a monorepo project built with the "Better-T-Stack". It consists of three main applications:

*   **`apps/web`**: A React-based frontend application built with Vite. It uses TanStack Router for routing, TailwindCSS for styling, and `shadcn/ui` for UI components.
*   **`apps/server`**: A Hono-based backend server with oRPC for end-to-end type-safe APIs. It uses Drizzle ORM with SQLite for the database and integrates with various AI services.
*   **`apps/whisper`**: A Python-based FastAPI service for audio transcription using OpenAI's Whisper model.

The entire project is managed as a Turborepo monorepo, with Bun used for package management and as the runtime for the TypeScript applications.

## Building and Running

### Prerequisites

*   [Bun](https://bun.sh/)
*   [Node.js](https://nodejs.org/) (for some scripts)
*   [Python](https://www.python.org/) (for the whisper service)
*   [Go](https://go.dev/) (for bundling scripts)

### Installation

```bash
bun install
```

### Environment Variables

Copy the example environment files and customize them as needed:

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/server/.env.example apps/server/.env.local
cp apps/whisper/.env.example apps/whisper/.env.local
```

### Development

To run all applications in development mode:

```bash
bun dev
```

This will start the following services:

*   **Web app**: `http://localhost:40000`
*   **Server**: `http://localhost:40001`
*   **Whisper service**: `http://localhost:40002`

You can also run each application individually:

*   `bun dev:web`
*   `bun dev:server`
*   `bun dev:whisper`

### Database

To initialize the database:

```bash
bun db:push
```

To open the database studio:

```bash
bun db:studio
```

### Building for Production

To build all applications for production:

```bash
bun build
```

## Development Conventions

*   **Monorepo Management**: This project uses Turborepo to manage the monorepo. The configuration can be found in `turbo.json`.
*   **Package Management**: Bun is used for package management. The workspaces are defined in the root `package.json`.
*   **Code Style**: The project uses Biome for code formatting and linting. Run `bun check` to check and format the code.
*   **Type Checking**: The project uses TypeScript. Run `bun check-types` to check for type errors.
*   **Python Environment**: The whisper service uses `uv` for package management. The dependencies are listed in `apps/whisper/pyproject.toml`.
