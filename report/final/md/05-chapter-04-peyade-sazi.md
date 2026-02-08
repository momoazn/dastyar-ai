# فصل چهارم: پیاده‌سازی

## ۴-۱ مقدمه

در این فصل، پیاده‌سازی سامانه بر اساس واقعیت مخزن کد تشریح می‌شود. هدف، ارائه یک نمای مهندسی از مسئولیت ماژول‌ها، نقاط اتصال سرویس‌ها و مسیر داده است تا نگهداشت و توسعه آتی ممکن شود.

## ۴-۲ پیاده‌سازی سرور اصلی (Bun/Hono)

### ۴-۲-۱ ساختار ماژول‌ها

پوشه‌های اصلی `apps/server/src` عبارت‌اند از:

- `database/`
- `lib/`
- `middlewares/`
- `procedures/`
- `repositories/`
- `routes/`
- `scripts/`
- `services/`
- `types/`
- `utils/`

### ۴-۲-۲ مسیرهای سطح بالا

نقاط اتصال تعریف‌شده در `apps/server/src/app.ts`:

- Mount: `/rpc`
- Mount: `/api/chat`
- Mount: `/api/images`

Endpoints کمکی/سلامت:

- `GET /health`

### ۴-۲-۲-الف گزیده کد: اتصال مسیرها و endpoint سلامت

```ts
import { join } from "node:path";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { logger as honoLogger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { env, webDistDir } from "./config";
import { logger } from "./lib/logger";
import chatHandler from "./routes/chat";
import imagesHandler from "./routes/images";
import orpcHandler from "./routes/rpc";

// Regex patterns moved to top level for performance
const TRAILING_SLASH_REGEX = /\/$/;

export function createApp() {
  const app = new Hono();

  // Logger middleware
  app.use(honoLogger());

  // Security headers middleware
  app.use(
    "*",
    secureHeaders({
      contentSecurityPolicy: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
      crossOriginOpenerPolicy: false, // Disable COOP for non-HTTPS origins (allows network access)
      xFrameOptions: "DENY",
      xContentTypeOptions: "nosniff",
      referrerPolicy: "strict-origin-when-cross-origin",
      strictTransportSecurity: "max-age=31536000; includeSubDomains",
    })
  );

  // CORS middleware
  app.use(
    "/*",
    cors({
      origin: env.CORS_ORIGIN,
      allowMethods: ["GET", "POST", "OPTIONS"],
    })
  );

  // API routes
  app.route("/rpc", orpcHandler);
  app.route("/api/chat", chatHandler);
  app.route("/api/images", imagesHandler);

  // Health endpoints
  // if (!isProduction()) {
  //   app.get("/", (c) => c.text("Server is running", 200));
  // }
  app.get("/health", async (c) => {
    const base =
      env.WHISPER_SERVER_URL?.replace(TRAILING_SLASH_REGEX, "") || "";
    let whisper = { available: false, status: 0 };
    if (base) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(
          () => controller.abort(),
          env.WHISPER_TIMEOUT_MS
        );
        const res = await fetch(`${base}/health`, {
          signal: controller.signal,
        });
        clearTimeout(timer);
        whisper = { available: res.ok, status: res.status };
      } catch {
        whisper = { available: false, status: 0 };
      }
    }
    return c.json({ status: "ok", whisper });
  });

  const spaIndexPath = join(webDistDir, "index.html");
  app.use(
    "/*",
    serveStatic({
      root: webDistDir,
    })
  );

  // Global error handler
  app.onError((err, c) => {
    // Log the error for observability
    logger.error("Request error", err, {
      path: c.req.path,
      method: c.req.method,
    });
    const status = err instanceof HTTPException ? err.status : 500;
    const message =
      err instanceof HTTPException ? err.message : "Internal Server Error";
    return c.json({ error: message }, status);
  });

  // 404 handler
  app.notFound((c) => {
    const isGet = c.req.method === "GET";
    const path = c.req.path;
    if (isGet && !path.startsWith("/api") && !path.startsWith("/rpc")) {
      const indexFile = Bun.file(spaIndexPath);
      return c.newResponse(indexFile.stream(), 200, {
        "Content-Type": "text/html; charset=utf-8",
      });
    }
    return c.json({ error: "Not Found" }, 404);
  });

  return app;
}
```

