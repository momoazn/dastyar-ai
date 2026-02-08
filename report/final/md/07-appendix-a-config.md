# پیوست A: پیکربندی سامانه

این پیوست نمایه‌ای از کلیدهای پیکربندی سامانه را بر اساس شِمای `apps/server/src/config.ts` ارائه می‌کند.

| کلید | توضیح |
|---|---|
| `PORT` | پورت سرویس HTTP سرور اصلی. |
| `HOST` | آدرس میزبان برای bind شدن سرور (مثلاً 127.0.0.1 یا 0.0.0.0). |
| `CORS_ORIGIN` | مبدأ/مبدأهای مجاز برای CORS (در نسخه فعلی به صورت `*` یا لیست جداشده با کاما). |
| `JWT_SECRET` | کلید امضای توکن‌های JWT (حداقل ۳۲ کاراکتر). |
| `JWT_EXPIRES_IN` | مدت اعتبار توکن JWT بر حسب ثانیه. |
| `DATABASE_FILE` | مسیر فایل پایگاه داده SQLite. |
| `WHISPER_SERVER_URL` | آدرس سرویس Whisper (Go) برای تبدیل گفتار به متن. |
| `WHISPER_TIMEOUT_MS` | مهلت زمانی درخواست‌ها به Whisper بر حسب میلی‌ثانیه. |
| `WHISPER_MODELS` | نام/شناسه مدل‌های Whisper قابل استفاده (CSV). |
| `OLLAMA_BASE_URL` | آدرس سرویس Ollama برای اجرای مدل‌های زبانی محلی. |
| `OLLAMA_ENABLED` | فعال/غیرفعال کردن استفاده از Ollama. |
| `LMSTUDIO_BASE_URL` | آدرس API سازگار با OpenAI در LM Studio. |
| `LMSTUDIO_ENABLED` | فعال/غیرفعال کردن استفاده از LM Studio. |
| `GROQ_API_KEY` | کلید API برای سرویس اختیاری Groq. |
| `GROQ_ENABLED` | فعال/غیرفعال کردن سرویس Groq. |
| `GEMINI_API_KEY` | کلید API برای سرویس اختیاری Gemini. |
| `GEMINI_ENABLED` | فعال/غیرفعال کردن سرویس Gemini. |
| `STABLE_DIFFUSION_URL` | آدرس Stable Diffusion WebUI برای تولید تصویر. |
| `STABLE_DIFFUSION_ENABLED` | فعال/غیرفعال کردن تولید تصویر. |
| `IMAGES_DIR` | مسیر ذخیره خروجی تصاویر تولیدشده. |
| `DOCUMENTS_DIR` | مسیر ذخیره اسناد بارگذاری‌شده. |
| `EMBEDDING_MODEL` | شناسه مدل embedding برای RAG. |
| `WEB_DIST_DIR` | مسیر پوشه خروجی build وب برای سرو شدن توسط سرور. |
| `SSL_ENABLED` | فعال/غیرفعال کردن TLS در سرور. |
| `SSL_CERT_PATH` | مسیر گواهی TLS. |
| `SSL_KEY_PATH` | مسیر کلید خصوصی TLS. |

## توصیه‌های عملیاتی

در محیط تولید، تنظیم صحیح کلیدهایی مانند `JWT_SECRET` و محدودسازی `CORS_ORIGIN` حیاتی است. همچنین پیشنهاد می‌شود مسیرهای داده (`DATABASE_FILE`، `DOCUMENTS_DIR` و `IMAGES_DIR`) روی دیسک پایدار تنظیم شوند و برای آن‌ها سیاست پشتیبان‌گیری تعریف گردد.
