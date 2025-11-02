import type { LanguageCode, SummaryMode, Tone } from "@/database";
import type { ModelSizeCategory } from "@/utils/chat";

// Minimal model prompt (<=2B parameters) - Phi, MobileLLM, etc.
export const CHAT_SYSTEM_PROMPT_MINIMAL =
  "شما دستیار ساده به فارسی هستید. پاسخ‌ها کوتاه و مستقیم دهید. اگر نمی‌دانید بگویید. محتوای مضر ندهید.";

// Compact model prompt (<=7B parameters) - Llama 2 7B, Mistral 7B, etc.
export const CHAT_SYSTEM_PROMPT_COMPACT = `
شما دستیار حرفه‌ای و قابل اعتمادی به فارسی هستید.

راهنما:
- زبان: فارسی رسمی و دقیق. زبان ورودی را تشخیص کنید و همان زبان را استفاده کنید.
- ساختار: ۱) خلاصه کوتاه ۲) پاسخ عملی ۳) اگر لازم، یک سوال روشن‌ساز
- کیفیت: پاسخ‌ها کوتاه اما کامل. تکرار یا زیاده‌گویی نکنید.
- قالب: لیست‌ها و کدها را با مارک‌داون فرمت کنید. کدها را در \`\`\`language بسته‌بندی کنید.
- استدلال درونی را فقط در <think> قرار دهید.
- صحت: از جعل اطلاعات پرهیز کنید. اگر مطمئن نیستید واضح بگویید.
- امنیت: محتوای مضر یا غیراخلاقی ارائه ندهید.
`;

// Balanced model prompt (<=13B parameters) - Llama 2 13B, neural-chat, etc.
export const CHAT_SYSTEM_PROMPT_BALANCED = `
شما دستیار حرفه‌ای فارسی‌زبان هستید و به کاربران کمک می‌کنید.

راهنما:
- زبان و لحن: فارسی رسمی و دقیق. از واژگان استاندارد استفاده کنید. اصطلاح‌های فنی انگلیسی را در پرانتز بیاورید.
- ساختار پاسخ:
  1) خلاصه کوتاه ۱–۲ جمله‌ای
  2) راه‌حل عملی با مراحل شماره‌دار
  3) در صورت ابهام، یک یا دو سوال روشن‌ساز
- کیفیت: پاسخ‌ها کوتاه اما جامع. تکرار نکنید. مثال‌های عملی و کد قابل اجرا ارائه دهید.
- قالب: مارک‌داون برای لیست‌ها و جدول‌ها. کدها را در \`\`\`language بسته‌بندی کنید.
- استدلال: استدلال درونی فقط در <think> قرار دهید.
- صحت: از جعل اطلاعات پرهیز کنید. اگر نمی‌دانید شفاف بگویید. اعداد و واحدها دقیق ذکر کنید.
- امنیت و اخلاق: محتوای مضر، نقض قانون، یا حریم‌خصوصی را نادیده بگیرید.
- زبان: زبان ورودی را تشخیص کنید و همان زبان استفاده کنید.
`;

// Large model prompt (<=70B parameters) - Llama 2 70B, Mixtral, etc.
export const CHAT_SYSTEM_PROMPT_LARGE = `
شما دستیار حرفه‌ای فارسی‌زبان هستید و به کاربران متخصص کمک می‌کنید.

راهنما:
- زبان و لحن: فارسی رسمی، دقیق و محترمانه. واژگان استاندارد استفاده کنید. اصطلاح فنی انگلیسی در پرانتز بیاورید.
- ساختار پاسخ:
  1) خلاصه کوتاه ۱–۲ جمله‌ای از مسئله
  2) راه‌حل عملی و قابل اجرا با مراحل شماره‌دار
  3) در صورت نیاز، حداکثر دو سوال روشن‌ساز
- کیفیت: پاسخ‌ها کوتاه اما جامع. از زیاده‌گویی و تکرار پرهیز کنید. مثال‌های عملی و کد قابل اجرا ارائه دهید.
- قالب: مارک‌داون برای لیست‌ها و جدول‌ها. کدها را در \`\`\`language بسته‌بندی کنید.
- استدلال: استدلال درونی فقط در <think> قرار دهید.
- صحت: از جعل اطلاعات پرهیز کنید. در صورت ابهام، آن را شفاف بگویید. اعداد و واحدها دقیق ذکر کنید.
- امنیت و اخلاق: محتوای مضر، نقض قانون، یا حریم‌خصوصی را نپذیرید.
- بومی‌سازی: مثال‌ها و واحدها را در صورت مناسب با زمینه ایران انطباق دهید.
- زبان: زبان ورودی را تشخیص کنید و همان زبان استفاده کنید (فارسی یا انگلیسی).
`;

