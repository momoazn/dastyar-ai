# Summarize Feature — Product Requirements Document

## 1. Objective

Enable users to generate high‑quality summaries from arbitrary text (and later transcripts) using the app’s existing model selection, request/response patterns, and UI conventions (RTL-first, TanStack Router, ORPC, React Query). Introduce a new Summarize section accessible from the sidebar, mirroring established Translation/Transcribe UX.

## 2. Scope

- In-scope (v1):
  - Paste/Type text input and get a generated summary.
  - Select model from existing models list (orpc.models.list).
  - Select summarization mode (Concise, Standard, Detailed) and optional style options.
  - Copy summary to clipboard.
  - Persist past summaries in server DB and render a list in the right sidebar when on /summarize (same pattern as translations list and chat threads).
  - Basic analytics and error handling consistent with Translation and Transcribe.
- Near-term (v1.1 – optional):
  - Summarize directly from a transcribe result (Send to Summarize action).
  - Support “Key points” and “Action items” structured variants.
- Out of scope (v1):
  - Multi-document summarization.
  - File uploads (PDF/Docx) — can be considered later.

## 3. User Stories

- As a user, I can open the Summarize section from the sidebar to summarize text.
- As a user, I can select a model and a summarization mode and generate a summary quickly.
- As a user, I can revisit my previous summaries from the sidebar list on the Summarize page and delete entries I no longer need.
- As a user, I can copy the generated summary with one click.
- As a user, I see localized (Persian) labels and keyboard hints consistent with the rest of the app.

## 4. UX and IA

- Navigation:
  - Add a new main nav item "خلاصه‌سازی" (Summarize) at url: `/summarize`, using established nav.ts patterns and fa.
- Page layout (mirror of Translation page):
  - Header controls grid with: Mode selector, Optional style selector, Model selector.
  - Main content with two cards stacked vertically on small screens: "Source Text" (textarea with char counter and ⌘/Ctrl+Enter hint) and "Summary" (textarea read-only with copy button).
  - Primary action button at the bottom-right (Generate Summary) disabled unless input and model are present; supports ⌘/Ctrl+Enter.
- Sidebar list (right side):
  - When on /summarize, the right sidebar lists previous summaries (title = first 30 characters of source text), following translations-list.tsx pattern (active indicator, delete action, navigation via query state or params).
- RTL/I18N:
  - Use fa.summarize namespace similar to translation/transcribe keys for titles, labels, buttons, empty states, error messages.

## 5. Functional Requirements

- Modes
  - Concise: 1–2 sentences.
  - Standard: ~1 paragraph.
  - Detailed: multiple paragraphs including key highlights.
- Optional style options (future-proofed, v1 may include 1–2):
  - Tone: neutral | formal | casual (re-use tones from translation if available), and/or Audience: general | technical.
- Persistence
  - Store: id, sourceText, summaryText, modelId, mode, tone (optional), createdAt.
  - Expose list/get/delete over ORPC like translations.
- Model selection
  - Query enabled models via orpc.models.list({ isEnabled: true }).
  - Default selection behavior mirrors chat/translation: last used model persisted in localStorage under a new key ai:lastSummarizeModelId.
- Performance & Limits
  - Client-side character count display; server-side input size cap (e.g., 8,000 chars) to prevent excessive prompt cost; show validation error.
  - Debounce submission on hotkey to avoid duplicate requests.
- Accessibility
  - Keyboard: ⌘/Ctrl+Enter to submit; buttons and inputs have aria labels.

## 6. Server API (ORPC)

Add a new summarize namespace aligned with existing patterns in apps/server/src/orpc/procedures.ts:

- summarize.list: list all summaries (latest first). Input: none. Output: Array<{ id, sourceText, summaryText, mode, tone?, modelId, createdAt }>.
- summarize.get: input { id: string } -> row.
- summarize.delete: input { id: string } -> { ok: true }.
- summarize.create: input {
  text: string (min 1),
  mode: 'concise' | 'standard' | 'detailed',
  tone?: 'neutral' | 'formal' | 'casual',
  modelId: string
  } -> returns created row with summaryText.
  Implementation details:
- Use getProviderForModel to resolve model.
- Use generateText with a mode-specific system prompt and user prompt as input text.
- Prefer JSON-shaped return contract like translations: attempt structured JSON {"summaryText": "..."}; fallback to plain text extractor if JSON parsing fails.
- Persist row in a new summaries table similar to translations with drizzle schema.

## 7. Data Model (Drizzle)

- Table: summaries
  - id: text (pk)
  - sourceText: text
  - summaryText: text
  - modelId: text (fk to models.id)
  - mode: text ('concise' | 'standard' | 'detailed')
  - tone: text | null
  - createdAt: integer (timestamp) default now
    Indexes: createdAt desc for list; modelId for filters.

## 8. Prompts and Modes

- System templates (pseudo):
  - Concise: "Summarize the user's text in 1–2 sentences. Preserve key meaning. Respond ONLY as JSON: {\"summaryText\": \"...\"}."
  - Standard: "Summarize the user's text in a single concise paragraph..."
  - Detailed: "Summarize with multiple paragraphs. Include key points where appropriate..."
- Include tone if provided: "Use a [tone] tone." Ensure to strip <think> blocks; reuse THINK_BLOCK and extraction helpers as in translations.

## 9. Web App (apps/web)

- Route: /summarize using createFileRoute('/summarize') with TanStack Router.
- Component behaviors:
  - State: sourceText, summaryText, mode, tone?, modelId.
  - useQuery to load model list; default select behavior mirrors chat/translation.
  - useMutation for orpc.summarize.create; onSuccess: set summaryText and trigger sidebar list invalidation.
  - Keyboard handler for ⌘/Ctrl+Enter.
  - Copy button for summaryText.
- Sidebar integration:
  - New SummariesList component, conditional render on pathname.startsWith('/summarize'), modeled after translations-list.tsx with list/get/delete.
- Localization:
  - Add fa.summarize: { title, description, modeLabel, modes: { concise, standard, detailed }, model, enterText, generating, generatedText, copy, delete, emptyState, errors: { modelNotFound, requestFailed, textTooLong } }.

## 10. Navigation and Texts

- Add nav item to apps/web/src/components/sidebar/nav.ts
  - title: fa.navigation.summarize
  - url: '/summarize'
  - icon: likely FileText or BookOpen (lucide-react).
- Update fa in apps/web/src/lib/persian-texts.ts with navigation.summarize and summarize namespace keys.

## 11. Analytics & Metrics

- Track count of summarize.create calls, mode distribution, average latency, error rate.
- Client events: click generate, copy summary, delete summary.
- Success metrics:
  - p50/p95 latency under target (e.g., p95 < 6s with local providers).
  - User retention on Summarize page; number of summaries per session.

## 12. Error Handling

- Show destructive Alert when the mutation fails with message from server.
- Graceful model not found or disabled; prompt user to select another.
- Validation for empty input or over max length.

## 13. Security & Privacy

- Do not log full sourceText in server logs. Store content in DB as designed; avoid over-logging.
- Respect existing provider env configuration and avoid leaking secrets.

## 14. Rollout Plan

- Backend: add summaries table + orpc.summarize procedures; migrate DB.
- Frontend: add route, nav item, localized texts, SummariesList in sidebar.
- Seed prompts/mode constants; verify with dev models (Ollama/LMStudio priority ordering is already present).
- Launch flag: optional env flag to enable nav item.

## 15. Open Questions

- Should we support markdown output for Detailed mode? (v1 can keep plain text; the JSON carries summaryText string which may include markdown.)
- Should summaries be shareable via link? (Probably out of scope for v1.)
- Max input size and truncation strategy if needed.
