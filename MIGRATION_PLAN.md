## Comprehensive Next.js + tRPC + Vercel AI SDK Migration Plan

### Phase 1: Project Initialization and Setup

#### 1.1 Create Next.js Project Structure
```bash
# Create new Next.js project with TypeScript and App Router
bunx create-next-app@latest persian-ai-assistant-next \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*"

cd persian-ai-assistant-next
```

#### 1.2 Install Core Dependencies
```bash
# Core tRPC packages
bun add @trpc/server @trpc/client @trpc/react-query @trpc/next

# Vercel AI SDK and providers
bun add ai @ai-sdk/react ollama-ai-provider

# State management and data fetching
bun add @tanstack/react-query@latest @tanstack/react-query-devtools
bun add jotai pocketbase

# UI components and styling
bun add @radix-ui/react-dialog @radix-ui/react-dropdown-menu \
        @radix-ui/react-label @radix-ui/react-select \
        @radix-ui/react-separator @radix-ui/react-slot \
        @radix-ui/react-switch @radix-ui/react-tabs \
        @radix-ui/react-tooltip @radix-ui/react-scroll-area \
        @radix-ui/react-avatar @radix-ui/react-collapsible

bun add lucide-react class-variance-authority clsx tailwind-merge
bun add @fontsource-variable/vazirmatn

# Utilities
bun add zod superjson react-markdown remark-gfm

# Dev dependencies
bun add -d @types/node concurrently
```

#### 1.3 Project Directory Structure
```
persian-ai-assistant-next/
├── app/
│   ├── (app)/                    # Route group for main app
│   │   ├── layout.tsx            # App layout with sidebar
│   │   ├── page.tsx              # Home page
│   │   ├── chat/
│   │   │   ├── page.tsx          # New chat page
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Existing chat page
│   │   ├── translation/          # Placeholder
│   │   │   └── page.tsx
│   │   └── image/                # Placeholder
│   │       └── page.tsx
│   ├── api/
│   │   └── trpc/
│   │       └── [trpc]/
│   │           └── route.ts      # tRPC HTTP handler
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Global styles
│   └── providers.tsx             # Client providers wrapper
│
├── server/
│   ├── trpc/
│   │   ├── trpc.ts              # tRPC initialization
│   │   ├── context.ts           # Request context creation
│   │   └── middleware.ts        # Auth & logging middleware
│   ├── routers/
│   │   ├── _app.ts              # Root router composition
│   │   ├── chat.ts              # Chat procedures
│   │   ├── threads.ts           # Thread CRUD procedures
│   │   ├── messages.ts          # Message procedures
│   │   └── models.ts            # Model listing procedures
│   ├── services/
│   │   ├── pocketbase.ts        # PocketBase client & helpers
│   │   ├── ollama.ts            # Ollama integration
│   │   └── streaming.ts         # Streaming utilities
│   └── types/
│       └── pocketbase-types.ts  # Generated PocketBase types
│
├── lib/
│   ├── trpc/
│   │   ├── client.ts            # tRPC client configuration
│   │   └── server.ts            # Server-side tRPC helpers
│   ├── hooks/
│   │   ├── use-chat.ts          # Chat hook with AI SDK
│   │   ├── use-threads.ts       # Thread management
│   │   └── use-subscriptions.ts # PocketBase subscriptions
│   ├── atoms/                   # Jotai atoms
│   │   ├── chat.ts
│   │   └── settings.ts
│   ├── utils/
│   │   ├── cn.ts                # Class name utility
│   │   └── persian.ts           # Persian text constants
│   └── pocketbase.ts            # Client-side PB instance
│
├── components/
│   ├── ui/                      # shadcn/ui components
│   ├── chat/
│   │   ├── message.tsx
│   │   ├── chat-input.tsx
│   │   └── message-list.tsx
│   └── layout/
│       ├── sidebar.tsx
│       └── header.tsx
│
├── public/                      # Static assets
├── .env.local                   # Environment variables
├── next.config.js              # Next.js configuration
├── tailwind.config.ts          # Tailwind configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Project dependencies
```

### Phase 2: tRPC Server Implementation

#### 2.1 tRPC Initialization (`server/trpc/trpc.ts`)
```typescript
import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';
import type { Context } from './context';

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

// Export reusable router and procedure helpers
export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;

// Create middleware for procedures that need auth
export const authedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // user is non-nullable now
    },
  });
});
```