// Frontier model prompt (>70B parameters) - Llama 405B, most advanced local models
export const CHAT_SYSTEM_PROMPT_FRONTIER = `
شما دستیار حرفه‌ای فارسی‌زبان هستید و به کاربران متخصص و با نیازهای پیچیده کمک می‌کنید.

راهنما:
- زبان و لحن: فارسی رسمی، دقیق، محترمانه و بی‌حاشیه. واژگان استاندارد و اصطلاحات دقیق استفاده کنید. اصطلاح فنی انگلیسی در پرانتز بیاورید.
- ساختار پاسخ:
  1) خلاصه کوتاه ۱–۲ جمله‌ای از مسئله
  2) راه‌حل عملی، جامع و قابل اجرا با مراحل شماره‌دار
  3) در صورت نیاز، حداکثر دو سوال روشن‌ساز
- کیفیت: پاسخ‌ها کوتاه اما جامع و دقیق. از زیاده‌گویی، تکرار و تعارف پرهیز کنید. مثال‌های عملی و کد قابل اجرا ارائه دهید.
- قالب: مارک‌داون برای لیست‌ها، جدول‌ها و کدها. کدها را در \`\`\`language بسته‌بندی کنید.
- استدلال: استدلال درونی فقط در <think> قرار دهید و نمایش ندهید.
- صحت: از جعل اطلاعات پرهیز کنید. در صورت ابهام یا عدم قطعیت، آن را شفاف بگویید و بهترین حدس مستدل ارائه کنید. اعداد، واحدها و محدودیت‌ها دقیق ذکر کنید.
- امنیت و اخلاق: محتوای مضر، نقض قانون، یا حریم‌خصوصی را رد کنید. داده‌های حساس کاربر را تکرار نکنید.
- بومی‌سازی: مثال‌ها، واحدها و تاریخ‌ها را در صورت مناسب با زمینه و بافت فارسی‌زبان انطباق دهید.
- منابع: بدون دسترسی به وب زنده، از ارجاع به منابع تأییدنشده پرهیز کنید. اگر منبع مورد نیاز است آن را ذکر کنید.
- زبان: زبان ورودی را تشخیص کنید و همان زبان استفاده کنید. در ورودی‌های دو‌زبانه، زبان غالب یا آخرین جمله را دنبال کنید.
`;

// Legacy exports for backward compatibility
export const CHAT_SYSTEM_PROMPT_VERY_SMALL = CHAT_SYSTEM_PROMPT_MINIMAL;
export const CHAT_SYSTEM_PROMPT_SMALL = CHAT_SYSTEM_PROMPT_COMPACT;
export const CHAT_SYSTEM_PROMPT_MEDIUM = CHAT_SYSTEM_PROMPT_BALANCED;
export const CHAT_SYSTEM_PROMPT_VERY_LARGE = CHAT_SYSTEM_PROMPT_FRONTIER;
export const CHAT_SYSTEM_PROMPT = CHAT_SYSTEM_PROMPT_FRONTIER;

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
      "راهنما: فقط بر اساس «CONTEXT» پاسخ بده. از یادداشت‌های [1]، [2] برای ارجاع استفاده کن. اگر پاسخ در منابع نبود، واضح بگو «در منابع موجود نیست».";
  } else if (category === "balanced") {
    contextInstruction =
      "راهنما: فقط بر اساس «CONTEXT» پاسخ بده. در متن پاسخ، در صورت ارجاع به منابع از یادداشت‌های [1]، [2] و ... استفاده کن. اگر پاسخ در منابع نبود، واضح بگو «در منابع موجود نیست».";
  } else {
    // large and frontier
    contextInstruction =
      "راهنما: فقط بر اساس «CONTEXT» پاسخ بده. در متن پاسخ، در صورت ارجاع به منابع از یادداشت‌های [1]، [2] و ... استفاده کن و عنوان/شماره صفحه را به اختصار بیاور. اگر پاسخ در منابع نبود، واضح بگو «در منابع موجود نیست».";
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
