// Simple logger utility to replace console statements
export const logger = {
  error: (
    message: string,
    error?: unknown,
    context?: Record<string, unknown>
  ) => {
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : "";
    const errorStr = error ? ` | Error: ${error}` : "";
    console.error(`[ERROR] ${message}${contextStr}${errorStr}`);
  },

  warn: (message: string, context?: Record<string, unknown>) => {
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : "";
    console.warn(`[WARN] ${message}${contextStr}`);
  },

  info: (message: string, context?: Record<string, unknown>) => {
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : "";
    console.info(`[INFO] ${message}${contextStr}`);
  },

  debug: (message: string, context?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === "development") {
      const contextStr = context
        ? ` | Context: ${JSON.stringify(context)}`
        : "";
      console.debug(`[DEBUG] ${message}${contextStr}`);
    }
  },
};
