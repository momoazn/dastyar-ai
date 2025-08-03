# Next.js + tRPC + Vercel AI SDK Migration Task List

## After task

- After completing each task mark it as completed, then stage the changes and commit them with a proper commit message, after that you can declare task as done.

---

## Section 1: Project Initialization Tasks

### [x] Task 1.1: Create Next.js Project

**Description:** Initialize a new Next.js 15 project with TypeScript, Tailwind CSS, and App Router.

**Technical Details:**

- Use Bun package manager for initialization
- Enable TypeScript for type safety
- Enable Tailwind CSS for styling
- Use App Router (not Pages Router)
- Set import alias to `@/*` for cleaner imports

**Commands to Execute:**

```bash
bunx create-next-app@latest persian-ai-assistant-next \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*"

cd persian-ai-assistant-next
```

**Success Criteria:**

- New directory `persian-ai-assistant-next` created
- `package.json` exists with Next.js dependencies
- `app` directory exists (not `pages`)
- TypeScript config files present

---

### [x] Task 1.2: Install Core tRPC Dependencies

**Description:** Install tRPC packages for type-safe API communication between client and server.

**Technical Details:**

- tRPC server for creating API endpoints
- tRPC client for consuming APIs
- React Query adapter for tRPC
- Next.js adapter for tRPC integration

**Commands to Execute:**

```bash
bun add @trpc/server @trpc/client @trpc/react-query @trpc/next
```

**Files Affected:** `package.json`

**Success Criteria:**

- All tRPC packages listed in `package.json` dependencies
- No installation errors

---

### [x] Task 1.3: Install Vercel AI SDK Dependencies

**Description:** Install Vercel AI SDK for handling AI model streaming and Ollama provider for local LLM integration.

**Technical Details:**

- `ai` package provides streaming utilities
- `@ai-sdk/react` provides React hooks for AI interactions
- `ollama-ai-provider` enables connection to local Ollama server

**Commands to Execute:**

```bash
bun add ai @ai-sdk/react ollama-ai-provider
```

**Success Criteria:**

- AI SDK packages in dependencies
- Compatible versions installed

---

### [x] Task 1.4: Install State Management and Data Fetching Libraries

**Description:** Install Jotai for client state.

**Technical Details:**

- Jotai for atomic state management
- PocketBase client for database operations

**Commands to Execute:**

```bash
bun add jotai pocketbase
```

**Success Criteria:**

- Latest TanStack Query installed
- Jotai and PocketBase clients available

---

### [ ] Task 1.5: Initialize shadcn/ui and Install Base Dependencies

**Description:** Initialize shadcn/ui for the project and install base styling utilities.

**Technical Details:**

- Initialize shadcn/ui with Next.js 15 and App Router
- Configure with existing Tailwind CSS setup
- Install base styling utilities and Persian font
- Set up components.json configuration

**Commands to Execute:**

```bash
# Initialize shadcn/ui
bunx --bun shadcn@latest init

# Install core shadcn components that will be needed
bunx --bun shadcn@latest add button card dialog dropdown-menu input label select separator switch tabs textarea tooltip scroll-area avatar progress slider
```

**Configuration Notes:**