نکته‌های اجرایی: (۱) مسیر `GET /` که صرفاً یک پاسخ متنی برای توسعه برمی‌گرداند، در نسخه فعلی کامنت شده و به عنوان endpoint سلامت قابل اتکا محسوب نمی‌شود. (۲) endpoint `GET /health` برای بررسی وضعیت سرویس Whisper به `${WHISPER_SERVER_URL}/health` درخواست می‌زند؛ در حالی که سرویس Whisper موجود در `apps/whisper/main.go` به طور پیش‌فرض مسیر `/health` را ارائه نمی‌کند و تنها `GET /v1/models` و `POST /v1/audio/transcriptions` را در اختیار می‌گذارد. بنابراین، برای هم‌راستایی عملیاتی لازم است یا یک مسیر سلامت به Whisper افزوده شود یا check سلامت سرور اصلی به مسیرهای موجود (مثلاً `GET /v1/models`) منتقل گردد.

### ۴-۲-۳ لایه اعتبارسنجی ورودی و قرارداد API

یکی از خطاهای رایج در پیاده‌سازی سرویس‌های AI، پذیرش ورودی‌های نامعتبر و تولید خطاهای غیرقابل ردیابی در عمق سیستم است. در این پروژه، برای مسیرهای کلیدی از اعتبارسنجی مبتنی بر Zod استفاده می‌شود تا از ورود payloadهای ناقص/ناسازگار جلوگیری گردد. مزیت این رویکرد در پروژه‌های monorepo آن است که قراردادها می‌توانند type-safe شوند و تغییرات شکستن‌زا سریع‌تر آشکار شوند.

### ۴-۲-۴ مدیریت وضعیت مکالمه و ذخیره‌سازی پیام‌ها

سامانه گفتگو معمولاً به مفهومی معادل «Thread» نیاز دارد تا پیام‌ها به صورت منطقی گروه‌بندی شوند. در پیاده‌سازی موجود، علاوه بر ذخیره متن پیام، ساختار پیام‌ها به شکل «parts» نگهداری می‌شود تا انواع محتوا (متن، تصویر، reasoning و ... در صورت وجود) قابل مدیریت باشد. چنین طراحی‌ای در آینده امکان افزودن قابلیت‌هایی مانند ارجاع‌دهی منابع، پیوست‌ها و نمایش چندرسانه‌ای را فراهم می‌کند.

### ۴-۲-۵ مدیریت خطا و امنیت در سطح وب

در سطح سرور، مدیریت خطا به شکل سراسری انجام می‌شود تا پاسخ‌های خطا یکنواخت و قابل مصرف توسط UI باشد. همچنین secure headers و CORS برای کنترل سطح حمله و سازگاری با محیط‌های مختلف فعال می‌شوند. در مسیرهای حساس (مانند چت)، middleware احراز هویت اعمال می‌شود و ورودی‌ها با Zod اعتبارسنجی می‌گردد.

### ۴-۲-۵-الف گزیده کد: مسیر چت و تعامل با ذخیره‌سازی/بازیابی

