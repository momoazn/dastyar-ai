## Image Conversations — TODO

Goal: Rebuild image generation as thread-only (no legacy). Each prompt → one image under an image thread.

### Schema (Prisma)

- [ ] Define `ImageThread` model in `apps/server/prisma/schema.prisma`:
  - Fields: `id`, `title`, `isArchived`, `lastImageAt?`, `createdAt`, `updatedAt`
  - Relation: `images GeneratedImage[]`
  - Mapped table: `image_threads`
- [ ] Update `GeneratedImage` model:
  - Add required `imageThreadId Int`
  - Add relation `thread ImageThread @relation(fields: [imageThreadId], references: [id], onDelete: Cascade)`
  - Add `@@index([imageThreadId], name: "idx_generated_images_thread")`
- [ ] Remove/ignore any codepaths depending on global images without a thread
- [ ] Run from `apps/server/`:
  - `bunx prisma generate`
  - `bunx prisma migrate dev --name image_threads`
  - DoD: migration applies, generated client updates

### Server — Repositories

- [ ] Create `apps/server/src/repositories/image-threads.ts`:
  - [ ] `createImageThread({ title? }): { id }` (default Farsi title if missing)
  - [ ] `listImageThreads({ includeArchived? }): ImageThread[]` (order by `lastImageAt desc, updatedAt desc`)
  - [ ] `getImageThread(id): ImageThread | null`
  - [ ] `renameImageThread(id, title): void`
  - [ ] `setImageThreadArchived(id, isArchived): void`
  - [ ] `deleteImageThread(id): void`
  - [ ] `touchLastImageAt(threadId, date?): void`
  - DoD: Unit test basic CRUD manually via a script or temporary route
- [ ] Update `apps/server/src/repositories/images.ts` (thread-only):
  - [ ] `createGeneratedImage` requires `imageThreadId`
  - [ ] Add `listGeneratedImagesByThread(threadId)` (order by `createdAt` asc)
  - [ ] Add `clearGeneratedImagesByThread(threadId)`
  - DoD: No compile errors; used by procedures below

### Server — Procedures (RPC)

- [ ] Add `apps/server/src/procedures/image-threads.ts`:
  - [ ] Endpoints: `create`, `list`, `get`, `rename`, `archive`, `delete` (use zod; mirror `threads.ts`)
  - DoD: Appears under `/rpc/imageThreads.*` with expected shapes
- [ ] Update `apps/server/src/procedures/images.ts`:
  - [ ] `generate(input)` requires `{ threadId, prompt, steps, cfg_scale, negative_prompt?, sampler_name, width, height }`
  - [ ] Persist with `imageThreadId = threadId`; call `touchLastImageAt(threadId)`
  - [ ] Add `listByThread({ threadId })`
  - [ ] Add `clearByThread({ threadId })`
  - [ ] Remove `list`, `get`, `clear` legacy endpoints
  - DoD: New endpoints work via orpc client; old ones removed from `procedures/index.ts`
- [ ] Update `apps/server/src/procedures/index.ts` to export `imageThreads` and updated `images`

### Web — Hooks

- [ ] Create `apps/web/src/hooks/use-image-threads.ts`:
  - [ ] `useImageThreads()` returns list + mutations (create/rename/archive/delete) with query invalidation
  - DoD: Used by sidebar and index page
- [ ] Refactor `apps/web/src/hooks/use-image-generation.ts` to thread-only:
  - [ ] Replace global list with `images.listByThread({ threadId })`
  - [ ] `generateImage`/`generateImageAsync` require `threadId`
  - DoD: All call-sites updated; no references to global list

### Web — Routes

- [ ] Replace `/image` index:
  - [ ] Render “New Image Chat” button that creates thread and navigates to `/image/$id`
  - DoD: Navigates to created thread id; sidebar updates after creation
- [ ] Implement `/image/$id` thread view:
  - [ ] Query `images.listByThread({ threadId })`
  - [ ] Render pairs: user block (prompt [+ negative]), assistant block (image + badges: size, sampler, steps, cfg)
  - [ ] Prompt input uses existing `PromptInput` + advanced settings area
  - [ ] On submit: call `generate({ ..., threadId })` and refresh list
  - [ ] If first prompt: rename thread to prompt prefix
  - [ ] Add download action on each image
  - DoD: UX mirrors chat; loader shown while generating
- [ ] Remove old global image history and details route/components

### Sidebar

- [ ] Replace Images entry with Image Chats:
  - [ ] Fetch `imageThreads.list`
  - [ ] Order by `lastImageAt ?? updatedAt` desc
  - [ ] Item click → `/image/$id`
  - [ ] Context actions: create, rename, archive, delete
  - DoD: List reacts to mutations; matches chat list UX

### i18n

- [ ] Add labels for Image Chats (sidebar group, buttons, empty states)
- [ ] Persian texts under `fa.imageChat` namespace (title/description/hints)
- DoD: All new UI copy resolved; no missing keys

### Cleanup

- [ ] Remove legacy RPCs and orpc client usages (`images.list`, `images.get`, `images.clear`)
- [ ] Delete legacy routes/components and imports (global image list/details)
- [ ] Remove unused UI and texts tied to old flow
- DoD: Repo greps show no references to old endpoints/routes

### QA

- [ ] Create image thread → first prompt → thread auto-renames (prefix of prompt)
- [ ] Subsequent prompts append images in chronological order
- [ ] Badges show correct size, sampler, steps, cfg
- [ ] Download button saves PNG with predictable filename
- [ ] Sidebar ordering updates after each generation; archive/delete hide from list
- [ ] No legacy pages/endpoints reachable

### Docs

- [ ] Update `docs/` with a short “Image Threads” guide (schema, RPCs, hooks, routes)
- DoD: New doc exists and is linked in README or internal docs index
