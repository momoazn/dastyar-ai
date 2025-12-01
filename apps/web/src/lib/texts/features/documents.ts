export const documents = {
  pdfExtractionFailed:
    "استخراج صفحات PDF ناموفق بود، از متن کامل استفاده می‌شود.",
  uploadSuccess: (fileName: string, indexed: number) =>
    `«${fileName}» بارگذاری و ایندکس شد (${indexed} قطعه).`,
  uploadSuccessNoIndex: (fileName: string) => `فایل «${fileName}» بارگذاری شد.`,
  uploadSuccessPdfNoIndex: (fileName: string) =>
    `فایل «${fileName}» بارگذاری شد. (ایندکس PDF انجام نشد)`,
  uploadError: "خطا در آپلود فایل",
} as const;
