export function sanitizeGeneratedCodeOutput(raw: string): string {
  const withoutThinking = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  const fencedMatch = withoutThinking.match(
    /```[^\S\r\n]*[a-zA-Z0-9_+#.-]*\s*([\s\S]*?)\s*```/
  );

  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  return withoutThinking;
}
