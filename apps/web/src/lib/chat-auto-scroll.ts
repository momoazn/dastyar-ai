const AUTO_SCROLL_BY_THREAD_STORAGE_KEY = "chat:auto-scroll-by-thread:v1";

const isValidThreadId = (threadId: number) =>
  Number.isFinite(threadId) && threadId > 0;

const threadStorageKey = (threadId: number) => threadId.toString();

const normalizeAutoScrollMap = (value: unknown) => {
  if (!value || typeof value !== "object") {
    return {};
  }

  const entries = Object.entries(value as Record<string, unknown>).filter(
    ([, entryValue]) => typeof entryValue === "boolean"
  );

  return Object.fromEntries(entries) as Record<string, boolean>;
};

const readAutoScrollMap = () => {
  if (typeof window === "undefined") {
    return {};
  }

  const raw = window.localStorage.getItem(AUTO_SCROLL_BY_THREAD_STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    return normalizeAutoScrollMap(JSON.parse(raw));
  } catch {
    return {};
  }
};

const writeAutoScrollMap = (data: Record<string, boolean>) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    AUTO_SCROLL_BY_THREAD_STORAGE_KEY,
    JSON.stringify(data)
  );
};

export const readAutoScrollByThread = (threadId: number) => {
  if (!isValidThreadId(threadId)) {
    return true;
  }

  const data = readAutoScrollMap();
  const saved = data[threadStorageKey(threadId)];
  return typeof saved === "boolean" ? saved : true;
};

export const writeAutoScrollByThread = (threadId: number, enabled: boolean) => {
  if (!isValidThreadId(threadId)) {
    return;
  }

  const data = readAutoScrollMap();
  writeAutoScrollMap({
    ...data,
    [threadStorageKey(threadId)]: enabled,
  });
};

export const removeAutoScrollByThread = (threadId: number) => {
  if (!isValidThreadId(threadId)) {
    return;
  }

  const data = readAutoScrollMap();
  const key = threadStorageKey(threadId);
  if (!(key in data)) {
    return;
  }

  const rest = Object.fromEntries(
    Object.entries(data).filter(([entryKey]) => entryKey !== key)
  ) as Record<string, boolean>;
  writeAutoScrollMap(rest);
};
