// Canned answers for demo mode. They say clearly that no model ran.

const NOTE =
  "> این نسخه‌ی دمو است و به مدل زبانی وصل نیست. پاسخ‌ها از پیش نوشته شده‌اند. برای پاسخ واقعی، پروژه را با Ollama روی سیستم خودتان اجرا کنید.";

const TRIP = `## برنامه‌ی سه‌روزه‌ی اصفهان

**روز اول: میدان نقش جهان**
- صبح: مسجد شیخ لطف‌الله و مسجد امام
- ظهر: ناهار در بازار قیصریه
- عصر: کاخ عالی‌قاپو و تماشای غروب از ایوان آن

**روز دوم: جلفا و چهلستون**
- صبح: کاخ چهلستون
- عصر: کلیسای وانک و قدم زدن در محله‌ی جلفا

**روز سوم: پل‌ها**
- عصر: سی‌وسه‌پل و پل خواجو
- شب: چای در قهوه‌خانه‌های کنار زاینده‌رود`;

const RAG = `## RAG چیست؟

**RAG** یعنی «تولید با بازیابی» (Retrieval-Augmented Generation).

1. متن اسناد استخراج و به **تکه‌ها** تقسیم می‌شود.
2. برای هر تکه یک **بردار (embedding)** ساخته می‌شود.
3. هنگام پرسش، نزدیک‌ترین تکه‌ها با **شباهت کسینوسی** پیدا می‌شوند.
4. این تکه‌ها همراه پرسش به مدل داده می‌شوند.

مزیت: مدل بر اساس اسناد شما پاسخ می‌دهد، نه فقط دانسته‌های خودش. در دستیار، فایل‌های PDF، DOCX، اکسل و ایمیل پشتیبانی می‌شوند.`;

const WHITESPACE = /\s+/;

export function demoAnswer(prompt: string): string {
  if (prompt.includes("اصفهان")) {
    return TRIP;
  }
  if (prompt.includes("RAG")) {
    return RAG;
  }
  return `${NOTE}\n\nپیام شما دریافت شد: «${prompt.slice(0, 200)}»\n\nدر نسخه‌ی کامل، این پیام به یک مدل محلی (مثلاً \`qwen3:4b\` روی Ollama) فرستاده می‌شود و پاسخ به‌صورت جریانی (streaming) نمایش داده می‌شود.`;
}

export function demoTranslation(text: string, target: string): string {
  return `[${target}] ${text}\n\n(نسخه‌ی دمو: ترجمه‌ی واقعی با مدل محلی انجام می‌شود.)`;
}

export function demoSummary(text: string): string {
  const words = text.trim().split(WHITESPACE);
  return `${NOTE}\n\n- متن شما ${words.length} کلمه دارد.\n- شروع متن: «${words.slice(0, 12).join(" ")}…»`;
}

export function demoCode(
  mode: "generate" | "explain" | "review" | "debug",
  language: string
) {
  switch (mode) {
    case "generate":
      return {
        generatedCode: `// Demo output (${language}): no model ran.\nfunction greet(name) {\n  return \`سلام، \${name}!\`;\n}`,
      };
    case "explain":
      return {
        explanation: `${NOTE}\n\nاین کد را مدل محلی خط به خط توضیح می‌دهد.`,
      };
    case "review":
      return {
        feedback: NOTE,
        suggestions: [
          "نام متغیرها را گویاتر کنید.",
          "برای ورودی خالی تست بنویسید.",
        ],
      };
    case "debug":
      return {
        rootCause: NOTE,
        solution: "در نسخه‌ی کامل، مدل علت خطا و راه‌حل را پیشنهاد می‌دهد.",
      };
    default:
      return { explanation: NOTE };
  }
}