- Use TypeScript: Yes
- Use Tailwind CSS: Yes
- Use src directory: No (we're using app directory)
- Use import alias: @/\*
- Configure components.json for RTL and Persian support

**Success Criteria:**

- shadcn/ui initialized with components.json
- Base styling utilities installed
- Core UI components added via CLI
- Persian font available

---

### [x] Task 1.6: Install Utility Libraries

**Description:** Install validation, serialization, and markdown rendering libraries.

**Technical Details:**

- Zod for runtime type validation and schema definition
- Superjson for serializing complex data types
- React Markdown for rendering markdown content

**Commands to Execute:**

```bash
bun add zod superjson react-markdown remark-gfm next-themes
bun add -d @types/node concurrently
```

**Success Criteria:**

- Utility packages installed
- Dev dependencies properly marked

---

## Section 2: Project Structure Setup Tasks

### [ ] Task 2.1: Create App Directory Structure

**Description:** Set up the Next.js App Router directory structure with route groups and API routes.

**Technical Details:**

- `(app)` route group for main application routes
- API directory for tRPC endpoint
- Separate directories for each feature

**Directory Structure to Create:**

```
app/
├── (app)/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── chat/
│   │   ├── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   ├── translation/
│   │   └── page.tsx
│   └── image/
│       └── page.tsx
├── api/
│   └── trpc/
│       └── [trpc]/
│           └── route.ts
├── layout.tsx
├── globals.css
└── providers.tsx
```

**Commands to Execute:**

```bash
# Create app directories
mkdir -p app/\(app\)/chat/\[id\]
mkdir -p app/\(app\)/translation
mkdir -p app/\(app\)/image
mkdir -p app/api/trpc/\[trpc\]

# Create placeholder files
touch app/\(app\)/layout.tsx
touch app/\(app\)/page.tsx
touch app/\(app\)/chat/page.tsx
touch app/\(app\)/chat/\[id\]/page.tsx
touch app/\(app\)/translation/page.tsx
touch app/\(app\)/image/page.tsx
touch app/api/trpc/\[trpc\]/route.ts
touch app/providers.tsx
```

**Success Criteria:**

- All directories created
- Route structure follows Next.js App Router conventions

---

### [ ] Task 2.2: Create Server Directory Structure

**Description:** Set up server-side directory structure for tRPC routers, services, and types.

**Technical Details:**

- Separate directories for tRPC configuration, routers, and services
- TypeScript types directory for generated PocketBase types

**Directory Structure to Create:**

```
server/
├── trpc/
│   ├── trpc.ts
│   ├── context.ts
│   └── middleware.ts
├── routers/
│   ├── _app.ts
│   ├── chat.ts
│   ├── threads.ts
│   ├── messages.ts
│   └── models.ts
├── services/
│   ├── pocketbase.ts
│   ├── ollama.ts
│   └── streaming.ts
└── types/
    └── pocketbase-types.ts
```

**Commands to Execute:**

```bash
# Create server directories
mkdir -p server/trpc
mkdir -p server/routers
mkdir -p server/services
mkdir -p server/types

# Create files
touch server/trpc/trpc.ts
touch server/trpc/context.ts
touch server/trpc/middleware.ts
touch server/routers/_app.ts
touch server/routers/chat.ts
touch server/routers/threads.ts
touch server/routers/messages.ts
touch server/routers/models.ts
touch server/services/pocketbase.ts
touch server/services/ollama.ts
touch server/services/streaming.ts
touch server/types/pocketbase-types.ts
```

**Success Criteria:**

- Server directory structure complete
- All router and service files created

---

### [ ] Task 2.3: Create Library Directory Structure

**Description:** Set up client-side library structure for hooks, utilities, and state management.

**Technical Details:**

- Hooks directory for custom React hooks
- Atoms directory for Jotai state atoms
- Utils for helper functions

**Directory Structure to Create:**

```
lib/
├── trpc/
│   ├── client.ts
│   └── server.ts
├── hooks/
│   ├── use-chat.ts
│   ├── use-threads.ts
│   └── use-subscriptions.ts
├── atoms/
│   ├── chat.ts
│   └── settings.ts
├── utils/
│   ├── cn.ts
│   └── persian.ts
└── pocketbase.ts
```

**Commands to Execute:**

```bash
# Create lib directories
mkdir -p lib/trpc
mkdir -p lib/hooks
mkdir -p lib/atoms
mkdir -p lib/utils

# Create files
touch lib/trpc/client.ts
touch lib/trpc/server.ts
touch lib/hooks/use-chat.ts
touch lib/hooks/use-threads.ts
touch lib/hooks/use-subscriptions.ts
touch lib/atoms/chat.ts
touch lib/atoms/settings.ts
touch lib/utils/cn.ts
touch lib/utils/persian.ts
touch lib/pocketbase.ts
```

**Success Criteria:**

- Library structure organized
- Separation of concerns maintained

---

### [ ] Task 2.4: Create Components Directory Structure

**Description:** Set up component directory structure for UI components and feature components.

**Technical Details:**

- UI directory for reusable components
- Feature-specific component directories
- Layout components separate from feature components

**Directory Structure to Create:**

```
components/
├── ui/
│   └── (will be populated later)
├── chat/
│   ├── message.tsx
│   ├── chat-input.tsx
│   └── message-list.tsx
└── layout/
    ├── sidebar.tsx
    └── header.tsx
```

**Commands to Execute:**

```bash
# Create component directories
mkdir -p components/ui
mkdir -p components/chat
mkdir -p components/layout

# Create component files
touch components/chat/message.tsx
touch components/chat/chat-input.tsx
touch components/chat/message-list.tsx
touch components/layout/sidebar.tsx
touch components/layout/header.tsx
```

**Success Criteria:**

- Component structure ready
- Feature separation clear

---

## Section 3: Configuration Tasks

### [ ] Task 3.1: Configure TypeScript

**Description:** Set up TypeScript configuration with strict mode and proper path aliases.

**Technical Details:**

- Enable strict mode for better type safety
- Configure module resolution for bundler
- Set up path alias `@/*` for imports
- Target ES2022 for modern JavaScript features

**File to Create/Update:** `tsconfig.json`

**Content:**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "strictNullChecks": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Success Criteria:**

- TypeScript strict mode enabled
- Path aliases working
- No TypeScript configuration errors

---

### [ ] Task 3.2: Configure Next.js

**Description:** Set up Next.js configuration with rewrites for PocketBase proxy and CORS headers.

**Technical Details:**

- Configure rewrites to proxy PocketBase requests
- Set up CORS headers for API routes
- Enable experimental features for server actions
- Configure image domains for avatars

**File to Create:** `next.config.js`

**Content:**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },

  async rewrites() {
    return [
      {
        source: "/pb/:path*",
        destination: "http://localhost:8090/:path*",
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
        ],
      },
    ];
  },

  images: {
    domains: ["localhost"],
  },
};

