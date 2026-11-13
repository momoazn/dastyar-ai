// Demo mode: an in-browser fake of the server API, used when the web app is
// built with VITE_DEMO=true. It lets the app run as a static site (no server,
// no model servers). State lives in memory and resets on page reload.
// ponytail: answers are canned, not generated. A real backend is the upgrade.
import {
  type InferClientInputs,
  type InferClientOutputs,
  ORPCError,
} from "@orpc/client";
import type { OrpcClient } from "@/utils/orpc";
import { demoAnswer, demoCode, demoSummary, demoTranslation } from "./answers";
import { DEMO_TOKEN } from "./mode";

type C = OrpcClient;
type I = InferClientInputs<C>;
type O = InferClientOutputs<C>;
type Fn = (...args: never[]) => unknown;
// Typed against the real server router, so a wrong shape fails type-check.
type Impl = {
  [G in keyof O]?: {
    [P in keyof O[G]]?: (input: I[G][P]) => O[G][P] | Promise<O[G][P]>;
  };
};

const USER_ID = 1;
const now = () => new Date();
const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000);
let nextId = 100;
const newId = () => nextId++;

const demoOnly = () =>
  Promise.reject(
    new ORPCError("DEMO_MODE", {
      message: "این قابلیت در نسخه‌ی دمو غیرفعال است.",
    })
  );

const user = { id: USER_ID, username: "demo", role: "admin" as const };

const model = (
  id: number,
  identifier: string,
  family: string,
  size: string
) => ({
  id,
  identifier,
  provider: "ollama" as const,
  creator: null,
  family,
  size,
  isEnabled: true,
  createdAt: ago(60 * 24 * 7),
  updatedAt: ago(60 * 24 * 7),
});

const models = [
  model(1, "qwen3:4b", "qwen3", "4b"),
  model(2, "gemma3:12b", "gemma3", "12b"),
  model(3, "llama3.1:8b", "llama", "8b"),
];

const demoUser = (id: number, username: string, role: "admin" | "user") => ({
  id,
  username,
  role,
  createdAt: ago(60 * 24 * id),
  updatedAt: ago(60 * 24 * id),
  latestIps: [`192.168.1.${10 + id}`],
  ipCount: 1,
});

const demoUsers = [
  demoUser(1, "demo", "admin"),
  demoUser(2, "0012345678", "user"),
  demoUser(3, "0023456789", "user"),
];

type Thread = {
  id: number;
  title: string;
  isArchived: boolean;
  lastMessageAt: Date | null;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
};

type Message = O["messages"]["listByThread"][number];

const threads: Thread[] = [];
const messages = new Map<number, Message[]>();

const textMessage = (
  threadId: number,
  role: "user" | "assistant",
  text: string,
  at: Date
): Message => ({
  id: String(newId()),
  role,
  parts: [{ type: "text", text }],
  metadata: {
    threadId,
    modelId: 1,
    modelName: models[0].identifier,
    status: "finished",
    createdAt: at.toISOString(),
    updatedAt: at.toISOString(),
  },
});

export const addThread = (title: string, at = now()): Thread => {
  const thread = {
    id: newId(),
    title,
    isArchived: false,
    lastMessageAt: at,
    userId: USER_ID,
    createdAt: at,
    updatedAt: at,
  };
  threads.unshift(thread);
  messages.set(thread.id, []);
  return thread;
};

export const addMessage = (
  threadId: number,
  role: "user" | "assistant",
  text: string
) => {
  messages.get(threadId)?.push(textMessage(threadId, role, text, now()));
  const thread = threads.find((t) => t.id === threadId);
  if (thread) {
    thread.lastMessageAt = now();
  }
};

// Seed threads
{
  const seed: [string, string, string][] = [
    [
      "برنامه‌ی سفر به اصفهان",
      "یک برنامه‌ی سه‌روزه برای سفر به اصفهان بنویس.",
      demoAnswer("یک برنامه‌ی سه‌روزه برای سفر به اصفهان بنویس."),
    ],
    [
      "توضیح RAG",
      "RAG چیست و چرا برای پرسش از اسناد مفید است؟",
      demoAnswer("RAG چیست؟"),
    ],
  ];
  seed.forEach(([title, question, answer], i) => {
    const at = ago(60 * (i + 2));
    const thread = addThread(title, at);
    messages
      .get(thread.id)
      ?.push(
        textMessage(thread.id, "user", question, at),
        textMessage(thread.id, "assistant", answer, at)
      );
  });
}

type Translation = O["translations"]["get"];
const translations: NonNullable<Translation>[] = [];
type Summary = O["summarize"]["get"];
const summaries: NonNullable<Summary>[] = [];
type CodeRun = O["code"]["getRun"];
const codeRuns: NonNullable<CodeRun>[] = [];
type Tr = NonNullable<Translation>;
type Su = NonNullable<Summary>;
type Cr = NonNullable<CodeRun>;
type ImageThread = O["imageThreads"]["list"][number];
const imageThreads: ImageThread[] = [];