#### 2.2 Context Creation (`server/trpc/context.ts`)
```typescript
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { pb } from '../services/pocketbase';
import type { User } from '../types/pocketbase-types';

export async function createContext(opts: FetchCreateContextFnOptions) {
  const { req, resHeaders } = opts;
  
  // Extract auth token from headers if present
  const authHeader = req.headers.get('authorization');
  let user: User | null = null;
  
  if (authHeader) {
    try {
      // Validate token with PocketBase
      pb.authStore.loadFromCookie(authHeader);
      if (pb.authStore.isValid) {
        user = pb.authStore.model as User;
      }
    } catch (error) {
      console.error('Auth validation error:', error);
    }
  }
  
  return {
    req,
    resHeaders,
    user,
    pb, // PocketBase instance
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
```

#### 2.3 Chat Router with Streaming (`server/routers/chat.ts`)
```typescript
import { z } from 'zod';
import { router, publicProcedure } from '../trpc/trpc';
import { TRPCError } from '@trpc/server';
import { streamText, convertToCoreMessages } from 'ai';
import { ollama } from 'ollama-ai-provider';
import { observable } from '@trpc/server/observable';
import { EventEmitter } from 'events';

// Define message status enum matching PocketBase schema
const MessageStatus = {
  idle: 'idle',
  reasoning: 'reasoning',
  streaming: 'streaming',
  finished: 'finished',
  errored: 'errored',
  stopped: 'stopped',
} as const;

export const chatRouter = router({
  // Send message with streaming response
  sendMessage: publicProcedure
    .input(
      z.object({
        message: z.string().min(1),
        threadId: z.string(),
        model: z.string(),
      })
    )
    .subscription(async ({ input, ctx }) => {
      // Create event emitter for streaming
      const ee = new EventEmitter();
      
      // Fetch existing messages from thread
      const messages = await ctx.pb.collection('messages').getList(1, 100, {
        filter: `thread = "${input.threadId}"`,
        sort: 'created',
      });
      
      // Convert to AI SDK format
      const coreMessages = convertToCoreMessages(messages.items);
      coreMessages.push({ role: 'user', content: input.message });
      
      // Create user message in database
      const userMessage = await ctx.pb.collection('messages').create({
        threadId: input.threadId,
        content: input.message,
        role: 'user',
        status: MessageStatus.finished,
        model: input.model,
      });
      
      // Create assistant message placeholder
      const assistantMessage = await ctx.pb.collection('messages').create({
        threadId: input.threadId,
        content: '',
        role: 'assistant',
        status: MessageStatus.idle,
        model: input.model,
      });
      
      // Start streaming
      (async () => {
        let accumulatedContent = '';
        let accumulatedReasoning = '';
        
        try {
          // Update status to streaming
          await ctx.pb.collection('messages').update(assistantMessage.id, {
            status: MessageStatus.streaming,
          });
          
          // Stream from Ollama
          const result = await streamText({
            model: ollama(input.model),
            messages: coreMessages,
            onChunk: ({ chunk }) => {
              if (chunk.type === 'text-delta') {
                accumulatedContent += chunk.textDelta;
                
                // Parse reasoning tokens if present
                const { reasoning, response } = parseReasoningTokens(accumulatedContent);
                accumulatedReasoning = reasoning;
                
                ee.emit('data', {
                  type: 'delta',
                  content: chunk.textDelta,
                  messageId: assistantMessage.id,
                });
              }
            },
          });
          
          // Final update
          await ctx.pb.collection('messages').update(assistantMessage.id, {
            content: accumulatedContent,
            reasoning: accumulatedReasoning,
            status: MessageStatus.finished,
          });
          
          ee.emit('data', {
            type: 'complete',
            content: accumulatedContent,
            reasoning: accumulatedReasoning,
            messageId: assistantMessage.id,
          });
        } catch (error) {
          await ctx.pb.collection('messages').update(assistantMessage.id, {
            status: MessageStatus.errored,
          });
          
          ee.emit('error', error);
        }
      })();
      
      return observable<StreamEvent>((observer) => {
        ee.on('data', (data) => observer.next(data));
        ee.on('error', (error) => observer.error(error));
        
        return () => {
          ee.removeAllListeners();
        };
      });
    }),
    
  // Alternative: HTTP streaming endpoint for Vercel AI SDK useChat
  streamChat: publicProcedure
    .input(
      z.object({
        messages: z.array(
          z.object({
            role: z.enum(['user', 'assistant', 'system']),
            content: z.string(),
          })
        ),
        model: z.string(),
        threadId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await streamText({
        model: ollama(input.model),
        messages: input.messages,
      });
      
      // Return AI SDK compatible stream
      return result.toAIStreamResponse();
    }),
});

// Helper to parse reasoning tokens
function parseReasoningTokens(text: string) {
  const reasoningMatch = text.match(/<reasoning>(.*?)<\/reasoning>/s);
  const reasoning = reasoningMatch ? reasoningMatch[1] : '';
  const response = text.replace(/<reasoning>.*?<\/reasoning>/s, '').trim();
  return { reasoning, response };
}

type StreamEvent = 
  | { type: 'delta'; content: string; messageId: string }
  | { type: 'complete'; content: string; reasoning: string; messageId: string }
  | { type: 'error'; error: unknown };
```

