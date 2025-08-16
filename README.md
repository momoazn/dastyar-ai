# ai-app

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines React, TanStack Router, Hono, ORPC, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **TanStack Router** - File-based routing with full type safety
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **shadcn/ui** - Reusable UI components
- **Hono** - Lightweight, performant server framework
- **oRPC** - End-to-end type-safe APIs with OpenAPI integration
- **Bun** - Runtime environment
- **Drizzle** - TypeScript-first ORM
- **SQLite/Turso** - Database engine
- **Turborepo** - Optimized monorepo build system

## Getting Started

First, install the dependencies:

```bash
bun install
```

## Environment Variables

This project uses environment variables for port configuration. Each app has example environment files that you can copy and customize:

### Quick Setup
```bash
# Copy environment files to .env (run from project root)
cp apps/web/env.local apps/web/.env
cp apps/server/env.local apps/server/.env
cp apps/whisper/env.local apps/whisper/.env
```

### Port Configurations
- **WEB_PORT=40000** - Frontend web app port
- **SERVER_PORT=40001** - Backend server port  
- **WHISPER_PORT=40002** - Whisper service port

### Alternative: Set in Shell
```bash
export WEB_PORT=40000
export SERVER_PORT=40001
export WHISPER_PORT=40002
```

See `ports.config` for complete configuration details.

## Database Setup

This project uses SQLite with Drizzle ORM.

1. Start the local SQLite database:
```bash
cd apps/server && bun db:local
```


2. Update your `.env` file in the `apps/server` directory with the appropriate connection details if needed.

3. Apply the schema to your database:
```bash
bun db:push
```


Then, run the development server:

```bash
bun dev
```

Open [http://localhost:40000](http://localhost:40000) in your browser to see the web application.
The API is running at [http://localhost:40001](http://localhost:40001).
The Whisper service is running at [http://localhost:40002](http://localhost:40002).



## Project Structure

```
ai-app/
├── apps/
│   ├── web/         # Frontend application (React + TanStack Router)
│   ├── server/      # Backend API (Hono, ORPC)
│   └── whisper/     # Python Whisper transcription service
```

## Available Scripts

- `bun dev`: Start all applications in development mode
- `bun build`: Build all applications
- `bun dev:web`: Start only the web application
- `bun dev:server`: Start only the server
- `bun dev:whisper`: Start only the whisper service (uses WHISPER_PORT env var)
- `bun check-types`: Check TypeScript types across all apps
- `bun db:push`: Push schema changes to database
- `bun db:studio`: Open database studio UI
- `cd apps/server && bun db:local`: Start the local SQLite database
