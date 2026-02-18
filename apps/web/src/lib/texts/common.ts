export const general = {
  loading: "در حال بارگذاری",
  loadingWithDots: "در حال بارگذاری…",
  loadingWithEllipsis: "در حال بارگذاری...",
  error: "خطا",
  success: "موفقیت",
  unknownError: "خطای نامشخص",
  untitled: "بدون عنوان",
  retry: "تلاش مجدد",
  unknown: "نامشخص" as const,
  charCount: (count: number) => `${count} کاراکتر`,
  download: "دانلود",
  loadingModels: "در حال بارگذاری مدل‌ها...",
  selectModel: "انتخاب مدل",
  history: "تاریخچه",
  noItems: "موردی موجود نیست",
  startNew: "شروع جدید",
  save: "ذخیره",
  cancel: "لغو",
  edit: "ویرایش",
} as const;

export const languages = {
  persian: "فارسی",
  english: "انگلیسی",
  arabic: "عربی",
  french: "فرانسوی",
  german: "آلمانی",
  spanish: "اسپانیایی",
} as const;

export const tones = {
  formal: "رسمی",
  informal: "غیررسمی",
  casual: "محاوره‌ای",
  technical: "تکنیکی",
  friendly: "دوستانه",
  academic: "آکادمیک",
  business: "کسب‌وکاری",
  creative: "خلاقانه",
  professional: "حرفه‌ای",
  neutral: "خنثی",
} as const;

export const transcribeLanguages = {
  fa: "فارسی",
  en: "انگلیسی",
} as const;

export const ui = {
  themeToggle: "تغییر تم",
} as const;

export const modelSelection = {
  aiModels: "مدل‌های هوش مصنوعی",
  chatModel: "مدل چت",
  selectChatModel: "انتخاب مدل چت",
  speechModel: "مدل تشخیص گفتار",
  selectSpeechModel: "انتخاب مدل تشخیص گفتار",
  model: "مدل",
} as const;

export const userProfile = {
  notLoggedIn: "وارد نشده",
  clickToLogin: "برای ورود کلیک کنید",
  loading: "در حال بارگذاری...",
  pleaseWait: "لطفاً صبر کنید",
  logOut: "خروج",
  title: "پروفایل کاربر",
  username: "نام کاربری",
  role: "نقش",
  id: "شناسه",
  failedToLoad: "خطا در بارگذاری اطلاعات کاربر",
  roles: {
    admin: "مدیر",
    user: "کاربر",
  },
} as const;

export const invalidThreadId = "شناسه گفتگوی نامعتبر";

export const documents = {
  attachmentLabel: "پیوست سند",
  supportedFormatsHint:
    "فرمت‌های پشتیبانی‌شده: PDF, DOCX, XLS/XLSX/XLSM, CSV/TSV, TXT/MD, HTML/XML, EML/RTF, YAML/TOML/INI/LOG/SQL و فایل‌های کد رایج.",
} as const;