#### 2.4 Thread Router (`server/routers/threads.ts`)
```typescript
import { z } from 'zod';
import { router, publicProcedure } from '../trpc/trpc';

export const threadRouter = router({
  // List all threads
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        archived: z.boolean().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const filter = input.archived !== undefined 
        ? `isArchived = ${input.archived}`
        : '';
        
      return await ctx.pb.collection('threads').getList(
        input.offset / input.limit + 1,
        input.limit,
        {
          filter,
          sort: '-lastMessageAt',
        }
      );
    }),
    
  // Get single thread
  get: publicProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
      return await ctx.pb.collection('threads').getOne(input);
    }),
    
  // Create new thread
  create: publicProcedure
    .input(
      z.object({
        title: z.string().default('گفتگوی جدید'),
        model: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await ctx.pb.collection('threads').create({
        title: input.title,
        isArchived: false,
        lastMessageAt: new Date().toISOString(),
      });
    }),
    
  // Update thread
  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        isArchived: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      return await ctx.pb.collection('threads').update(id, data);
    }),
    
  // Delete thread
  delete: publicProcedure
    .input(z.string())
    .mutation(async ({ input, ctx }) => {
      return await ctx.pb.collection('threads').delete(input);
    }),
});
```

#### 2.5 Root Router Composition (`server/routers/_app.ts`)
```typescript
import { router } from '../trpc/trpc';
import { chatRouter } from './chat';
import { threadRouter } from './threads';
import { messageRouter } from './messages';
import { modelRouter } from './models';

export const appRouter = router({
  chat: chatRouter,
  threads: threadRouter,
  messages: messageRouter,
  models: modelRouter,
});

// Export type for client
export type AppRouter = typeof appRouter;
```

### Phase 3: tRPC Client Configuration

#### 3.1 tRPC Client Setup (`lib/trpc/client.ts`)
```typescript
import { createTRPCReact } from '@trpc/react-query';
import { createTRPCNext } from '@trpc/next';
import { httpBatchLink, loggerLink, splitLink, wsLink } from '@trpc/client';
import { createWSClient } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '@/server/routers/_app';

function getBaseUrl() {
  if (typeof window !== 'undefined') return '';
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

// For subscriptions
const wsClient = typeof window !== 'undefined'
  ? createWSClient({
      url: `ws://localhost:3001`, // WebSocket server for subscriptions
    })
  : null;

export const trpc = createTRPCNext<AppRouter>({
  config(opts) {
    return {
      transformer: superjson,
      links: [
        loggerLink({
          enabled: (op) =>
            process.env.NODE_ENV === 'development' ||
            (op.direction === 'down' && op.result instanceof Error),
        }),
        splitLink({
          condition(op) {
            return op.type === 'subscription';
          },
          true: wsLink({
            client: wsClient!,
          }),
          false: httpBatchLink({
            url: `${getBaseUrl()}/api/trpc`,
            headers() {
              // Include auth headers if available
              const token = localStorage.getItem('pb_auth');
              return token ? { authorization: token } : {};
            },
          }),
        }),
      ],
      queryClientConfig: {
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            refetchOnWindowFocus: false,
          },
        },
      },
    };
  },
  ssr: false, // We'll handle SSR manually where needed
});

// Export hooks for client components
export const api = trpc;
```

#### 3.2 App Providers (`app/providers.tsx`)
```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Provider as JotaiProvider } from 'jotai';
import { ThemeProvider } from 'next-themes';
import { api } from '@/lib/trpc/client';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            refetchOnWindowFocus: false,
          },
        },
      })
  );
  
  const [trpcClient] = useState(() =>
    api.createClient({
      // Client configuration
    })
  );
  
  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <JotaiProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <ReactQueryDevtools initialIsOpen={false} />
          </ThemeProvider>
        </JotaiProvider>
      </QueryClientProvider>
    </api.Provider>
  );
}
```

### Phase 4: Next.js Route Handler

#### 4.1 tRPC Route Handler (`app/api/trpc/[trpc]/route.ts`)
```typescript
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/routers/_app';
import { createContext } from '@/server/trpc/context';
import { NextRequest } from 'next/server';

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext,
    onError:
      process.env.NODE_ENV === 'development'
        ? ({ path, error }) => {
            console.error(
              `❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`
            );
          }
        : undefined,
  });