module.exports = nextConfig;
```

**Success Criteria:**

- Next.js config valid
- Rewrites configured
- CORS headers set

---

### [ ] Task 3.3: Configure Environment Variables

**Description:** Set up environment variables for PocketBase, Ollama, and application URLs.

**Technical Details:**

- Server-side and client-side PocketBase URLs
- Ollama API endpoint
- Optional WebSocket URL for subscriptions

**File to Create:** `.env.local`

**Content:**

```bash
# PocketBase
POCKETBASE_URL=http://localhost:8090
NEXT_PUBLIC_POCKETBASE_URL=http://localhost:8090

# Ollama
OLLAMA_URL=http://localhost:11434

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: WebSocket for subscriptions
WS_URL=ws://localhost:3001
```

**Success Criteria:**

- Environment variables accessible
- Both server and client variables configured

---

### [ ] Task 3.4: Configure Package.json Scripts

**Description:** Update package.json with development, build, and utility scripts.

**Technical Details:**

- Concurrent development of Next.js and PocketBase
- Type generation from PocketBase schema
- Cleaning scripts for cache and build files

**File to Update:** `package.json`

**Scripts to Add:**

```json
{
  "scripts": {
    "dev": "concurrently \"bun run next:dev\" \"bun run pb:dev\"",
    "next:dev": "next dev",
    "pb:dev": "cd .. && air",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "pb:typegen": "bunx pocketbase-typegen --db ../data/data.db --out server/types/pocketbase-types.ts",
    "db:seed": "bun run server/scripts/seed.ts",
    "clean": "rm -rf .next node_modules",
    "clean:all": "rm -rf .next node_modules ../data/storage/* ../tmp/*"
  }
}
```

**Success Criteria:**

- All scripts executable
- Concurrent development working

---

### [ ] Task 3.5: Configure Tailwind CSS and shadcn/ui for RTL

**Description:** Set up Tailwind configuration with RTL support, Persian fonts, and shadcn/ui integration.

**Technical Details:**

- Configure Vazirmatn font for Persian text
- Set up dark mode with class strategy
- Configure content paths for Tailwind scanning
- Update shadcn/ui components.json for RTL support

**Files to Update:**

- `tailwind.config.ts`
- `components.json`

**Key Configurations:**

- Font family with Vazirmatn
- Dark mode class strategy
- RTL utilities and direction support
- Custom color scheme compatible with shadcn/ui
- Update components.json to support RTL layout

**Success Criteria:**

- Tailwind processing styles
- Persian font loading
- Dark mode working
- shadcn/ui components support RTL
- components.json configured properly

---

## Section 4: tRPC Server Implementation Tasks

### [ ] Task 4.1: Implement tRPC Initialization

**Description:** Set up tRPC server with superjson transformer and error formatting.

**Technical Details:**

- Initialize tRPC with context type
- Configure superjson for Date/Map/Set serialization
- Set up error formatter for Zod validation errors
- Export router and procedure builders

**File:** `server/trpc/trpc.ts`

**Key Implementation Points:**

```typescript
- Import initTRPC from @trpc/server
- Configure with superjson transformer
- Create error formatter for Zod errors
- Export router, publicProcedure, and authedProcedure
- Implement auth middleware for protected routes
```

**Dependencies:**

- @trpc/server
- superjson
- zod

**Success Criteria:**

- tRPC initialized
- Procedures exportable
- Error handling configured

---

### [ ] Task 4.2: Implement Context Creation

**Description:** Create tRPC context with PocketBase instance and user authentication.

**Technical Details:**

- Extract auth token from request headers
- Validate token with PocketBase
- Return context with user and PocketBase instance
- Handle auth errors gracefully

**File:** `server/trpc/context.ts`

**Key Implementation Points:**

```typescript
- Import FetchCreateContextFnOptions from @trpc/server/adapters/fetch
- Extract authorization header
- Validate with PocketBase authStore
- Return context object with req, resHeaders, user, and pb
```

**Success Criteria:**

- Context created for each request
- Auth validation working
- PocketBase instance available

---

### [ ] Task 4.3: Implement Chat Router with Streaming

**Description:** Create chat router with streaming support using Vercel AI SDK and Ollama.

**Technical Details:**

- Subscription procedure for message streaming
- Integration with Ollama via Vercel AI SDK
- Real-time updates to PocketBase
- Reasoning token parsing
- Error handling for stream failures

**File:** `server/routers/chat.ts`

**Key Implementation Points:**

```typescript
- Create sendMessage subscription procedure
- Fetch thread messages from PocketBase
- Convert messages to AI SDK format
- Stream responses from Ollama
- Parse reasoning tokens from response
- Update PocketBase with message status
- Emit events for streaming updates
```

**Complex Logic:**

- EventEmitter for streaming events
- Observable pattern for tRPC subscriptions
- Accumulate content and reasoning separately
- Handle stream interruption and errors

**Success Criteria:**

- Messages stream in real-time
- PocketBase updates during streaming
- Reasoning tokens parsed correctly

---

### [ ] Task 4.4: Implement Thread Router

**Description:** Create CRUD operations for chat threads using tRPC procedures.

**Technical Details:**

- List threads with pagination and filtering
- Get single thread by ID
- Create new thread with Persian title
- Update thread properties (title, archived status)
- Delete thread with cascade

**File:** `server/routers/threads.ts`

**Key Implementation Points:**

```typescript
- list: Query with pagination, filtering by archived status
- get: Query single thread by ID
- create: Mutation with default Persian title
- update: Mutation for title/archive updates
- delete: Mutation for thread deletion
```

**Success Criteria:**

- All CRUD operations functional
- Proper PocketBase integration
- Persian text handled correctly

---

### [ ] Task 4.5: Implement Root Router Composition

**Description:** Compose all routers into a single app router and export types.

**Technical Details:**

- Import all sub-routers
- Compose into single router
- Export AppRouter type for client

**File:** `server/routers/_app.ts`

**Key Implementation Points:**

```typescript
- Import router from trpc.ts
- Import all sub-routers (chat, threads, messages, models)
- Compose into appRouter
- Export type AppRouter = typeof appRouter
```

**Success Criteria:**

- All routers accessible
- Type exported for client

---

### [ ] Task 4.6: Implement Message Router

**Description:** Create router for message-specific operations.

**Technical Details:**

- Get messages by thread ID
- Update message status
- Delete messages
- Batch operations for efficiency

**File:** `server/routers/messages.ts`

**Key Implementation Points:**

- Query messages with filtering
- Update message status/content
- Handle batch updates
- Maintain message ordering

**Success Criteria:**

- Message operations working
- Batch updates efficient

---

### [ ] Task 4.7: Implement Models Router

**Description:** Create router for listing available Ollama models.

**Technical Details:**

- Fetch models from Ollama API
- Cache model list for performance
- Return formatted model information

**File:** `server/routers/models.ts`

**Key Implementation Points:**

- Query Ollama API for models
- Format response for frontend
- Implement caching strategy

**Success Criteria:**

- Models list retrieved
- Caching improves performance

---

## Section 5: tRPC Client Configuration Tasks

### [ ] Task 5.1: Configure tRPC Client

**Description:** Set up tRPC client with proper links, transformers, and error handling.

**Technical Details:**

- HTTP batch link for queries/mutations
- WebSocket link for subscriptions
- Split link to route by operation type
- Superjson transformer for serialization
- Logger link for development

**File:** `lib/trpc/client.ts`

**Key Implementation Points:**

```typescript
- Import createTRPCNext from @trpc/next
- Configure httpBatchLink with dynamic base URL
- Set up wsLink for subscriptions (optional)
- Use splitLink to route operations
- Configure query client with stale time
- Export as 'api' for usage
```

**Success Criteria:**

- Client connects to server
- Type safety maintained
- Subscriptions working (if implemented)

---

### [ ] Task 5.2: Implement App Providers

**Description:** Create providers component wrapping the app with necessary contexts.

**Technical Details:**

- tRPC provider with client
- TanStack Query provider
- Jotai provider for state
- Theme provider for dark mode
- React Query DevTools in development

**File:** `app/providers.tsx`

**Key Implementation Points:**

```typescript
- Create QueryClient with configuration
- Create tRPC client instance
- Wrap providers in correct order
- Include dev tools conditionally
```

**Success Criteria:**

- All providers working
- No provider conflicts
- DevTools accessible

---

## Section 6: Next.js Route Handler Tasks

### [ ] Task 6.1: Implement tRPC Route Handler

**Description:** Create Next.js route handler for tRPC requests using fetch adapter.

**Technical Details:**

- Use fetchRequestHandler from tRPC
- Pass app router and context
- Handle errors in development
- Enable edge runtime for performance

**File:** `app/api/trpc/[trpc]/route.ts`

**Key Implementation Points:**

```typescript
- Import fetchRequestHandler from @trpc/server/adapters/fetch
- Import appRouter and createContext
- Create handler for GET and POST
- Add error logging in development
- Export runtime = 'edge'
```

**Success Criteria:**

- API routes responding
- tRPC procedures accessible
- Errors logged in development

---

## Section 7: PocketBase Integration Tasks

### [ ] Task 7.1: Generate PocketBase Types

**Description:** Generate TypeScript types from existing PocketBase schema.

**Technical Details:**

- Use pocketbase-typegen tool
- Point to existing database file
- Generate typed collections

**Command:**

```bash
bunx pocketbase-typegen --db ../data/data.db --out server/types/pocketbase-types.ts
```

**Success Criteria:**

- Types generated successfully
- All collections typed
- No type errors

---

### [ ] Task 7.2: Implement Server-side PocketBase Client

**Description:** Create PocketBase client for server-side operations with helper functions.

**Technical Details:**

- Initialize PocketBase with server URL
- Disable auto-cancellation for server
- Create helper functions for common operations
- Type with generated types

**File:** `server/services/pocketbase.ts`

**Key Implementation Points:**

```typescript
- Import PocketBase and TypedPocketBase
- Initialize with POCKETBASE_URL
- Disable autoCancellation
- Create helpers: getMessages, createMessage, updateMessage, etc.
```

**Success Criteria:**

- PocketBase client initialized
- Helper functions working
- Types properly applied

---

### [ ] Task 7.3: Implement Client-side PocketBase

**Description:** Create PocketBase client for client-side subscriptions and auth.

**Technical Details:**

- Initialize with public URL
- Enable auto-cancellation
- Create auth helper functions
- Set up for real-time subscriptions

**File:** `lib/pocketbase.ts`

**Key Implementation Points:**

```typescript
- Use NEXT_PUBLIC_POCKETBASE_URL
- Enable autoCancellation
- Create auth object with login/logout
- Export typed instance
```

**Success Criteria:**

- Client connects to PocketBase
- Auth functions working
- Ready for subscriptions

---

## Section 8: Hook Implementation Tasks

### [ ] Task 8.1: Implement Chat Hook with AI SDK

**Description:** Create custom hook integrating Vercel AI SDK with PocketBase subscriptions.

**Technical Details:**

- Use Vercel AI SDK's useChat hook
- Subscribe to PocketBase for real-time updates
- Sync messages between AI SDK and PocketBase
- Handle streaming and completion events

**File:** `lib/hooks/use-chat.ts`

**Key Implementation Points:**

```typescript
- Import useChat from @ai-sdk/react
- Set up PocketBase subscription
- Sync messages on create/update events
- Handle cleanup on unmount
- Custom submit handler
```

**Success Criteria:**

- Messages stream properly
- Real-time updates work
- No memory leaks

---

### [ ] Task 8.2: Implement Thread Management Hook

**Description:** Create hook for managing thread operations with tRPC.

**Technical Details:**

- Use tRPC queries and mutations
- Handle optimistic updates
- Manage loading states
- Cache invalidation strategy

**File:** `lib/hooks/use-threads.ts`

**Key Implementation Points:**

- Use api.threads queries/mutations
- Implement optimistic updates
- Handle error states
- Manage cache invalidation

**Success Criteria:**

- Thread operations smooth
- Optimistic updates working
- Cache properly managed

---

## Section 9: Component Migration Tasks

### [ ] Task 9.1: Add Additional UI Components via shadcn/ui CLI

**Description:** Add any missing shadcn/ui components that weren't installed in Task 1.5 but are needed from the original project.

**Technical Details:**

- Use shadcn/ui CLI to add components
- Compare with original project's ui directory
- Add any missing components needed
- Ensure RTL compatibility

**Commands to Execute:**

```bash
# Check original project components and add missing ones
bunx shadcn@latest add skeleton sheet collapsible badge alert breadcrumb
# Add any other components found in original src/components/ui/
```

**Components to verify and add if missing:**

- From original: sidebar, skeleton, loading-spinner, theme-toggle
- Standard shadcn: badge, alert, sheet, breadcrumb, collapsible
- Custom components may need manual migration

**Success Criteria:**

- All standard shadcn/ui components available
- Custom components identified for manual migration
- Components compatible with RTL layout

---

### [ ] Task 9.2: Migrate Chat Components

**Description:** Migrate chat-specific components adapting to new hooks and tRPC.

**Technical Details:**

- Update imports to new structure
- Replace API calls with tRPC
- Use new chat hook
- Maintain Persian text support

**Files to Migrate:**

- `components/chat/message.tsx`
- `components/chat/chat-input.tsx`
- `components/chat/message-list.tsx`

**Key Changes:**

- Import from new paths
- Use tRPC api object
- Integrate with new hooks

**Success Criteria:**

- Components render correctly
- Persian text displays properly
- Interactions working

---

### [ ] Task 9.3: Migrate Layout Components

**Description:** Migrate sidebar and header components to Next.js App Router structure.

**Technical Details:**

- Convert to client components where needed
- Update navigation to use Next.js router
- Maintain responsive behavior
- Keep theme toggle functionality

**Files to Migrate:**

- `components/layout/sidebar.tsx`
- `components/layout/header.tsx`

**Key Changes:**

- Add 'use client' directive where needed
- Use next/navigation
- Update import paths

**Success Criteria:**

- Layout responsive
- Navigation working
- Theme toggle functional

---

## Section 10: Page Implementation Tasks

### [ ] Task 10.1: Implement Root Layout

**Description:** Create root layout with providers and global styles.

**Technical Details:**

- Import global CSS
- Import Persian font
- Wrap with Providers component
- Set HTML attributes for RTL

**File:** `app/layout.tsx`

**Key Implementation Points:**

```typescript
- Import globals.css
- Import Vazirmatn font
- Set dir="rtl" and lang="fa"
- Wrap children with Providers
```

**Success Criteria:**

- Styles applied globally
- RTL layout working
- Providers wrapping app

---

### [ ] Task 10.2: Implement App Layout with Sidebar

**Description:** Create app-specific layout with sidebar navigation.

**Technical Details:**

- Use client component
- Import sidebar and header
- Set up responsive layout
- Maintain sidebar state

**File:** `app/(app)/layout.tsx`

**Key Implementation Points:**

- Import layout components
- Set up sidebar provider
- Create responsive grid
- Handle mobile/desktop views

**Success Criteria:**

- Sidebar toggles properly
- Responsive on mobile
- Content area adjusts

---

### [ ] Task 10.3: Implement Chat Page with Thread ID

**Description:** Create dynamic chat page using thread ID parameter.

**Technical Details:**

- Get thread ID from params
- Use chat hook for messaging
- Fetch thread data with tRPC
- Implement auto-scrolling
- Handle loading states

**File:** `app/(app)/chat/[id]/page.tsx`

**Key Implementation Points:**

```typescript
- Use useParams for thread ID
- Implement useChat hook
- Query thread with api.threads.get
- Auto-scroll to bottom
- Render message list and input
```

**Success Criteria:**

- Messages load for thread
- Streaming works
- Input sends messages
- Auto-scroll functioning

---

### [ ] Task 10.4: Implement New Chat Page

**Description:** Create page for starting new chat threads.

**Technical Details:**

- Create thread on first message
- Redirect to thread page
- Show empty state
- Handle model selection

**File:** `app/(app)/chat/page.tsx`

**Key Implementation Points:**

- Use api.threads.create mutation
- Redirect with next/navigation
- Show welcome message
- Model selector component

**Success Criteria:**

- New threads created
- Redirect works
- Empty state appealing

---

### [ ] Task 10.5: Create Placeholder Pages

**Description:** Create placeholder pages for translation and image features.

**Technical Details:**

- Simple coming soon pages
- Maintain consistent layout
- Persian text for messages

**Files:**

- `app/(app)/translation/page.tsx`
- `app/(app)/image/page.tsx`

**Content:**

- Coming soon message in Persian
- Consistent styling with app
- Basic layout structure

**Success Criteria:**

- Pages accessible
- Consistent design
- Persian text correct

---

## Section 11: Utility Implementation Tasks

### [ ] Task 11.1: Implement Class Name Utility

**Description:** Create cn utility for merging Tailwind classes.

**Technical Details:**

- Use clsx for conditional classes
- Use twMerge for Tailwind deduplication

**File:** `lib/utils/cn.ts`

**Implementation:**

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Success Criteria:**

- Utility function works
- Classes merge properly

---

### [ ] Task 11.2: Copy Persian Text Constants

**Description:** Copy Persian language constants from original project.

**Technical Details:**

- Copy all Persian text objects
- Maintain structure
- Update imports if needed

**Source:** `src/lib/persian-texts.ts`
**Destination:** `lib/utils/persian.ts`

**Success Criteria:**

- All text copied
- Structure maintained
- Imports working

---

### [ ] Task 11.3: Implement Jotai Atoms

**Description:** Create state atoms for chat and settings using Jotai.

**Technical Details:**

- Chat state atoms
- Settings atoms
- Model selection atom
- Theme atom

**Files:**

- `lib/atoms/chat.ts`
- `lib/atoms/settings.ts`

**Key Atoms:**

- selectedModel
- chatSettings
- theme preference
- sidebar state

**Success Criteria:**

- Atoms created
- State management working

---

## Section 12: Testing and Validation Tasks

### [ ] Task 12.1: Test tRPC Endpoints

**Description:** Verify all tRPC procedures respond correctly.

**Technical Details:**

- Test each router endpoint
- Verify type safety
- Check error handling
- Test with Postman or curl

**Endpoints to Test:**

- GET/POST `/api/trpc/threads.list`
- POST `/api/trpc/threads.create`
- POST `/api/trpc/chat.sendMessage`
- GET `/api/trpc/models.list`

**Success Criteria:**

- All endpoints responding
- Proper error messages
- Type safety maintained

---

### [ ] Task 12.2: Test Chat Streaming

**Description:** Verify chat streaming works with Ollama integration.

**Technical Details:**

- Send message to Ollama
- Verify streaming response
- Check PocketBase updates
- Test stream interruption

**Test Steps:**

1. Create new thread
2. Send test message
3. Verify streaming chunks
4. Check database updates
5. Test stop functionality

**Success Criteria:**

- Messages stream smoothly
- Database updates in real-time
- Stop button works

---

### [ ] Task 12.3: Test PocketBase Subscriptions

**Description:** Verify real-time updates via PocketBase subscriptions.

**Technical Details:**

- Test message updates
- Verify UI synchronization
- Check multiple clients
- Test connection recovery

**Success Criteria:**

- Real-time updates working
- Multi-client sync
- Reconnection handled

---

### [ ] Task 12.4: Test UI Features

**Description:** Verify all UI features work correctly.

**Technical Details:**

- Test Persian RTL layout
- Verify dark mode toggle
- Check responsive design
- Test sidebar navigation

**Checklist:**

- [ ] Persian text displays correctly
- [ ] RTL layout proper
- [ ] Dark mode toggles
- [ ] Sidebar opens/closes
- [ ] Mobile responsive
- [ ] Fonts loading

**Success Criteria:**

- All UI features functional
- No visual bugs
- Smooth interactions

---

### [ ] Task 12.5: Build and Production Test

**Description:** Verify production build completes and runs correctly.

**Technical Details:**

- Run production build
- Check for build errors
- Test production server
- Verify optimizations

**Commands:**

```bash
bun run build
bun run start
```

**Success Criteria:**

- Build completes without errors
- Production server starts
- All features work in production
- Performance acceptable

---

## Section 13: Cleanup and Optimization Tasks

### [ ] Task 13.1: Remove Unused Dependencies

**Description:** Clean up package.json removing unused dependencies.

**Technical Details:**

- Identify unused packages
- Remove safely
- Update lock file

**Success Criteria:**

- Only needed dependencies remain
- No broken imports

---

### [ ] Task 13.2: Optimize Bundle Size

**Description:** Analyze and optimize JavaScript bundle size.

**Technical Details:**

- Run bundle analyzer
- Implement code splitting
- Lazy load heavy components
- Tree shake unused code

**Success Criteria:**

- Bundle size reduced
- Initial load fast
- Code split properly

---

### [ ] Task 13.3: Add Error Boundaries

**Description:** Implement error boundaries for graceful error handling.

**Technical Details:**

- Create error boundary component
- Wrap main sections
- Show user-friendly errors
- Log errors properly

**Success Criteria:**

- Errors caught gracefully
- App doesn't crash
- Users see helpful messages

---

### [ ] Task 13.4: Document API Endpoints

**Description:** Create documentation for tRPC endpoints.

**Technical Details:**

- Document each procedure
- Include request/response types
- Add usage examples

**Success Criteria:**

- All endpoints documented
- Examples clear
- Types specified

---

## Section 14: Final Verification Tasks

### [ ] Task 14.1: Complete Feature Checklist

**Description:** Verify all required features are working.

**Checklist:**

- [ ] Chat with streaming ✅
- [ ] Thread management ✅
- [ ] Real-time updates ✅
- [ ] Model selection ✅
- [ ] Persian UI ✅
- [ ] Dark mode ✅
- [ ] Responsive design ✅
- [ ] Translation page (placeholder) ⏸️
- [ ] Image page (placeholder) ⏸️

**Success Criteria:**

- All core features working
- Placeholders in place

---

### [ ] Task 14.2: Performance Verification

**Description:** Verify application performance meets requirements.

**Metrics to Check:**

- Initial load time < 3s
- Time to interactive < 5s
- Streaming latency < 500ms
- Memory usage stable

**Success Criteria:**

- Performance acceptable
- No memory leaks
- Smooth interactions

---

### [ ] Task 14.3: Cross-browser Testing

**Description:** Test application in different browsers.

**Browsers to Test:**

- Chrome/Edge (Chromium)
- Firefox
- Safari
- Mobile browsers

**Success Criteria:**

- Works in all major browsers
- Mobile experience good
- No browser-specific bugs

---

### [ ] Task 14.4: Create Deployment Instructions

**Description:** Document deployment process for production.

**Documentation to Include:**

- Environment setup
- Build process
- Deployment steps
- Configuration requirements

**Success Criteria:**

- Clear instructions
- Reproducible deployment
- All steps documented

---

## Notes for LLM Execution

### Important Context:

1. **Working Directory:** Start all tasks from the project root
2. **Existing Project:** Original code is in parent directory
3. **Services Required:** PocketBase (port 8090) and Ollama (port 11434) must be running
4. **Type Safety:** Always maintain TypeScript type safety
5. **Persian Support:** Ensure RTL and Persian text work correctly

### Common Pitfalls to Avoid:

1. Don't forget 'use client' directive for client components
2. Remember to export runtime = 'edge' for API routes
3. Use proper environment variable prefixes (NEXT*PUBLIC*)
4. Maintain exact file structure for App Router
5. Copy UI components before implementing pages

### Verification Steps After Each Section:

1. Run `bun run type-check` to verify TypeScript
2. Run `bun run dev` to test in development
3. Check browser console for errors
4. Verify network requests in DevTools

### Dependencies Between Tasks:

- Complete Section 1-3 before starting Section 4
- Complete Section 4-6 before Section 7
- Complete Section 7-8 before Section 9
- UI components (9.1) needed before pages (Section 10)
- Test after each major section completion

This task list is designed to be executed sequentially, with each task building upon previous ones. Each task is self-contained with clear success criteria, making it easy for an LLM to understand and execute.
