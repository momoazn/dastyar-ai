export const PERSIAN_TEXTS = {
  index: {
    chatTitle: "چت با دستیار هوشمند",
    chatDescription:
      "با استفاده از هوش مصنوعی به راحتی چت کنید و پاسخ‌های هوشمند دریافت کنید",

    imageTitle: "تولید تصویر",
    imageDescription: "با استفاده از توضیحات متنی، تصاویر دلخواه خود را بسازید",

    translationTitle: "ترجمه متن",
    translationDescription: "متن‌های خود را به راحتی ترجمه کنید",

    start: "شروع کنید",

    appTitle: "دستیار هوشمند فارسی",
    description: "با استفاده از هوش مصنوعی، تجربه‌ای متفاوت را تجربه کنید",
  },

  // General texts
  general: {
    loading: "در حال بارگذاری",
    error: "خطا",
    success: "موفقیت",
  },

  // Navigation and Headers
  navigation: {
    home: "خانه",
    chat: "گفتگو",
    imageGeneration: "تولید تصویر",
    translation: "ترجمه",
    appTitle: "دستیار هوشمند",
    newChat: "مکالمه جدید",
    newTranslation: "ترجمه جدید",
    new: "جدید",
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
    generationStopped: "تولید پاسخ متوقف شد",
    askQuestion: "سوال خود را بپرسید تا بتوانم به شما کمک کنم",
    askQuestionDescription:
      "سوال خود را بپرسید تا بتوانم به شما کمک کنم",
    edit: "ویرایش",
    regenerate: "تولید مجدد",
    delete: "حذف",
    copy: "کپی",
    save: "ذخیره",
    cancel: "لغو",
    copied: "کپی شد",
    ragMode: "حالت چت با اسناد",
    ragModeDescription: "از اسناد آپلود شده برای پاسخ استفاده می‌شود",
  },

  // Attachments
  attachments: {
    attachPDF: "ضمیمه کردن فایل PDF",
    uploading: "در حال آپلود",
    uploadError: "خطا در آپلود فایل",
    attachedDocuments: "اسناد ضمیمه شده",
    removeDocument: "حذف سند",
    onlyPDFSupported: "فقط فایل‌های PDF پشتیبانی می‌شوند",
    maxFileSize: "حداکثر حجم فایل ۱۰ مگابایت",
  },

  // Translation Interface
  translation: {
    sourceLanguage: "زبان مبدا",
    targetLanguage: "زبان مقصد",
    translationTone: "لحن ترجمه",
    model: "مدل زبانی ترجمه",
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