export { handler as GET, handler as POST };

// Enable edge runtime for better performance
export const runtime = 'edge';
```

### Phase 5: Client-Side Implementation

#### 5.1 Chat Hook with Vercel AI SDK (`lib/hooks/use-chat.ts`)
```typescript
import { useChat as useAIChat } from '@ai-sdk/react';
import { api } from '@/lib/trpc/client';
import { useEffect, useRef } from 'react';
import { pb } from '@/lib/pocketbase';
import type { MessagesRecord } from '@/server/types/pocketbase-types';

export function useChat(threadId?: string) {
  const subscriptionRef = useRef<(() => void) | null>(null);
  
  // Use Vercel AI SDK's useChat for streaming
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit: originalHandleSubmit,
    isLoading,
    error,
    append,
    setMessages,
  } = useAIChat({
    api: '/api/chat', // Custom endpoint we'll create
    id: threadId,
    onFinish: async (message) => {
      // Update PocketBase after message completes
      if (threadId) {
        await pb.collection('messages').create({
          threadId,
          content: message.content,
          role: message.role,
          status: 'finished',
        });
      }
    },
  });
  
  // Subscribe to PocketBase for real-time updates
  useEffect(() => {
    if (!threadId) return;
    
    const subscribe = async () => {
      subscriptionRef.current = await pb
        .collection('messages')
        .subscribe<MessagesRecord>('*', (e) => {
          if (e.record.thread !== threadId) return;
          
          // Update local messages when PocketBase updates
          if (e.action === 'create' || e.action === 'update') {
            setMessages((prev) => {
              const exists = prev.find((m) => m.id === e.record.id);
              if (exists) {
                return prev.map((m) =>
                  m.id === e.record.id
                    ? { ...m, content: e.record.content }
                    : m
                );
              }
              return [
                ...prev,
                {
                  id: e.record.id,
                  role: e.record.role as 'user' | 'assistant',
                  content: e.record.content,
                },
              ];
            });
          }
        });
    };
    
    subscribe();
    
    return () => {
      if (subscriptionRef.current) {
        pb.collection('messages').unsubscribe();
      }
    };
  }, [threadId, setMessages]);
  
  // Custom submit handler
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!threadId) {
      console.error('No thread ID provided');
      return;
    }
    
    await originalHandleSubmit(e);
  };
  
  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    append,
  };
}
```

#### 5.2 Chat Page Component (`app/(app)/chat/[id]/page.tsx`)
```typescript
'use client';

import { useParams } from 'next/navigation';
import { api } from '@/lib/trpc/client';
import { useChat } from '@/lib/hooks/use-chat';
import { ChatInput } from '@/components/chat/chat-input';
import { MessageList } from '@/components/chat/message-list';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEffect, useRef } from 'react';

export default function ChatPage() {
  const params = useParams();
  const threadId = params.id as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Fetch thread data
  const { data: thread } = api.threads.get.useQuery(threadId, {
    enabled: !!threadId,
  });
  
  // Use custom chat hook with Vercel AI SDK
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
  } = useChat(threadId);
  
  // Fetch available models
  const { data: models } = api.models.list.useQuery();
  
  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  return (
    <div className="flex h-full flex-col">
      {/* Messages Area */}
      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-4xl px-6 py-8 pb-32">
          <MessageList messages={messages} />
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      {/* Input Area */}
      <div className="sticky bottom-0 border-t bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-4xl">
          <form onSubmit={handleSubmit}>
            <ChatInput
              value={input}
              onChange={handleInputChange}
              isLoading={isLoading}
              models={models}
              placeholder="پیام خود را بنویسید..."
            />
          </form>
        </div>
      </div>
    </div>
  );
}
```

### Phase 6: PocketBase Integration

#### 6.1 Server-side PocketBase Client (`server/services/pocketbase.ts`)
```typescript
import PocketBase from 'pocketbase';
import type { TypedPocketBase } from '../types/pocketbase-types';

// Server-side PocketBase instance
export const pb = new PocketBase(
  process.env.POCKETBASE_URL || 'http://localhost:8090'
) as TypedPocketBase;

// Disable auto-cancellation for server-side
pb.autoCancellation(false);

