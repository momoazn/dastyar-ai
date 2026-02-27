const THINK_BLOCK_REGEX = /<think>[\s\S]*?<\/think>/gi;
const MARKDOWN_CODE_BLOCK_REGEX =
  /```[^\S\r\n]*[a-zA-Z0-9_+#.-]*\s*([\s\S]*?)\s*```/;

export function sanitizeGeneratedCodeOutput(raw: string): string {
  const withoutThinking = raw.replace(THINK_BLOCK_REGEX, "").trim();
  const fencedMatch = withoutThinking.match(MARKDOWN_CODE_BLOCK_REGEX);

  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  return withoutThinking;
}
