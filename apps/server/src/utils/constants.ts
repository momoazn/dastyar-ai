// AI Provider Configuration
export const ModelProviderEnum = ['ollama', 'lmstudio'] as const;
export type ModelProvider = (typeof ModelProviderEnum)[number];

// Status enums for messages
export const messageStatuses = [
  'reasoning',
  'generating',
  'finished',
  'errored',
  'stopped',
] as const;
export type MessageStatus = (typeof messageStatuses)[number];

// Role enums for messages
export const messageRoles = ['user', 'assistant'] as const;
export type MessageRole = (typeof messageRoles)[number];

// Language enums for translations
export const languageCodes = [
  'en',
  'fa',
  'ar',
  'fr',
  'de',
  'es',
  'it',
  'pt',
  'ru',
  'zh',
  'ja',
  'ko',
  'tr',
  'hi',
  'ur',
] as const;
export type LanguageCode = (typeof languageCodes)[number];

// Code to language map for translations
export const codeToLanguageMap: Record<LanguageCode, string> = {
  en: 'English',
  fa: 'Farsi',
  ar: 'Arabic',
  fr: 'French',
  de: 'German',
  es: 'Spanish',
  it: 'Italian',
  pt: 'Portuguese',
  ru: 'Russian',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
  tr: 'Turkish',
  hi: 'Hindi',
  ur: 'Urdu',
} as const;

// Tone enums for translations and summaries
export const tones = [
  'formal',
  'informal',
  'business',
  'casual',
  'academic',
  'technical',
  'creative',
  'friendly',
  'professional',
] as const;
export type Tone = (typeof tones)[number];

// Tone to label map for translations and summaries
export const toneToLabelMap: Record<Tone, string> = {
  formal: 'Formal',
  informal: 'Informal',
  business: 'Business',
  casual: 'Casual',
  academic: 'Academic',
  technical: 'Technical',
  creative: 'Creative',
  friendly: 'Friendly',
  professional: 'Professional',
} as const;

// Mode enums for summaries
export const summaryModes = ['concise', 'standard', 'detailed'] as const;
export type SummaryMode = (typeof summaryModes)[number];

export const summaryModePrompts: Record<SummaryMode, string> = {
  concise: "Summarize the user's text in 1-2 sentences. Preserve key meaning.",
  standard:
    "Summarize the user's text in a single concise paragraph. Include the main points and key details.",
  detailed:
    'Summarize with multiple paragraphs. Include key points, important details, and main takeaways where appropriate.',
};

export const CHAT_SYSTEM_PROMPT = `
شما «دستیار حرفه‌ای فارسی‌زبان» هستید و به کاربران متخصص کمک می‌کنید.

راهنما:
- زبان و لحن: فارسی رسمی، دقیق، محترمانه و بی‌حاشیه. از واژگان استاندارد استفاده کنید؛ در صورت لزوم اصطلاح فنی انگلیسی را در پرانتز بیاورید.
- ساختار پاسخ:
  1) جمع‌بندی کوتاه ۱–۲ جمله‌ای از مسئله.
  2) راه‌حل عملی و قابل اجرا با مراحل شماره‌دار یا فهرست بولت‌شده.
  3) در صورت ابهام، حداکثر دو پرسش روشن‌ساز در انتها.
- اختصار و کیفیت: پاسخ‌ها کوتاه اما کامل؛ از زیاده‌گویی، تکرار و تعارف پرهیز کنید. مثال‌های حداقلی و در صورت ارائه کد، کدِ قابل اجرا با توضیح مختصر بدهید.
- قالب‌بندی: از مارک‌داون برای لیست‌ها، جدول‌ها و کدها استفاده کنید. برای کد از بلوک‌های سه‌تایی \`\`\`language استفاده کنید.
- استدلال: استدلال درونی را فقط داخل تگ‌های <think> قرار دهید و در پاسخ نهایی نشان ندهید.
- دقت و صحت: از جعل اطلاعات خودداری کنید. در صورت عدم قطعیت، آن را شفاف بگویید و بهترین حدس مستدل ارائه کنید. اعداد، واحدها و قیود را دقیق ذکر کنید.
- حریم خصوصی و اخلاق: از تولید محتوای مضر یا نقض قوانین پرهیز کنید و داده‌های حساس کاربر را تکرار نکنید.
- بومی‌سازی: در صورت مناسب بودن، مثال‌ها، واحدها و تاریخ‌ها را با زمینه ایران انطباق دهید.
- منابع: بدون دسترسی به وب، از ارجاع به منابع تأییدنشده خودداری کنید؛ در صورت نیاز بگویید «نیاز به تأیید منبع است».
- زبان: زبان ورودی کاربر را تشخیص دهید و به همان زبان پاسخ دهید؛ فارسی در برابر فارسی و انگلیسی در برابر انگلیسی. در صورت درخواست صریح کاربر، زبان پاسخ را تغییر دهید. در ورودی‌های دو‌زبانه، مطابق زبان غالب یا آخرین جمله کاربر پاسخ دهید.
`;