```ts
import { zValidator } from "@hono/zod-validator";
import {
  convertToModelMessages,
  extractReasoningMiddleware,
  streamText,
  wrapLanguageModel,
} from "ai";
import { type Context, Hono } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { z } from "zod";
import type { JsonValue } from "@/database";
import { logger } from "@/lib/logger";
import { chatSystemPrompt } from "@/lib/prompts";
import { type AuthEnv, authMiddleware } from "@/middlewares/auth";
import { getModelById } from "@/repositories/llm-models";
import {
  appendMessageParts,
  createMessage,
  updateMessage,
} from "@/repositories/messages";
import { updateThreadOnNewMessage } from "@/repositories/threads";
import { acquireProviderForModel } from "@/services/ai-providers";
import {
  buildContextFromChunks,
  retrieveRelevantChunksForThread,
} from "@/services/processors";
import { getModelSizeCategory, type MyUIMessage } from "@/utils/chat";
import { extractTextFromParts } from "@/utils/text-extractor";

export function sendError(
  c: Context<AuthEnv>,
  params: {
    status: ContentfulStatusCode;
    code: string;
    message: string;
    details?: Record<string, unknown>;
  }
) {
  const { status, code, message, details } = params;
  return c.json({ error: { code, message, details } }, status);
}

const MessagePartSchema = z.union([
  z.object({ type: z.literal("text"), text: z.string() }),
  z.object({
    type: z.literal("image"),
    image: z.string(),
    mimeType: z.string().optional(),
  }),
  z.object({ type: z.literal("reasoning"), text: z.string() }),
  // AI SDK emits step markers for multi-stage responses (e.g., reasoning/tool calls)
  // Allow them through validation so subsequent messages aren't rejected
  z.object({ type: z.literal("step-start") }),
  z.object({
    type: z.literal("tool-call"),
    toolCallId: z.string(),
    toolName: z.string(),
    args: z.record(z.string(), z.unknown()),
  }),
  z.object({
    type: z.literal("tool-result"),
    toolCallId: z.string(),
    result: z.unknown(),
  }),
]);

const ChatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        id: z.string(),
        role: z.enum(["user", "assistant", "system"]),
        parts: z.array(MessagePartSchema).min(1),
        metadata: z.unknown().optional(),
      })
    )
    .min(1),
  modelId: z.coerce.number(),
  threadId: z.coerce.number(),
});

const app = new Hono<AuthEnv>()
  .use(authMiddleware)
  .post("/", zValidator("json", ChatRequestSchema), async (c) => {
    let releaseProvider: (() => void) | null = null;
    try {
      const { messages, modelId, threadId } = c.req.valid("json");
      const uiMessages = messages as unknown as MyUIMessage[];
      const user = c.get("user");

      const last = uiMessages.at(-1);
      if (!last || last.role !== "user") {
        return sendError(c, {
          status: 400,
          code: "INVALID_REQUEST",
          message: "Last message must be from user",
        });
      }

      const llmModel = await getModelById(modelId);
      if (!llmModel) {
        return sendError(c, {
          status: 404,
          code: "MODEL_NOT_FOUND",
          message: "No model exists with the provided id",
          details: { modelId },
        });
      }

      if (!llmModel.isEnabled) {
        return sendError(c, {
          status: 403,
          code: "MODEL_DISABLED",
          message: "The selected model is disabled",
          details: { modelId },
        });
      }

      const providerLease = await acquireProviderForModel(
        llmModel.identifier,
        llmModel.provider
      );
      const providerModel = providerLease.model;
      releaseProvider = providerLease.release;

      // Persist user message (last)
      try {
        await createMessage({
          threadId,
          parts: last.parts as JsonValue,
          modelId,
          status: "finished",
          role: "user",
          userId: user.id,
        });
        await updateThreadOnNewMessage(threadId, user.id, new Date());
      } catch {
        return sendError(c, {
          status: 500,
          code: "PERSIST_USER_MESSAGE_FAILED",
          message: "Could not save the user message",
        });
      }

      const modelMessages = convertToModelMessages(uiMessages);

      // Build RAG context from any documents attached to this thread
      // Extract plain text from the last user message to use as the retrieval query
      const sizeCategory = getModelSizeCategory(llmModel.size);
      let ragSystem = chatSystemPrompt({ sizeCategory });
      try {
        const userQuery = extractTextFromParts(last).content.slice(0, 2000);
        if (userQuery && threadId) {
          const results = await retrieveRelevantChunksForThread({
            userId: user.id,
            threadId,
            query: userQuery,
            topK: 4,
          });
          if (results.length > 0) {
            const ctx = buildContextFromChunks(results);
            ragSystem = chatSystemPrompt({
              context: ctx,
              sizeCategory,
            });
          }
        }
      } catch (error) {
        logger.error("RAG context retrieval failed", error, {
          threadId,
          userId: user.id,
        });
        // Retrieval is best-effort; fall back to default system prompt on failure
      }

      const assistantMessage = await createMessage({
        modelId,
        parts: [],
        role: "assistant",
        status: "streaming",
        threadId,
        userId: user.id,
      });

      // Accumulate assistant text and reasoning and persist in AI SDK parts format with a 500ms throttle
      const throttledUpdateIntervalMs = 500;
      let accumulatedText = "";
      let accumulatedReasoning = "";
      let lastPersistTime = 0;
      let inFlightPersist: Promise<void> | null = null;
      const flushPartialParts = () => {
        if (!(accumulatedText || accumulatedReasoning)) {
          return;
        }

        const partialParts: JsonValue[] = [];
        if (accumulatedReasoning) {
          partialParts.push({
            type: "reasoning",
            text: accumulatedReasoning,
          } as JsonValue);
          accumulatedReasoning = "";
        }
        if (accumulatedText) {
          partialParts.push({
            type: "text",
            text: accumulatedText,
          } as JsonValue);
          accumulatedText = "";
        }

        const persistPromise = appendMessageParts({
          id: assistantMessage.id,
          parts: partialParts,
          status: "streaming",
        });
        inFlightPersist = persistPromise.catch(() => {
          inFlightPersist = null;
        });
      };
```

