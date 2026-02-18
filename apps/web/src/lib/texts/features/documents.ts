export const documents = {
  pdfExtractionFailed:
    "استخراج صفحات PDF ناموفق بود، از متن کامل استفاده می‌شود.",
  uploadSuccess: (fileName: string, indexed: number) =>
    `«${fileName}» بارگذاری و ایندکس شد (${indexed} قطعه).`,
  uploadSuccessNoIndex: (fileName: string) => `فایل «${fileName}» بارگذاری شد.`,
  uploadSuccessNoIndexWithReason: (fileName: string, reason: string) =>
    `فایل «${fileName}» بارگذاری شد اما ایندکس نشد: ${reason}`,
  uploadSuccessPdfNoIndex: (fileName: string) =>
    `فایل «${fileName}» بارگذاری شد. (ایندکس PDF انجام نشد)`,
  indexingReasonUnsupportedType: "نوع فایل برای ایندکس پشتیبانی نمی‌شود.",
  indexingReasonNoContent: "متن قابل استخراجی در فایل پیدا نشد.",
  indexingReasonFailed: "سرویس ایندکس در دسترس نیست. دوباره تلاش کنید.",
  indexingReasonUnknown: "دلیل ایندکس نشدن مشخص نیست.",
  uploadError: "خطا در آپلود فایل",
} as const;
