# Operations

## Development

```bash
bun run dev
bun run dev:web
bun run dev:server
bun run dev:whisper
```

## Quality Gates

```bash
bun run lint:check
bun run check-types
bun run test
```

## Build

```bash
bun run build
bun run build:fast
bun --cwd apps/web build
bun --cwd apps/server build
```

## Database

```bash
bun run db:migrate
bun run db:push
bun run db:generate
bun run db:studio
```

## Configuration

```bash
bun run config:generate
bun run config:show
bun run config:validate
```

## Optional Services

- Ollama: default `http://localhost:11434`
- LM Studio: default `http://localhost:1234/v1`
- Stable Diffusion WebUI: default `http://localhost:7860`
- Whisper: app-specific Go service

## Utilities

```bash
bun run download:ffmpeg
bun run download:model
bun run start
bun run stop
bun run status
```
