## Image Conversations (Threaded Image Generation) — Detailed Plan

Goal: Rebuild image generation around threads (like chat). Each user prompt creates a single generated image in that thread. Replace old global image flow entirely.

### 0) Overview

- New entity: ImageThread
- All images are created within a thread; no global image listing/details page
- Web mirrors chat UX: `/image` index → create thread; `/image/$id` thread conversation view

### 1) Schema (Prisma)

- Add `ImageThread` model and make `GeneratedImage.imageThreadId` required.
- Suggested Prisma schema changes:

```prisma
model ImageThread {
  id            Int              @id @default(autoincrement())
  title         String
  isArchived    Boolean          @default(false)
  lastImageAt   DateTime?
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt

  images        GeneratedImage[]

  @@map("image_threads")
}

model GeneratedImage {
  id             Int          @id @default(autoincrement())
  prompt         String
  negativePrompt String?
  filePath       String
  fileName       String
  settings       String
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  imageThreadId  Int
  thread         ImageThread  @relation(fields: [imageThreadId], references: [id], onDelete: Cascade)

  @@index([imageThreadId], name: "idx_generated_images_thread")
  @@map("generated_images")
}
```

- Migration commands (from `apps/server`):

```bash
bunx prisma generate
bunx prisma migrate dev --name image_threads
```

### 2) Server — Repositories

- Create `apps/server/src/repositories/image-threads.ts` with:

```ts
export async function createImageThread(params?: {
  title?: string;
}): Promise<{ id: number }>;
export function listImageThreads(options?: {
  includeArchived?: boolean;
}): Promise<ImageThread[]>; // order by lastImageAt desc, updatedAt desc
export async function getImageThread(id: number): Promise<ImageThread | null>;
export async function renameImageThread(
  id: number,
  title: string
): Promise<void>;
export async function setImageThreadArchived(
  id: number,
  isArchived: boolean
): Promise<void>;
export async function deleteImageThread(id: number): Promise<void>;
export async function touchLastImageAt(
  threadId: number,
  date?: Date
): Promise<void>;
```

- Update `apps/server/src/repositories/images.ts`:
  - Change `createGeneratedImage` signature to require `imageThreadId` and persist it
  - Add `listGeneratedImagesByThread(threadId: number): Promise<GeneratedImage[]>` (order by `createdAt` asc)
  - Add `clearGeneratedImagesByThread(threadId: number): Promise<void>`

### 3) Server — Procedures (RPC)

- Add `apps/server/src/procedures/image-threads.ts` (mirror of `threads.ts`):

```ts
export const imageThreadProcedures = {
  create: publicProcedure
    .input(z.object({ title: z.string().optional() }).optional())
    .handler(async ({ input }) => createImageThread({ title: input?.title })),
  list: publicProcedure.handler(async () =>
    listImageThreads({ includeArchived: false })
  ),
  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => getImageThread(input.id)),
  rename: publicProcedure
    .input(z.object({ id: z.number(), title: z.string().min(1) }))
    .handler(async ({ input }) => {
      await renameImageThread(input.id, input.title);
      return { ok: true } as const;
    }),
  archive: publicProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await setImageThreadArchived(input.id, true);
      return { ok: true } as const;
    }),
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await deleteImageThread(input.id);
      return { ok: true } as const;
    }),
};
```

- Update `apps/server/src/procedures/images.ts`:

  - Input for `generate` must include `threadId: z.number().int().positive()` alongside current SD params
  - On success: persist with `imageThreadId = threadId`, then `touchLastImageAt(threadId)`
  - Add `listByThread({ threadId })` → fetch via repo and map to `{ id, threadId, prompt, negativePrompt, imageUrl, createdAt, settings }`
  - Add `clearByThread({ threadId })`
  - Remove legacy `list/get/clear` endpoints

- Update `apps/server/src/procedures/index.ts` to export:

```ts
export const appRouter = {
  // ...existing
  imageThreads: imageThreadProcedures,
  images: imageProcedures,
};
```

### 4) Web — Hooks

- Add `apps/web/src/hooks/use-image-threads.ts`:

```ts
export function useImageThreads() {
  const list = useQuery(orpc.imageThreads.list.queryOptions());
  const create = useMutation(
    orpc.imageThreads.create.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: orpc.imageThreads.list.queryKey(),
        }),
    })
  );
  const rename = useMutation(
    orpc.imageThreads.rename.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: orpc.imageThreads.list.queryKey(),
        }),
    })
  );
  const archive = useMutation(
    orpc.imageThreads.archive.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: orpc.imageThreads.list.queryKey(),
        }),
    })
  );
  const del = useMutation(
    orpc.imageThreads.delete.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: orpc.imageThreads.list.queryKey(),
        }),
    })
  );
  return { list, create, rename, archive, del };
}
```

- Refactor `apps/web/src/hooks/use-image-generation.ts` (thread-only):
  - Replace global `images.list` with `images.listByThread({ threadId })`
  - Extend `generateImage`/`generateImageAsync` to require `{ threadId, ...settings }`
  - Keep `downloadImage` logic as-is

### 5) Web — Routes

- Replace old image pages with thread UX:
  - `/image` (index): Like chat index

```tsx
export const Route = createFileRoute("/image/")({
  component: () => {
    const navigate = useNavigate();
    const { create } = useImageThreads();
    const handleCreate = async () => {
      const created = await client.imageThreads.create({
        title: fa.imageChat.newChatDefaultTitle,
      });
      await queryClient.invalidateQueries({
        queryKey: orpc.imageThreads.list.queryKey(),
      });
      navigate({ to: "/image/$id", params: { id: created.id } });
    };
    return <Button onClick={handleCreate}>{fa.navigation.newImageChat}</Button>;
  },
});
```

- `/image/$id`: Conversation-style thread view

```tsx
export const Route = createFileRoute("/image/$id")({
  component: () => {
    const { id: threadId } = useParams({ from: "/image/$id" });
    const { data: images = [], refetch } = useQuery(
      orpc.images.listByThread.queryOptions({ input: { threadId } })
    );
    const { generateImageAsync, isGenerating } = useImageGeneration();
    const handleSubmit = async (
      prompt: string,
      settings: ImageGenerationParams
    ) => {
      const result = await generateImageAsync({
        ...settings,
        prompt,
        threadId,
      });
      if (result) refetch();
    };
    // Render pairs: user prompt, assistant image; reuse badges and PromptInput from existing components
    return null;
  },
});
```

### 6) Sidebar

- Update sidebar to list Image Chats (threads):
  - Data: `orpc.imageThreads.list`
  - Order: `lastImageAt ?? updatedAt` desc
  - Link items to `/image/$id`
  - Provide actions: create, rename, archive, delete (via context menu)

### 7) i18n

- Add minimal keys (example):

```ts
fa.imageChat = {
  newChatDefaultTitle: "گفتگوی تصویری جدید",
  newChatTitle: "شروع گفتگوی تصویری",
  newChatDescription: "برای شروع، یک گفتگو ایجاد کنید.",
};
```

### 8) Cleanup

- Remove legacy global image routes (`/image` gallery and `/image/$id` details) and components
- Remove RPC endpoints: `images.list`, `images.get`, `images.clear`
- Delete unused web queries and code paths

### 9) QA — Acceptance Criteria

- Create thread from `/image` and navigate to `/image/$id`
- First prompt in empty thread triggers thread rename using prompt prefix
- Generated images appear in chronological order with badges (size, sampler, steps, cfg)
- Download action works
- Sidebar orders by `lastImageAt` and reflects archive/delete actions
- No references to legacy global image list/details remain

### 10) Rollout

- Apply migration; build server and web; smoke test locally
- Optional: data backfill script to attach existing images to a default thread (if you choose to keep any data)