این گزیده نشان می‌دهد چگونه مسیر چت: (۱) ورودی را اعتبارسنجی می‌کند، (۲) پیام کاربر را ذخیره می‌کند، (۳) به صورت best-effort زمینه RAG را می‌سازد، و (۴) پاسخ را به صورت streaming تولید و در نهایت در پایگاه داده ثبت می‌نماید. این ساختار، در مقایسه با پیاده‌سازی‌های ساده، تاب‌آوری بیشتری در برابر خطاهای جزئی ایجاد می‌کند.

### ۴-۲-۶ جریان داده (Data Flow) در سناریوهای کلیدی

برای فهم درست پیاده‌سازی، شناخت جریان داده ضروری است. در اینجا دو سناریوی کلیدی شرح داده می‌شود:

#### ۴-۲-۶-۱ سناریوی «گفتگو با LLM»

۱) کاربر پیام را در UI وارد می‌کند. ۲) کلاینت درخواست را به سرور ارسال می‌کند. ۳) سرور با اعتبارسنجی payload و احراز هویت، پیام کاربر را در پایگاه داده ذخیره می‌کند. ۴) در صورت فعال بودن پردازش اسناد/RAG برای Thread، سرور ابتدا بازیابی را انجام می‌دهد و زمینه (Context) را می‌سازد. ۵) سپس درخواست به ارائه‌دهنده مدل (مثلاً Ollama/LM Studio/...) ارسال می‌شود و پاسخ به صورت streaming به کلاینت برگردانده می‌شود. ۶) پاسخ نهایی و وضعیت پیام در پایگاه داده ثبت می‌شود.

#### ۴-۲-۶-۲ سناریوی «تبدیل گفتار به متن»

۱) کاربر فایل صوتی را بارگذاری می‌کند یا ضبط می‌نماید. ۲) فایل به سرویس Whisper ارسال می‌شود. ۳) Whisper صوت را به فرمت استاندارد تبدیل کرده و inference را انجام می‌دهد. ۴) متن خروجی به سرور/کلاینت بازگردانده می‌شود و در صورت نیاز در تاریخچه ذخیره می‌گردد. نکته کلیدی آن است که با جداسازی Whisper، بار محاسباتی سنگین ASR روی مسیر اصلی API اثر کمتری می‌گذارد.

## ۴-۳ پیاده‌سازی رابط کاربری (React 19)

پوشه‌های اصلی `apps/web/src` عبارت‌اند از:

- `atoms/`
- `components/`
- `hooks/`
- `layouts/`
- `lib/`
- `routes/`
- `types/`
- `utils/`

در طراحی UI فارسی، مدیریت راست‌به‌چپ بودن، متن‌های ترکیبی (کد/URL/اعداد) و انتخاب فونت، از عوامل تعیین‌کننده کیفیت تجربه کاربر است. همچنین، به دلیل وجود عملیات‌های زمان‌بر (مانند تبدیل گفتار به متن یا پردازش سند)، طراحی وضعیت‌های بارگذاری و پیام‌های خطا اهمیت دارد.

### ۴-۳-۱ ملاحظات دسترس‌پذیری و سازگاری

برای یک محصول قابل استفاده در مقیاس واقعی، دسترس‌پذیری (Accessibility) و سازگاری با دستگاه‌های مختلف ضروری است. استفاده از اجزای UI استاندارد و توجه به ساختار معنایی (Semantic HTML)، در کنار پیام‌های واضح و قابل درک، به کاهش خطاهای کاربر و افزایش اعتماد به سیستم کمک می‌کند. در زبان فارسی، هماهنگی با RTL و جلوگیری از به‌هم‌ریختگی متن‌های ترکیبی، بخشی از همین کیفیت است.

## ۴-۴ سرویس Whisper (Go/whisper.cpp)

سرویس Whisper در `apps/whisper` پیاده‌سازی شده و در `apps/whisper/main.go` دو endpoint اصلی OpenAI-compatible ارائه می‌کند: `POST /v1/audio/transcriptions` و `GET /v1/models`. این طراحی باعث می‌شود کلاینت‌ها بتوانند با قراردادهای رایج به سرویس متصل شوند. در استقرارهای سازمانی، پیشنهاد می‌شود یک مسیر سلامت اختصاصی نیز اضافه شود یا `GET /v1/models` به عنوان check سلامت استفاده گردد.

