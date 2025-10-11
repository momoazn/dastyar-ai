## Image Conversations (Threaded Image Generation) — Minimal Plan

Goal: Mirror chat threads for images. Each user prompt → one generated image stored under an image thread. Replace old image flow entirely (no legacy/back-compat).

### 1) Schema (Prisma)

- Add `ImageThread { id, title, isArchived, lastImageAt?, createdAt, updatedAt }`.
- Add required `GeneratedImage.imageThreadId Int` + relation to `ImageThread` + index.
- Remove reliance on global images list (all images belong to a thread).

### 2) Server

- Repos:
  - `image-threads.ts`: create, list (order by lastImageAt desc), get, rename, archive, delete, touchLastImageAt.
  - Update `images.ts`: listByThread(threadId asc), create requires `imageThreadId`, clearByThread.
- RPC:
  - `imageThreads`: create, list, get, rename, archive, delete.
  - `images`: listByThread({ threadId }), clearByThread({ threadId }), generate({ ..., threadId }) → set imageThreadId + touch.
  - Remove legacy global `images.list/get/clear` endpoints.
  - Wire into `appRouter`.

### 3) Web

- Hooks:
  - New `use-image-threads.ts` (list/get + create/rename/archive/delete).
  - Update `use-image-generation.ts` to be thread-only: listByThread + generate({ ..., threadId }). Remove global list.
- Routes (replace old image pages):
  - `/image` (index): like chat index. Button “New Image Chat” → create → navigate to `/image/$id`.
  - `/image/$id`: image thread conversation using Conversation + PromptInput; query images.listByThread; on submit call generate with threadId; first prompt renames thread; per-image actions: download.
  - Remove old global history and image-details page; if needed, show minimal inline details with badges.
- Sidebar: replace existing Images entry with Image Chats (points to `/image`).

### 4) Cleanup

- Delete legacy UI and code paths for single-shot image generation and global history.
- Remove unused RPCs and web queries tied to legacy flow.

### 5) Done When

- Can create image thread, send prompts, see images appear in order, thread auto-renames on first prompt, sidebar updates by lastImageAt. Old image flow removed.