const addImageThread = (title: string, at = now()): ImageThread => {
  const thread: ImageThread = {
    id: newId(),
    title,
    isArchived: false,
    lastImageAt: at,
    userId: USER_ID,
    createdAt: at,
    updatedAt: at,
  };
  imageThreads.unshift(thread);
  return thread;
};

type SettingRow = O["admin"]["getAllSettings"][number];
const demoSettings: SettingRow[] = [
  {
    id: 1,
    key: "app_name",
    value: "دستیار هوشمند",
    description: null,
    createdAt: ago(100),
    updatedAt: ago(100),
  },
  {
    id: 2,
    key: "enable_chat",
    value: true,
    description: null,
    createdAt: ago(100),
    updatedAt: ago(100),
  },
  {
    id: 3,
    key: "enable_translation",
    value: true,
    description: null,
    createdAt: ago(100),
    updatedAt: ago(100),
  },
  {
    id: 4,
    key: "enable_summary",
    value: true,
    description: null,
    createdAt: ago(100),
    updatedAt: ago(100),
  },
  {
    id: 5,
    key: "enable_transcription",
    value: true,
    description: null,
    createdAt: ago(100),
    updatedAt: ago(100),
  },
  {
    id: 6,
    key: "enable_code_execution",
    value: true,
    description: null,
    createdAt: ago(100),
    updatedAt: ago(100),
  },
  {
    id: 7,
    key: "enable_image_generation",
    value: true,
    description: null,
    createdAt: ago(100),
    updatedAt: ago(100),
  },
];

type OllamaServerRow = O["admin"]["listOllamaServers"][number];
const ollamaServers: OllamaServerRow[] = [
  {
    id: 1,
    name: "سرور محلی",
    baseUrl: "http://127.0.0.1:11434",
    isEnabled: true,
    createdAt: ago(60 * 24 * 7),
    updatedAt: ago(60 * 24 * 7),
    models: models.map((m) => m.identifier),
    modelCount: models.length,
    runtime: {
      serverId: 1,
      inFlight: 0,
      runningModels: 1,
      reachable: true,
      busyScore: 0,
      ewmaLatencyMs: 180,
    },
  },
];

