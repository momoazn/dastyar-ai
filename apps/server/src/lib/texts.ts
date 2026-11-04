export const serverTexts = {
  errors: {
    badRequest: "درخواست با خطا مواجه شد.",
    forbidden: "شما دسترسی لازم برای انجام این عملیات را ندارید.",
    internal: "خطای داخلی سرور رخ داد.",
    invalidRequest: "درخواست نامعتبر است. لطفاً ورودی‌ها را بررسی کنید.",
    notFound: "منبع درخواستی یافت نشد.",
    routeNotFound: "مسیر درخواستی یافت نشد.",
    unauthorized: "نشست شما معتبر نیست. لطفاً دوباره وارد شوید.",
  },
  auth: {
    failed: "احراز هویت ناموفق بود.",
    invalidCredentials: "کد ملی یا رمز عبور اشتباه است",
    invalidToken: "توکن نامعتبر است. لطفاً دوباره وارد شوید.",
    missingAuthHeader: "هدر احراز هویت نامعتبر است.",
    passwordUpdateFailed: "خطا در به‌روزرسانی رمز عبور",
    tokenExpired: "توکن منقضی شده است. لطفاً دوباره وارد شوید.",
    userNotFound: "کاربر یافت نشد. لطفاً دوباره وارد شوید.",
    usernameExists: "کد ملی قبلاً استفاده شده است",
    wrongCurrentPassword: "رمز عبور فعلی اشتباه است",
  },
  chat: {
    genericFailure: "در پردازش درخواست مشکلی رخ داد. لطفاً دوباره تلاش کنید.",
    inactiveModel: "مدل انتخاب‌شده غیرفعال است.",
    lastMessageMustBeUser: "آخرین پیام باید از طرف کاربر باشد.",
    modelNotFound: "مدل انتخاب‌شده یافت نشد.",
    providerUnavailable:
      "سرویس مدل در دسترس نیست. لطفاً اتصال Ollama را بررسی کرده و دوباره تلاش کنید.",
    saveUserMessageFailed: "ذخیره پیام کاربر ناموفق بود.",
    threadNotFound: "گفتگوی مورد نظر یافت نشد.",
  },
  config: {
    validation: {
      nationalCode: "کد ملی باید دقیقاً ۱۰ رقم باشد",
    },
  },
  file: {
    contentValidationFailed: "اعتبارسنجی محتوای فایل ناموفق بود.",
    empty: "فایل خالی است.",
    invalidContent: "محتوای فایل مجاز نیست.",
    invalidFile: "فایل ارسالی معتبر نیست.",
    invalidMimeType: (mimeType: string, allowedMimeTypes: readonly string[]) =>
      `نوع فایل ${mimeType} مجاز نیست. نوع‌های مجاز: ${allowedMimeTypes.join(", ")}`,
    invalidName: "نام فایل شامل کاراکتر نامعتبر است.",
    invalidNameControl: "نام فایل شامل کاراکتر کنترلی نامعتبر است.",
    invalidPath: "نام فایل شامل مسیر یا کاراکتر غیرمجاز است.",
    nameEmpty: "نام فایل نمی‌تواند خالی باشد.",
    nameTooLong: (maxLength: number) =>
      `نام فایل بیش از حد طولانی است. حداکثر ${maxLength} کاراکتر مجاز است.`,
    sizeTooLarge: (fileSizeMB: string, maxSizeMB: string) =>
      `حجم فایل ${fileSizeMB}MB است و از حد مجاز ${maxSizeMB}MB بیشتر است.`,
    unsupportedExtension: (
      extension: string,
      allowedExtensions: readonly string[]
    ) =>
      `پسوند فایل .${extension} مجاز نیست. پسوندهای مجاز: ${allowedExtensions.join(", ")}`,
  },
  model: {
    duplicate: "این مدل برای ارائه‌دهنده انتخاب‌شده قبلاً ثبت شده است.",
    notFound: "مدل انتخاب‌شده یافت نشد.",
  },
  admin: {
    addModelFailed: "افزودن مدل ناموفق بود.",
    cannotDeleteOnlyAdmin: "تنها کاربر مدیر قابل حذف نیست.",
    createOllamaServerFailed: "ایجاد سرور Ollama ناموفق بود.",
    createUserFailed: "ایجاد کاربر ناموفق بود.",
    deleteOllamaServerFailed: "حذف سرور Ollama ناموفق بود.",
    deleteSettingFailed: "حذف تنظیم ناموفق بود.",
    deleteUserFailed: "حذف کاربر ناموفق بود.",
    duplicateOllamaServerUrl: "آدرس این سرور قبلاً ثبت شده است.",
    getSettingFailed: "دریافت تنظیم ناموفق بود.",
    getSettingsFailed: "دریافت تنظیمات ناموفق بود.",
    listModelsFailed: "دریافت مدل‌ها ناموفق بود.",
    listOllamaServersFailed: "دریافت سرورهای Ollama ناموفق بود.",
    missingUserUpdateFields:
      "حداقل یکی از فیلدهای کد ملی، نقش یا رمز عبور الزامی است.",
    ollamaServerNotFound: "سرور Ollama یافت نشد.",
    settingNotFound: "تنظیم مورد نظر یافت نشد.",
    syncOllamaModelsFailed: "همگام‌سازی مدل‌های سرور Ollama ناموفق بود.",
    testOllamaServerFailed: "بررسی اتصال سرور Ollama ناموفق بود.",
    updateModelStatusFailed: "به‌روزرسانی وضعیت مدل ناموفق بود.",
    updateOllamaServerFailed: "به‌روزرسانی سرور Ollama ناموفق بود.",
    updateSettingFailed: "به‌روزرسانی تنظیم ناموفق بود.",
    updateUserFailed: "به‌روزرسانی کاربر ناموفق بود.",
    userNotFound: "کاربر یافت نشد.",
  },
  image: {
    promptRequired: "متن درخواست تصویر الزامی است.",
    serviceUnavailable: "سرویس Stable Diffusion در دسترس نیست",
    threadIdRequired: "شناسه گفتگو الزامی است.",
  },
  speech: {
    failed: "تبدیل صوت به متن انجام نشد. لطفاً دوباره تلاش کنید.",
    fileTooLarge: "فایل ضبط شده خیلی بزرگ است. لطفاً صدای کوتاه‌تری ضبط کنید.",
    timeout:
      "زمان پردازش به پایان رسید. لطفاً فایل کوتاه‌تری ضبط کنید یا مقدار WHISPER_TIMEOUT_MS را در config.json افزایش دهید.",
    unavailable:
      "سرویس تشخیص گفتار در دسترس نیست. لطفاً Whisper Server را اجرا کنید.",
  },
  summary: {
    failed: "خلاصه‌سازی متن ناموفق بود.",
  },
  translation: {
    empty: "پاسخی از مدل دریافت نشد",
    emptyPdfResult: "ترجمه‌ای برای صفحات استخراج‌شده تولید نشد",
    failed:
      "ترجمه انجام نشد. لطفاً وضعیت مدل (LM Studio/Ollama) را بررسی کنید و دوباره تلاش کنید.",
    pageFailed: (page: number) => `ترجمه صفحه ${page} ناموفق بود.`,
    pdfExtractionFailed: "استخراج متن از PDF ناموفق بود",
    persistFailed: "ذخیره‌سازی ترجمه ناموفق بود",
  },
} as const;