// Helper functions for common operations
export const pocketbase = {
  async getMessages(threadId: string, limit = 100) {
    return pb.collection('messages').getList(1, limit, {
      filter: `thread = "${threadId}"`,
      sort: 'created',
    });
  },
  
  async createMessage(data: {
    threadId: string;
    content: string;
    role: 'user' | 'assistant';
    status: string;
    model?: string;
  }) {
    return pb.collection('messages').create(data);
  },
  
  async updateMessage(id: string, data: Partial<any>) {
    return pb.collection('messages').update(id, data);
  },
  
  async getThread(id: string) {
    return pb.collection('threads').getOne(id);
  },
  
  async createThread(title: string) {
    return pb.collection('threads').create({
      title,
      isArchived: false,
      lastMessageAt: new Date().toISOString(),
    });
  },
};
```

#### 6.2 Client-side PocketBase (`lib/pocketbase.ts`)
```typescript
import PocketBase from 'pocketbase';
import type { TypedPocketBase } from '@/server/types/pocketbase-types';

// Client-side PocketBase instance
export const pb = new PocketBase(
  process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090'
) as TypedPocketBase;

// Enable auto-cancellation for client-side
pb.autoCancellation(true);

// Auth helpers
export const auth = {
  async login(email: string, password: string) {
    return pb.collection('users').authWithPassword(email, password);
  },
  
  async logout() {
    pb.authStore.clear();
  },
  
  get user() {
    return pb.authStore.model;
  },
  
  get isValid() {
    return pb.authStore.isValid;
  },
};
```

### Phase 7: Configuration Files

#### 7.1 Next.js Configuration (`next.config.js`)
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features
  experimental: {
    // Server Actions for tRPC procedures
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  
  // Rewrites for proxying to PocketBase
  async rewrites() {
    return [
      {
        source: '/pb/:path*',
        destination: 'http://localhost:8090/:path*',
      },
    ];
  },
  
  // Headers for CORS if needed
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ];
  },
  
  // Image domains for avatars
  images: {
    domains: ['localhost'],
  },
};

module.exports = nextConfig;
```

#### 7.2 TypeScript Configuration (`tsconfig.json`)
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

#### 7.3 Environment Variables (`.env.local`)
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

#### 7.4 Package.json Scripts
```json
{
  "name": "persian-ai-assistant-next",
  "version": "0.1.0",
  "private": true,
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

### Phase 8: Migration Strategy

#### 8.1 Data Migration Steps
1. **Keep PocketBase database intact** - No changes needed
2. **Generate TypeScript types** from existing schema
3. **Test database connections** before migrating components

#### 8.2 Component Migration Order
1. **UI Components** - Direct copy with minor adjustments
2. **Layout Components** - Convert to Next.js App Router layouts
3. **Chat Components** - Integrate with new tRPC/AI SDK hooks
4. **Thread Management** - Use tRPC queries instead of direct API calls

#### 8.3 Feature Migration Priority
1. **Core Chat Functionality** ✅
   - Message streaming with Ollama
   - Thread creation and management
   - Real-time updates via PocketBase

2. **UI Features** ✅
   - Persian RTL support
   - Dark/light mode toggle
   - Responsive sidebar

3. **Placeholder Features** ⏸️
   - Translation (create empty route)
   - Image generation (create empty route)
   - PDF upload (create empty route)

### Phase 9: Testing & Validation

#### 9.1 Testing Checklist
- [ ] tRPC endpoints respond correctly
- [ ] Chat streaming works with Ollama
- [ ] PocketBase subscriptions update UI
- [ ] Thread CRUD operations work
- [ ] Persian text displays correctly
- [ ] Dark mode toggles properly
- [ ] Build completes without errors
- [ ] Production build runs correctly

#### 9.2 Performance Optimizations
1. **Use React Server Components** where possible
2. **Implement proper caching** with tRPC query client
3. **Enable ISR** for static pages
4. **Use dynamic imports** for heavy components
5. **Optimize bundle size** with tree shaking

### Phase 10: Deployment Preparation

#### 10.1 Build Process
```bash
# Build Next.js app
bun run build

# Build PocketBase (keep existing)
go build -o persian-ai-assistant main.go
```

#### 10.2 Production Considerations
1. **Environment variables** for production URLs
2. **CORS configuration** for API access
3. **Rate limiting** on tRPC procedures
4. **Error tracking** with Sentry or similar
5. **Monitoring** with Vercel Analytics

### Summary of Key Technical Decisions

1. **tRPC over REST** - Type-safe API with automatic client generation
2. **Vercel AI SDK** - Streamlined AI integration with built-in streaming
3. **App Router** - Modern Next.js patterns with RSC support
4. **Bun** - Fast package management and runtime
5. **PocketBase subscriptions** - Keep real-time functionality
6. **Ollama provider** - Local LLM inference unchanged
7. **Superjson transformer** - Handle Date/Map/Set serialization
8. **Edge runtime** - Better performance for API routes