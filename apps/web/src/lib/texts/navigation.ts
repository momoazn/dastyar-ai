export const navigation = {
  home: "خانه",
  chat: "گفتگو",
  imageGeneration: "تولید تصویر",
  translation: "ترجمه",
  transcribe: "تبدیل صوت به متن",
  summarize: "خلاصه‌سازی",
  codeAssistant: "دستیار کد",
  appTitle: "دستیار هوشمند",
  newChat: "گفتگوی جدید",
  newImageChat: "گفتگوی تصویری جدید",
  newTranslation: "ترجمه جدید",
  new: "جدید",
  noChatThreads: "هیچ گفتگویی وجود ندارد",
  loadingThreads: "در حال بارگذاری گفتگوها...",
  emptyStates: {
    chat: {
      description: "با کلیک روی دکمه + گفتگوی جدید ایجاد کنید",
    },
    translation: {
      title: "هنوز ترجمه‌ای ایجاد نشده است",
      description: "با استفاده از فرم سمت راست، ترجمه جدید ایجاد کنید",
    },
    summary: {
      title: "هنوز خلاصه‌ای ایجاد نشده است",
      description: "با استفاده از فرم سمت راست، خلاصه جدید ایجاد کنید",
    },
    image: {
      title: "هنوز تصویری تولید نشده است",
      description: "با استفاده از فرم سمت راست، تصویر جدید ایجاد کنید",
    },
    transcribe: {
      title: "هنوز فایل صوتی‌ای تبدیل نشده است",
      description: "با استفاده از فرم سمت راست، فایل صوتی جدید آپلود کنید",
    },
  },
} as const;
