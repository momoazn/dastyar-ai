## Image Conversations — TODO

Goal: Rebuild image generation as thread-only (no legacy). Each prompt → one image under an image thread.

### Schema (Prisma)

- [ ] Add `ImageThread { id, title, isArchived, lastImageAt?, createdAt, updatedAt }`.
- [ ] Add required `GeneratedImage.imageThreadId Int` + relation to `ImageThread` + index.
- [ ] Remove reliance on global images (all images must reference a thread).
- [ ] Generate and apply Prisma migration.

### Server — Repositories

- [ ] Create `repositories/image-threads.ts` with:
  - create, list (order by `lastImageAt` desc), get, rename, archive, delete
  - `touchLastImageAt(threadId, date?)`
- [ ] Update `repositories/images.ts` to be thread-only:
  - `createGeneratedImage` requires `imageThreadId`
  - `listGeneratedImagesByThread(threadId)` (ordered by `createdAt` asc)
  - `clearGeneratedImagesByThread(threadId)`

### Server — Procedures (RPC)

- [ ] Add `procedures/image-threads.ts`: create, list, get, rename, archive, delete.
- [ ] Update `procedures/images.ts`:
  - `generate({ ..., threadId })` → persist with `imageThreadId` + `touchLastImageAt`
  - `listByThread({ threadId })`, `clearByThread({ threadId })`
  - Remove legacy global `images.list/get/clear` endpoints
- [ ] Wire in `procedures/index.ts` with `imageThreads` and updated `images`.

### Web — Hooks

- [ ] Add `hooks/use-image-threads.ts` (list/get + create/rename/archive/delete; invalidate queries on success).
- [ ] Refactor `hooks/use-image-generation.ts` to thread-only:
  - query `images.listByThread`
  - `generate({ ..., threadId })`

### Web — Routes

- [ ] Replace `/image` index with Image Chat index:
  - Single button “New Image Chat” → create thread → navigate to `/image/$id`
- [ ] Implement `/image/$id` conversation view:
  - Query `images.listByThread({ threadId })`
  - Show user prompt and assistant image (badges: size, sampler, steps, cfg)
  - Input uses existing PromptInput + advanced settings; submit calls `generate` with `threadId`
  - On first prompt in empty thread, rename thread from prompt prefix
- [ ] Remove old global history and details page.

### Sidebar

- [ ] Replace Images entry with Image Chats list:
  - List threads (order by `lastImageAt` desc)
  - Actions: create, rename, archive, delete
  - Link to `/image` (index) and `/image/$id`

### i18n

- [ ] Add/adjust labels for Image Chats (sidebar title, actions, empty states).

### Cleanup

- [ ] Remove legacy RPCs, queries, and unused code tied to single-shot images.
- [ ] Delete dead routes/components and imports.

### QA

- [ ] Create image thread → send first prompt → thread auto-renames.
- [ ] Subsequent prompts append images in order; badges render correctly.
- [ ] Sidebar orders by `lastImageAt`; archive/delete behave correctly.
- [ ] Image download works from thread view.

### Docs

- [ ] Update docs/notes to reflect the new thread-only image flow.