### ۴-۴-۱ مدیریت مدل‌ها و اثر آن بر عملیات

در سرویس‌های محلی، مدیریت فایل مدل‌ها (دانلود، نسخه‌بندی، محل ذخیره و سیاست به‌روزرسانی) اهمیت دارد. یک رویه عملیاتی مناسب باید مشخص کند: (الف) کدام مدل‌ها برای کدام سناریوها توصیه می‌شوند، (ب) چگونه از مصرف بی‌رویه دیسک جلوگیری می‌شود، و (ج) در صورت خراب شدن مدل یا ناسازگاری نسخه، چه مسیر بازیابی (rollback) وجود دارد. ثبت این موارد، بخشی از بلوغ محصول است.

### ۴-۴-۲ گزیده کد: راه‌اندازی سرویس Whisper و مسیرها

```go
package main

import (
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"whisper/internal/config"
	"whisper/internal/handler"
	"whisper/internal/service"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Initialize Whisper service
	log.Printf("Loading Whisper model: %s from directory: %s", cfg.ModelName, cfg.ModelPath)

	whisperService, err := service.NewWhisperService(cfg.ModelPath, cfg.ModelName)
	if err != nil {
		log.Fatalf("Failed to initialize Whisper service: %v", err)
	}
	defer whisperService.Close()

	log.Println("Whisper model loaded successfully")

	// Create handlers
	transcribeHandler := handler.NewTranscribeHandler(whisperService)

	// Setup routes
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			http.NotFound(w, r)
			return
		}
		http.ServeFile(w, r, "./web/static/index.html")
	})

	// OpenAI-compatible API endpoints
	http.HandleFunc("/v1/audio/transcriptions", transcribeHandler.HandleOpenAITranscriptions)
	http.HandleFunc("/v1/models", transcribeHandler.HandleOpenAIModels)

	// Start server
	addr := fmt.Sprintf("0.0.0.0:%s", cfg.Port)

	log.Printf("Starting Whisper Server on %s", addr)
	log.Println("")
	log.Println("Endpoints:")
	log.Println("  GET  / - Web UI")
	log.Println("")
	log.Println("  OpenAI-compatible API:")
	log.Println("    POST /v1/audio/transcriptions - Transcribe/translate audio")
	log.Println("    GET  /v1/models - List available models")

	// Get local IP addresses
	log.Printf("\nAccess the web interface at:")
	log.Printf("  Local:   http://localhost:%s", cfg.Port)
	log.Printf("  Local:   http://127.0.0.1:%s", cfg.Port)

	// Try to get network IP
	if ips := getLocalIPs(); len(ips) > 0 {
		for _, ip := range ips {
			log.Printf("  Network: http://%s:%s", ip, cfg.Port)
		}
	}

	log.Printf("\n(Server listening on all network interfaces)")
	log.Println("")

	// Setup server
	go func() {
		if err := http.ListenAndServe(addr, nil); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")
}

// getLocalIPs returns a list of local IP addresses
func getLocalIPs() []string {
	var ips []string

	addrs, err := net.InterfaceAddrs()
	if err != nil {
		return ips
	}

	for _, addr := range addrs {
		if ipnet, ok := addr.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
			if ipnet.IP.To4() != nil {
				ips = append(ips, ipnet.IP.String())
			}
		}
	}

	return ips
}
```

## ۴-۵ چارچوب ارزیابی در سطح پیاده‌سازی

برای گزارش‌های تحویلی، توصیه می‌شود نتایج به صورت جدول‌های استاندارد ثبت شوند تا مقایسه نسخه‌ها ممکن شود. برای نمونه، در سنجش ASR باید دیتاست نماینده، نرخ نمونه‌برداری و شرایط نویز مشخص باشد؛ در سنجش LLM باید مدل، دقت کوانتیزاسیون و پارامترهای تولید مشخص گردد؛ و در RAG باید کیفیت chunking و embedding ثبت شود.

## ۴-۶ نتیجه‌گیری

پیاده‌سازی سامانه با تفکیک سرویس‌ها و ماژول‌ها انجام شده است تا هم قابلیت توسعه و هم قابلیت نگهداشت حفظ شود. فصل پنجم، جمع‌بندی دستاوردها و مسیرهای توسعه آتی را ارائه می‌کند.
