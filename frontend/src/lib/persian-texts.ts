export const PERSIAN_TEXTS = {
  // Navigation and Headers
  navigation: {
    chat: "گفتگو",
    imageGeneration: "تولید تصویر",
    translation: "ترجمه",
    appTitle: "دستیار هوشمند",
    newChat: "مکالمه جدید",
  },

  // Settings
  settings: {
    title: "تنظیمات",
    chatTab: "تنظیمات چت",
    imageTab: "تنظیمات تصویر",
    baseUrl: "آدرس سرور",
    systemPrompt: "پرامپت سیستم",
    temperature: "دما",
    topP: "احتمال بالا",
    presencePenalty: "جریمه تکرار",
    frequencyPenalty: "جریمه فراوانی",
    reset: "بازنشانی",
    showAdvanced: "نمایش تنظیمات پیشرفته",
    hideAdvanced: "پنهان کردن تنظیمات پیشرفته",
  },

  // Chat Interface
  chat: {
    thinking: "در حال فکر کردن...",
    showThoughts: "نمایش افکار",
    hideThoughts: "پنهان کردن افکار",
    writeMessage: "پیام خود را بنویسید...",
  },

  // Translation Interface
  translation: {
    sourceLanguage: "زبان مبدا",
    targetLanguage: "زبان مقصد",
    translationTone: "لحن ترجمه",
    enterText: "متن مورد نظر برای ترجمه را وارد کنید...",
    negativePrompt: "پرامپت منفی...",
    translating: "در حال ترجمه...",
    translate: "ترجمه",
    error: "خطا در ترجمه",
    tryAgain: "لطفا دوباره تلاش کنید.",
    translations: "ترجمه‌ها",
    translatedText: "ترجمه",
    noTranslations: "هیچ ترجمه‌ای وجود ندارد",
  },

  // Model Selection
  modelSelection: {
    aiModels: "مدل‌های هوش مصنوعی",
    chatModel: "مدل چت",
    selectChatModel: "انتخاب مدل چت",
    speechModel: "مدل تشخیص گفتار",
    selectSpeechModel: "انتخاب مدل تشخیص گفتار",
    translationModel: "مدل ترجمه",
    selectTranslationModel: "انتخاب مدل ترجمه",
  },

  // Image Generation Settings
  imageSettings: {
    imageSettings: "تنظیمات تصویر",
    sampler: "سمپلر",
    selectSampler: "انتخاب سمپلر",
    guidanceScale: "مقیاس راهنمایی",
    steps: "گام‌ها",
    width: "عرض",
    height: "ارتفاع",
    selectWidth: "انتخاب عرض",
  },

  // UI Elements
  ui: {
    themeToggle: "تغییر تم",
    delete: "حذف",
    cancel: "انصراف",
  },

  deleteDialog: {
    title: "آیا از حذف این چت مطمئن هستید؟",
    description:
      "همراه با حذف پیام‌ها و ترجمه‌ها و تصاویر تولید شده نیز حذف می‌شوند!\nاین فعل برای همیشه انجام خواهد شد و قابل بازگردانی نیست.",
  },

  // Language Labels
  languages: {
    persian: "فارسی",
    english: "انگلیسی",
    arabic: "عربی",
    french: "فرانسه",
    german: "آلمانی",
    spanish: "اسپانیایی",
  },

  // Tone Labels
  tones: {
    formal: "رسمی",
    casual: "غیر رسمی",
    technical: "تخصصی",
    friendly: "دوستانه",
  },
} as const;
