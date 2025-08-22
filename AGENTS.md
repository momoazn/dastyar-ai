# Agent Instructions for Dastyar AI

## Build/Lint/Test Commands

**Package Manager:** Bun (use `bun run` instead of `npm run`)

**Root Commands:**
- `bun run dev` - Start all apps in development mode
- `bun run build` - Build all apps
- `bun run check` - Lint and format code with Biome
- `bun run check-types` - Type check all apps

**App-Specific Commands:**
- `bun run dev:web` - Start web app only
- `bun run dev:server` - Start server app only
- `bun run build:web` - Build web app only
- `bun run build:server` - Build server app only

**Database Commands:**
- `bun run db:push` - Push schema changes to database
- `bun run db:studio` - Open Drizzle Studio
- `bun run db:migrate` - Run database migrations

## Code Style Guidelines

**Linting & Formatting:** Use Biome (configured with Ultracite rules)
- Maximum type safety with strict TypeScript
- No `any` types, enums, or namespaces
- Arrow functions over function expressions
- `const` over `let`, explicit types over inferred
- No unused imports, variables, or parameters

**Imports:** Use `import type` for TypeScript types, avoid namespace imports

**Error Handling:** Comprehensive try-catch with meaningful error messages, no error swallowing

**React/JSX:** Functional components only, hooks at top level, no prop drilling, semantic HTML

**Accessibility:** Full ARIA compliance, keyboard navigation, screen reader support

**File Naming:** kebab-case for files, camelCase for variables/functions, PascalCase for components

**Testing:** No specific test framework detected - add tests as needed with preferred framework