const impl: Impl = {
  auth: {
    login: () => ({ token: DEMO_TOKEN, user }),
    register: () => ({ token: DEMO_TOKEN, user }),
    me: () => user,
    updatePassword: () => ({ success: true }),
    updateUsername: (input) => {
      user.username = input.newUsername;
      return { token: DEMO_TOKEN, user };
    },
  },
  appConfig: {
    getFeatureToggles: () => {
      const getVal = (key: string, def: boolean) => {
        const found = demoSettings.find((s) => s.key === key);
        return typeof found?.value === "boolean" ? found.value : def;
      };
      return {
        enable_chat: getVal("enable_chat", true),
        enable_translation: getVal("enable_translation", true),
        enable_summary: getVal("enable_summary", true),
        enable_transcription: getVal("enable_transcription", true),
        enable_code_execution: getVal("enable_code_execution", true),
        enable_image_generation: getVal("enable_image_generation", true),
      };
    },
    getBuildInfo: () => ({
      version: "1.0.0-demo",
      release: true,
      builtAt: now().toISOString(),
    }),
  },
  models: {
    list: () => models,
  },
  threads: {
    list: () => threads.filter((t) => !t.isArchived),
    get: ({ id }) => threads.find((t) => t.id === id) ?? null,
    create: (input) => addThread(input?.title ?? "گفتگوی جدید"),
    rename: ({ id, title }) => {
      const thread = threads.find((t) => t.id === id);
      if (thread) {
        thread.title = title;
        thread.updatedAt = now();
      }
      return { ok: true } as const;
    },
    archive: ({ id }) => {
      const thread = threads.find((t) => t.id === id);
      if (thread) {
        thread.isArchived = true;
        thread.updatedAt = now();
      }
      return { ok: true } as const;
    },
    delete: ({ id }) => {
      const index = threads.findIndex((t) => t.id === id);
      if (index !== -1) {
        threads.splice(index, 1);
        messages.delete(id);
      }
      return { ok: true } as const;
    },
  },
  messages: {
    listByThread: ({ threadId }) => [...(messages.get(threadId) ?? [])],
    getLastUsedModel: () => null,
    getLastUsedModelGlobal: () => null,
    clearThread: ({ threadId }) => {
      messages.set(threadId, []);
      return { ok: true } as const;
    },
  },
  documents: {
    listByThread: () => [],
    detachFromThread: () => ({ ok: true }) as const,
  },
  translations: {
    list: () => translations,
    get: ({ id }) => translations.find((t) => t.id === id) ?? null,
    translate: (input) => {
      const row = {
        id: newId(),
        sourceText: input.text,
        translatedText: demoTranslation(input.text, input.targetLanguage),
        sourceLanguage: input.sourceLanguage as Tr["sourceLanguage"],
        targetLanguage: input.targetLanguage as Tr["targetLanguage"],
        tone: input.tone as Tr["tone"],
        sourceType: "text" as const,
        sourceFileName: null,
        payload: null,
        modelId: input.modelId,
        userId: USER_ID,
        createdAt: now(),
        updatedAt: now(),
      };
      translations.unshift(row);
      return row;
    },
    translatePdf: (input) => {
      const row = {
        id: newId(),
        sourceText: "متن نمونه از سند PDF استخراج شده",
        translatedText: demoTranslation("متن نمونه PDF", input.targetLanguage),
        sourceLanguage: input.sourceLanguage as Tr["sourceLanguage"],
        targetLanguage: input.targetLanguage as Tr["targetLanguage"],
        tone: input.tone as Tr["tone"],
        sourceType: "pdf" as const,
        sourceFileName: input.file.name,
        payload: {
          page_count: 1,
          pages: [
            {
              page: 1,
              source_text: "متن نمونه از سند PDF",
              translated_text: demoTranslation(
                "متن نمونه PDF",
                input.targetLanguage
              ),
            },
          ],
        },
        modelId: input.modelId,
        userId: USER_ID,
        createdAt: now(),
        updatedAt: now(),
      };
      translations.unshift(row);
      return row;
    },
    delete: ({ id }) => {
      const idx = translations.findIndex((t) => t.id === id);
      if (idx !== -1) {
        translations.splice(idx, 1);
      }
      return { ok: true } as const;
    },
  },
  summarize: {
    list: () => summaries,
    get: ({ id }) => summaries.find((s) => s.id === id) ?? null,
    create: (input) => {
      const row = {
        id: newId(),
        sourceText: input.text,
        summaryText: demoSummary(input.text),
        mode: (input.mode ?? "standard") as Su["mode"],
        tone: (input.tone ?? null) as Su["tone"],
        modelId: input.modelId,
        userId: USER_ID,
        createdAt: now(),
        updatedAt: now(),
      };
      summaries.unshift(row);
      return row;
    },
    delete: ({ id }) => {
      const idx = summaries.findIndex((s) => s.id === id);
      if (idx !== -1) {
        summaries.splice(idx, 1);
      }
      return { ok: true } as const;
    },
  },
  code: {
    listRuns: () => codeRuns,
    getRun: ({ id }) => codeRuns.find((r) => r.id === id) ?? null,
    run: (input) => {
      const output = demoCode(input.mode, input.language);
      codeRuns.unshift({
        id: newId(),
        mode: input.mode,
        language: input.language as Cr["language"],
        inputCode: input.code ?? input.prompt ?? "",
        errorMessage: input.error ?? null,
        output: JSON.stringify(output),
        modelId: input.modelId,
        userId: USER_ID,
        createdAt: now(),
      });
      return output;
    },
    deleteRun: ({ id }) => {
      const idx = codeRuns.findIndex((r) => r.id === id);
      if (idx !== -1) {
        codeRuns.splice(idx, 1);
      }
      return { ok: true } as const;
    },
  },
  transcribe: {
    models: () => [{ id: "ggml-base.bin", name: "base" }],
    transcribe: () =>
      "این متن نمونه است. در نسخه‌ی دمو صدا به سرور Whisper فرستاده نمی‌شود.",
  },
  images: {
    checkService: () => ({ available: false }),
    getSamplers: () => ({ samplers: ["Euler a", "DPM++ 2M Karras"] }),
    listByThread: () => [],
  },
  imageThreads: {
    list: () => imageThreads.filter((t) => !t.isArchived),
    get: ({ id }) => imageThreads.find((t) => t.id === id) ?? null,
    create: (input) => ({
      id: addImageThread(input?.title ?? "گفتگوی تصویری جدید").id,
    }),
    rename: ({ id, title }) => {
      const thread = imageThreads.find((t) => t.id === id);
      if (thread) {
        thread.title = title;
        thread.updatedAt = now();
      }
      return { ok: true } as const;
    },
    archive: ({ id }) => {
      const thread = imageThreads.find((t) => t.id === id);
      if (thread) {
        thread.isArchived = true;
        thread.updatedAt = now();
      }
      return { ok: true } as const;
    },
    delete: ({ id }) => {
      const idx = imageThreads.findIndex((t) => t.id === id);
      if (idx !== -1) {
        imageThreads.splice(idx, 1);
      }
      return { ok: true } as const;
    },
  },
  admin: {
    listUsers: (input) => {
      const query = input?.search?.trim().toLowerCase();
      const filtered = demoUsers.filter((u) => {
        if (input?.role && u.role !== input.role) return false;
        if (query && !u.username.toLowerCase().includes(query)) return false;
        return true;
      });
      return {
        users: filtered,
        total: filtered.length,
        page: input?.page ?? 1,
        pageSize: input?.pageSize ?? 20,
        totalPages: 1,
      };
    },
    getUserDetails: ({ userId }) => {
      const u = demoUsers.find((x) => x.id === userId);
      if (!u) return null;
      return {
        ...u,
        messageCount: 5,
        documentCount: 0,
        imageCount: 0,
        translationCount: translations.length,
        summaryCount: summaries.length,
        codeRunCount: codeRuns.length,
        threadCount: threads.length,
      };
    },
    createUser: (input) => {
      const u = demoUser(newId(), input.username, input.role ?? "user");
      demoUsers.push(u);
      return {
        id: u.id,
        username: u.username,
        role: u.role,
        createdAt: u.createdAt,
      };
    },
    updateUser: (input) => {
      const u = demoUsers.find((x) => x.id === input.userId);
      if (!u) throw new Error("کاربر یافت نشد");
      if (input.username) u.username = input.username;
      if (input.role) u.role = input.role;
      u.updatedAt = now();
      return {
        id: u.id,
        username: u.username,
        role: u.role,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      };
    },
    deleteUser: ({ userId }) => {
      const idx = demoUsers.findIndex((x) => x.id === userId);
      if (idx !== -1) demoUsers.splice(idx, 1);
      return { success: true };
    },
    listAllModels: () => models.map((m) => ({ ...m, serverCoverage: 1 })),
    toggleModelStatus: ({ modelId, isEnabled }) => {
      const m = models.find((x) => x.id === modelId);
      if (m) {
        m.isEnabled = isEnabled;
        m.updatedAt = now();
      }
      return m ?? models[0];
    },
    listOllamaServers: () => ollamaServers,
    createOllamaServer: (input) => {
      const s = {
        id: newId(),
        name: input.name,
        baseUrl: input.baseUrl,
        isEnabled: input.isEnabled ?? true,
        createdAt: now(),
        updatedAt: now(),
      };
      ollamaServers.push({
        ...s,
        models: models.map((m) => m.identifier),
        modelCount: models.length,
        runtime: {
          serverId: s.id,
          inFlight: 0,
          runningModels: 1,
          reachable: true,
          busyScore: 0,
          ewmaLatencyMs: 120,
        },
      });
      return s;
    },
    updateOllamaServer: (input) => {
      const s = ollamaServers.find((x) => x.id === input.id);
      if (!s) throw new Error("سرور یافت نشد");
      if (input.name !== undefined) s.name = input.name;
      if (input.baseUrl !== undefined) s.baseUrl = input.baseUrl;
      if (input.isEnabled !== undefined) s.isEnabled = input.isEnabled;
      s.updatedAt = now();
      return {
        id: s.id,
        name: s.name,
        baseUrl: s.baseUrl,
        isEnabled: s.isEnabled,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      };
    },
    deleteOllamaServer: ({ id }) => {
      const idx = ollamaServers.findIndex((x) => x.id === id);
      if (idx !== -1) ollamaServers.splice(idx, 1);
      return { success: true };
    },
    syncOllamaServerModels: () => ({
      success: true,
      modelCount: models.length,
    }),
    syncAllOllamaServersModels: () => ({
      success: true,
      modelCount: models.length,
    }),
    testOllamaServerConnection: () => ({
      ok: true as const,
      error: null,
    }),
    getAllSettings: () => demoSettings,
    upsertSetting: (input) => {
      const existing = demoSettings.find((s) => s.key === input.key);
      if (existing) {
        existing.value = input.value;
        existing.updatedAt = now();
        return existing;
      }
      const created: SettingRow = {
        id: newId(),
        key: input.key,
        value: input.value,
        description: input.description ?? null,
        createdAt: now(),
        updatedAt: now(),
      };
      demoSettings.push(created);
      return created;
    },
  },
};

// Any procedure without a fake rejects with a "disabled in demo" error.
const group = (name: string) =>
  new Proxy(
    {},
    {
      get: (_, key: string) => {
        const fn = (impl as Record<string, Record<string, Fn> | undefined>)[
          name
        ]?.[key];
        // Always return a promise, like the real client.
        return fn
          ? (input: never) => Promise.resolve().then(() => fn(input))
          : demoOnly;
      },
    }
  );

export const demoClient = new Proxy({} as C, {
  get: (_, key: string) => group(key),
});
