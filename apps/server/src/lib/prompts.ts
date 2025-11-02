import type { LanguageCode, SummaryMode, Tone } from "@/database";
import type { ModelSizeCategory } from "@/utils/chat";

// Minimal model prompt (<=3B parameters) - Phi, Qwen, small models
export const CHAT_SYSTEM_PROMPT_MINIMAL =
  "شما دستیار فارسی هستید. پاسخ کوتاه و واضح بدهید. اگر نمی‌دانید بگویید نمیدانم.";

// Compact model prompt (<=8B parameters) - Llama 3 8B, Mistral 7B, Gemma 7B
export const CHAT_SYSTEM_PROMPT_COMPACT =
  "شما دستیار فارسی هستید. پاسخ‌ها را واضح و مستقیم بدهید. کدها را در ```language بنویسید. اگر مطمئن نیستید بگویید.";

// Balanced model prompt (<=14B parameters) - Qwen 14B, Llama 2 13B
export const CHAT_SYSTEM_PROMPT_BALANCED = `شما دستیار فارسی هستید.

راهنما:
- پاسخ واضح و عملی بدهید
- کدها را در \`\`\`language بنویسید
- اگر نمی‌دانید صادقانه بگویید
- از جعل اطلاعات پرهیز کنید`;

// Large model prompt (<=34B parameters) - Qwen 32B, Mixtral 8x7B, Yi 34B
export const CHAT_SYSTEM_PROMPT_LARGE = `شما دستیار فارسی هستید.

راهنما:
- پاسخ‌های واضح و کاربردی بدهید
- مراحل را شماره‌گذاری کنید
- کدها را در \`\`\`language بنویسید
- از جعل اطلاعات پرهیز کنید
- اگر مطمئن نیستید صادقانه بگویید`;

// Frontier model prompt (>34B parameters) - Qwen 72B, Llama 3 70B+, advanced models
export const CHAT_SYSTEM_PROMPT_FRONTIER = `شما دستیار فارسی هستید.

راهنما:
- پاسخ‌های دقیق و جامع بدهید
- مراحل را به ترتیب شماره‌گذاری کنید
- کدها را در \`\`\`language بنویسید
- مثال‌های عملی ارائه دهید
- از جعل اطلاعات پرهیز کنید
- اگر مطمئن نیستید آن را واضح بیان کنید
- محتوای مضر یا غیراخلاقی ارائه ندهید`;

// Chat prompt builder with optional RAG context and model size awareness
export const chatSystemPrompt = (params?: {
  context?: string;
  sizeCategory?: ModelSizeCategory;
}): string => {
  const context = params?.context?.trim();
  const category = params?.sizeCategory ?? "balanced";

  // Select prompt based on model size category
  let basePrompt: string;
  switch (category) {
    case "minimal":
      basePrompt = CHAT_SYSTEM_PROMPT_MINIMAL;
      break;
    case "compact":
      basePrompt = CHAT_SYSTEM_PROMPT_COMPACT;
      break;
    case "balanced":
      basePrompt = CHAT_SYSTEM_PROMPT_BALANCED;
      break;
    case "large":
      basePrompt = CHAT_SYSTEM_PROMPT_LARGE;
      break;
    case "frontier":
      basePrompt = CHAT_SYSTEM_PROMPT_FRONTIER;
      break;
    default:
      basePrompt = CHAT_SYSTEM_PROMPT_BALANCED;
  }

  if (!context) {
    return basePrompt;
  }

  // Context instructions vary by model size - simpler for smaller models
  let contextInstruction: string;
  if (category === "minimal" || category === "compact") {
    contextInstruction =
      "فقط از CONTEXT استفاده کن. اگر پاسخ در منابع نبود بگو «در منابع نیست».";
  } else if (category === "balanced") {
    contextInstruction =
      "فقط از CONTEXT پاسخ بده. با [1]، [2] ارجاع بده. اگر نبود بگو «در منابع نیست».";
  } else {
    // large and frontier
    contextInstruction =
      "فقط از CONTEXT پاسخ بده. با [1]، [2] و عنوان ارجاع بده. اگر نبود بگو «در منابع نیست».";
  }

  return [
    basePrompt,
    "",
    "[CONTEXT]",
    context,
    "[/CONTEXT]",
    "",
    contextInstruction,
  ].join("\n");
};

// Shared JSON-output instructions
export const requireJsonObjectWith = (key: string): string =>
  `Always return a json object with the ${key}.`;

export const respondOnlyWithCompactJson = (key: string): string =>
  `Respond ONLY with a compact JSON object: {"${key}": "..."}.`;

// Summary mode prompts for AI processing
export const summaryModePrompts: Record<SummaryMode, string> = {
  concise: "Summarize the user's text in 1-2 sentences. Preserve key meaning.",
  standard:
    "Summarize the user's text in a single concise paragraph. Include the main points and key details.",
  detailed:
    "Summarize with multiple paragraphs. Include key points, important details, and main takeaways where appropriate.",
} as const;

// Summary prompt builder
export const summarySystemPrompt = (params: {
  mode: SummaryMode;
  tone: Tone;
  format: "structured" | "json";
}): string => {
  const base = [
    "You are a professional summarizer. Create clear, accurate summaries.",
    "IMPORTANT: Always summarize in the same language as the source text.",
    summaryModePrompts[params.mode],
    `Use a ${params.tone} tone.`,
    "Preserve meaning and important details.",
  ];
  if (params.format === "structured") {
    return [
      ...base,
      requireJsonObjectWith("summary text"),
      "Please generate only the JSON output. DO NOT provide any preamble.",
    ]
      .filter(Boolean)
      .join("\n");
  }
  return [...base, respondOnlyWithCompactJson("summaryText")]
    .filter(Boolean)
    .join("\n");
};

// Translation prompt builder
export const translationSystemPrompt = (params: {
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  tone: Tone;
  format: "structured" | "json";
}): string => {
  const base = [
    `You are a professional translator. Translate the user's message from ${params.sourceLanguage} to ${params.targetLanguage}.`,
    `Use a ${params.tone} tone.`,
  ];
  if (params.format === "structured") {
    return [
      ...base,
      "Preserve meaning and formatting. Return only the translated text without extra commentary.",
      requireJsonObjectWith("translated text"),
      "Please generate only the JSON output. DO NOT provide any preamble.",
    ]
      .filter(Boolean)
      .join("\n");
  }
  return [
    ...base,
    "Preserve meaning and formatting.",
    respondOnlyWithCompactJson("translatedText"),
  ]
    .filter(Boolean)
    .join("\n");
};

// Code prompt builder
export const codeSystemPrompt = (params: {
  mode: "generate" | "explain" | "review" | "debug";
  language: string;
}): string => {
  const { mode, language } = params;
  if (mode === "generate") {
    return `You are an expert ${language} developer. Return ONLY code, no markdown, no backticks.`;
  }
  if (mode === "explain") {
    return `Explain the following ${language} code clearly.`;
  }
  if (mode === "review") {
    return `Review the ${language} code. Return JSON with keys: feedback (string) and suggestions (string[]).`;
  }
  // debug
  return `Debug the ${language} code and error. Return JSON with rootCause (string), solution (string), and optional codeFix (string).`;
};
