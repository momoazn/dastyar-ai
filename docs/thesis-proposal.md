# Dastyar AI - Complete Thesis Proposal

## طراحی و پیاده‌سازی دستیار هوشمند چندمنظوره آفلاین با تمرکز بر حریم خصوصی و پشتیبانی بهینه از زبان فارسی

### بيان مسأله، مشخصات علمی و فنی برنامه

در سال‌های اخیر، هوش مصنوعی و به‌ویژه مدل‌های زبانی بزرگ (LLMs) نحوه تعامل انسان با رایانه را دگرگون کرده‌اند؛ اما اغلب دستیارهای هوشمند موجود مبتنی بر پردازش ابری هستند و برای عملکرد مطلوب به اتصال پایدار و پرسرعت اینترنت نیاز دارند. این وابستگی، در کنار ریسک نقض حریم خصوصی (ارسال صدا و متن کاربر به سرورهای ثالث)، ضعف پشتیبانی از زبان فارسی در ASR و LLMها و پراکندگی ابزارها (چند برنامه جداگانه برای تایپ صوتی، چت، خلاصه‌سازی، تولید تصویر و غیره)، مسئله‌ی اصلی این طرح را شکل می‌دهد: طراحی یک دستیار هوشمند یکپارچه، آفلاین و فارسی‌محور که بتواند بدون ارسال داده به اینترنت، تجربه‌ای هم‌تراز یا نزدیک به سرویس‌های ابری ارائه کند.

برنامه پیشنهادی «Dastyar AI» یک سامانه نرم‌افزاری مدولار است که بر پایه مدل‌های زبانی بزرگ مبتنی بر معماری ترنسفورمر، مدل‌های تشخیص گفتار End-to-End و تکنیک‌هایی مانند Quantization، Embedding و Retrieval-Augmented Generation طراحی می‌شود تا امکان اجرای محلی مدل‌های چند میلیارد پارامتری روی سخت‌افزارهای مصرفی فراهم گردد. از نظر فنی، پلتفرم شامل یک هسته پردازشی مبتنی بر Bun و Hono در سمت سرور، رابط کاربری تحت وب مبتنی بر React 19، میکروسرویس مستقل Whisper بر مبنای Go و whisper.cpp، و زیرسیستم RAG مبتنی بر SQLite و ذخیره‌سازی برداری است که از طریق APIهای سبک و قراردادهای تایپ‌شده به هم متصل می‌شوند و بستری منسجم برای پیاده‌سازی و ارزیابی ASR، LLM و RAG ایجاد می‌کنند.

## برنامه‌های مشابه

در سال‌های اخیر، ابزارهایی مانند **PrivateGPT**، **OpenWebUI** و **LM Studio** برای اجرای محلی مدل‌های زبانی و پیاده‌سازی RAG معرفی شده‌اند و نشان داده‌اند که ترکیب Embedding و LLM می‌تواند جایگزین جستجوی سنتی در اسناد شود. با این حال، این ابزارها عموماً انگلیسی‌محور بوده، برای پشتیبانی از فارسی و راست‌چین بودن رابط کاربری محدودیت دارند و به تنظیمات نسبتاً پیچیده (برای نمونه، Docker و تنظیمات دستی مدل‌ها) متکی‌اند.

شکاف اصلی که این پژوهش به‌دنبال پر کردن آن است، نبودِ یک «راه‌حل یکپارچه، فارسی‌محور و کاملاً آفلاین» است که بتواند به‌صورت ساده در سازمان‌ها و نزد کاربران نهایی نصب و استفاده شود. «Dastyar AI» با تمرکز بر زبان و تجربه کاربری فارسی، حذف وابستگی به اینترنت و ترکیب هم‌زمان گفتار، متن و اسناد در یک رابط واحد، گامی فراتر از این برنامه‌های مشابه برمی‌دارد.

## جنبه‌های نوآوری برنامه نسبت به برنامه‌های مشابه

نوآوری اصلی این طرح در تمرکز هم‌زمان بر «زبان فارسی»، «اجرای کاملاً آفلاین» و «یکپارچگی کامل اجزا» است؛ به‌گونه‌ای که طراحی رابط کاربری، تنظیمات مدل‌ها، استراتژی‌های RAG و سناریوهای ارزیابی از ابتدا بر اساس نیازها و چالش‌های فارسی (راست‌چین بودن، لهجه‌ها، متون تخصصی و محدودیت‌های زیرساختی) انجام می‌شود، در حالی که تمامی پردازش‌ها روی دستگاه کاربر و بدون وابستگی به سرویس‌های ابری صورت می‌گیرد. ترکیب این رویکرد با معماری Monorepo مدرن، استفاده از Bun به عنوان Runtime سریع و ادغام ASR، LLM و RAG در قالب یک محصول «One-Click» برای کاربر نهایی، این طرح را از ابزارهای موجود که معمولاً یا انگلیسی‌محورند یا نیازمند تنظیمات پیچیده هستند، متمایز می‌کند.

## ضرورت پیاده‌سازی برنامه در سازمان

برای سازمان‌هایی که با داده‌های حساس مانند اسناد حقوقی، سوابق پزشکی، اطلاعات مالی و داده‌های محرمانه سروکار دارند، استفاده از دستیارهای ابری با الزامات امنیت اطلاعات و حاکمیت داده سازگار نیست. پیاده‌سازی یک دستیار هوشمند کاملاً محلی مانند «Dastyar AI» امکان بهره‌گیری از تولید متن، خلاصه‌سازی، جستجوی هوشمند، تحلیل اسناد و تعامل صوتی با سامانه‌ها را درون مرزهای زیرساخت سازمان و بدون خروج داده فراهم می‌کند.

از سوی دیگر، محدودیت‌های اینترنت، هزینه‌های ارزی سرویس‌های ابری و چالش‌های حقوقی استفاده از پلتفرم‌های خارجی در ایران، این راه‌حل را از یک انتخاب صرفاً فنی به یک ضرورت راهبردی برای ارتقای بهره‌وری و خودکفایی دیجیتال سازمان تبدیل می‌کند. این برنامه می‌تواند به‌عنوان بخشی از استراتژی کلان تحول دیجیتال سازمان‌ها، به‌ویژه در حوزه‌های دولتی و صنایع حساس، مورد استفاده قرار گیرد.

## موارد استفاده از نتایج حاصل از اجرای طرح در صنعت

نتایج این طرح در حوزه‌های متعددی از صنعت قابل استفاده است. در خدمات مشتری و مراکز تماس، «Dastyar AI» می‌تواند برای پاسخ‌گویی هوشمند به پرسش‌های متداول، تحلیل مکالمات صوتی و تولید خودکار گزارش‌ها و خلاصه‌ها به‌کار رود. در حوزه تولید محتوا، رسانه و بازاریابی، سامانه قادر است در ایده‌پردازی، نگارش و بومی‌سازی محتوای چندزبانه با تمرکز بر فارسی نقش‌آفرینی کند.

در صنایع دانش‌بنیان، حقوقی و پزشکی، زیرسیستم RAG امکان «گفتگو با اسناد» را فراهم می‌کند؛ به این معنا که کارشناسان به جای جستجوی دستی در هزاران صفحه سند، می‌توانند سوالات خود را به زبان طبیعی مطرح کرده و پاسخ‌های مستند و قابل ردیابی دریافت کنند. همچنین، در حوزه آموزش و یادگیری سازمانی، این دستیار هوشمند می‌تواند به‌عنوان مربی مجازی برای راهنمایی کارکنان در استفاده از سامانه‌های داخلی، مستندات فنی و فرآیندهای سازمانی مورد استفاده قرار گیرد.

## موانع، مشكلات و ريسک‌هاي احتمالي در راه انجام پروژه

با توجه به ماهیت چندرشته‌ای و وابستگی پروژه به فناوری‌های نوظهور، موانعی مانند محدودیت توان پردازشی و حافظه در سخت‌افزارهای هدف، کیفیت نه‌چندان مطلوب داده‌های زبانی و صوتی فارسی (به‌ویژه در گفتار محاوره و متون تخصصی) و پیچیدگی راه‌اندازی محیط توسعه (Bun، Go، whisper.cpp و زیرسیستم RAG) قابل پیش‌بینی است. محدودیت سخت‌افزاری می‌تواند باعث کاهش سرعت یا ضرورت استفاده از مدل‌های کوچک‌تر شود و کیفیت داده‌ها ممکن است دقت ASR و LLM را در حوزه‌های تخصصی تحت تأثیر قرار دهد.

برای مدیریت این ریسک‌ها، طراحی پروفایل‌های عملکردی سبک و سنگین، بهره‌گیری از تکنیک‌های Quantization و دستورهای برداری CPU، استفاده از RAG برای تزریق دانش دامنه‌ای بدون نیاز به آموزش مجدد مدل، و طراحی سناریوهای تست متنوع در نظر گرفته می‌شود. همچنین، مستندسازی دقیق، ارائه اسکریپت‌های خودکار برای نصب و پیکربندی و تعریف یک فرایند CI/CD کمک می‌کند تا ریسک‌های ناشی از پیچیدگی فنی و ناهمخوانی نسخه‌های ابزارها کاهش یابد.

## دستاوردها و اهداف مورد انتظار به‌صورت دقیق و خلاصه

هدف کلی این پژوهش، طراحی و پیاده‌سازی یک دستیار هوشمند چندمنظوره تحت وب است که قابلیت اجرا بر روی سیستم‌های شخصی (Localhost) را داشته باشد و بتواند تعامل صوتی، متنی و مبتنی بر اسناد را به‌صورت یکپارچه ارائه دهد. اهداف اختصاصی شامل یکپارچه‌سازی موتور تبدیل گفتار به متن Whisper با واسط‌های بهینه‌شده Go، ایجاد بستر اتصال به مدل‌های زبانی متن‌باز (مانند Llama 3 یا Gemma) از طریق پروتکل‌های استاندارد، طراحی و پیاده‌سازی سیستم RAG برای «گفتگو با اسناد»، توسعه رابط کاربری مدرن و واکنش‌گرا برای کاربران فارسی‌زبان و بهینه‌سازی معماری نرم‌افزار با استفاده از ابزارهایی مانند Bun است.

دستاورد اصلی نرم‌افزاری این طرح، توسعه یک بسته کاربردی آماده‌استقرار شامل سرور وب مبتنی بر Bun و Hono، رابط کاربری واکنش‌گرا برای تعامل صوتی و متنی، میکروسرویس Whisper مبتنی بر Go و whisper.cpp و زیرسیستم RAG مبتنی بر SQLite و ذخیره‌سازی برداری است که همگی در قالب یک Monorepo یکپارچه عرضه می‌شوند تا نصب و نگهداری را ساده کنند. از منظر علمی نیز تولید مستندات فنی، نتایج آزمایش‌های کمی (مانند WER، سرعت استنتاج و معیارهای رضایت کاربر)، گزارش نهایی پایان‌نامه و حداقل یک مقاله علمی-پژوهشی بر اساس نتایج پروژه هدف‌گذاری می‌شود و این طرح زیرساختی برای توسعه نسل بعدی ابزارهای فارسی‌محور فراهم می‌آورد.

## برنامه اصلي توسعه داده شده در اين پروژه

برنامه اصلی که در این پروژه توسعه می‌یابد، یک هسته نرم‌افزاری یکپارچه برای اجرای محلی دستیار هوشمند است که شامل سرویس وب، رابط کاربری، موتور تشخیص گفتار، لایه اتصال به مدل‌های زبانی و زیرسیستم RAG می‌شود و به‌عنوان زیرساخت مشترک برای سناریوهای مختلف سازمانی (پشتیبانی مشتری، جستجوی اسناد، تولید محتوا و غیره) به‌کار گرفته خواهد شد. برای ثبت این برنامه در سامانه ویکی داخلی سازمان، عنوان کوتاه و یکتای **«Dastyar AI Core»** پیشنهاد می‌شود که نقش آن را به‌عنوان هسته و زیرساخت مرکزی سامانه منعکس می‌کند و می‌تواند مدخل اصلی مستندسازی معماری، وابستگی‌ها و سناریوهای استفاده باشد.

## فنی و معماری سیستم

### Chapter 1: Generalities and Ethics

#### 1.1 System Architecture
The Dastyar AI system follows a modular microservices architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                         │
│  React 19 + TypeScript + Vite + Tailwind CSS             │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/WebSocket
┌─────────────────────▼───────────────────────────────────────┐
│                    API Layer                              │
│  Bun Runtime + Hono Framework + ORPC + TypeScript        │
└─────────────────────┬───────────────────────────────────────┘
                      │ Internal APIs
┌─────────────────────▼───────────────────────────────────────┐
│                Service Layer                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │
│  │   Chat      │ │ Translation │ │   Image     │         │
│  │  Service    │ │  Service    │ │ Generation  │         │
│  └─────────────┘ └─────────────┘ └─────────────┘         │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                Data Layer                                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │
│  │   SQLite    │ │ Whisper     │ │  File       │         │
│  │ Database    │ │  Service    │ │ Storage     │         │
│  │   (Drizzle) │ │   (Go)      │ │             │         │
│  └─────────────┘ └─────────────┘ └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

#### 1.2 Technology Stack
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, TanStack Router
- **Backend**: Bun, Hono, TypeScript, ORPC, Drizzle ORM
- **Speech**: Whisper.cpp (C++) with Go wrapper
- **Database**: SQLite with Drizzle migrations
- **AI/ML**: Integration with Ollama, LM Studio, custom model endpoints

### Chapter 2: Advanced Theory

#### 2.1 Retrieval-Augmented Generation (RAG)
The RAG system combines vector similarity search with LLM generation:

1. **Document Processing**
   - PDF, DOCX, TXT file parsing
   - Text chunking with overlap
   - Vector embedding using sentence-transformers
   - Storage in SQLite with vector extension

2. **Retrieval Process**
   - Query embedding generation
   - Similarity search (cosine similarity)
   - Top-k document retrieval
   - Context preparation for LLM

3. **Generation Enhancement**
   - Retrieved context injection
   - Prompt engineering for Persian
   - Citation generation
   - Answer validation

#### 2.2 Persian Language Processing
Special considerations for Persian language support:

- **Text Direction**: RTL layout and mixed RTL/LTR handling
- **Tokenization**: Proper Persian word segmentation
- **Normalization**: Arabic numeral conversion, character normalization
- **Font Support**: Noto Sans Arabic and Persian font rendering
- **Input Methods**: Virtual keyboard for Persian input

#### 2.3 Privacy and Security Architecture

1. **Local-First Processing**
   - All processing happens locally
   - No data sent to external services
   - User control over data storage
   - Optional cloud synchronization

2. **Data Protection**
   - Encryption at rest (SQLite encryption)
   - Secure key management
   - User authentication with JWT
   - Session management

3. **Privacy by Design**
   - Minimal data collection
   - User consent mechanisms
   - Data deletion capabilities
   - Transparency reports

### Chapter 3: Advanced Implementation

#### 3.1 Core Services Implementation

**Chat Service**
```typescript
// ORPC procedure for chat
chat: publicProcedure
  .input(chatSchema)
  .handler(async ({ input }) => {
    // Process message with RAG if documents are available
    const context = await retrieveRelevantDocuments(input.message);
    const response = await generateLLMResponse(input.message, context);
    return response;
  })
```

**Translation Service**
```typescript
// Translation with model fallback
translation: publicProcedure
  .input(translationSchema)
  .handler(async ({ input }) => {
    const models = await getAvailableTranslationModels();
    const response = await translateWithModel(input, models);
    return response;
  })
```

**Image Generation Service**
```typescript
// Image generation with multiple providers
imageGeneration: publicProcedure
  .input(imageGenSchema)
  .handler(async ({ input }) => {
    const provider = await selectOptimalProvider(input.style);
    const image = await generateImage(input, provider);
    return image;
  })
```

#### 3.2 Whisper Service (Go Implementation)

The Whisper service provides high-performance speech-to-text:

```go
type WhisperService struct {
    model *whisper.Context
    config *Config
}

func (ws *WhisperService) Transcribe(audio []byte) (string, error) {
    // Audio preprocessing
    processed := preprocessAudio(audio)
    
    // Whisper inference
    result := ws.model.Transcribe(processed, ws.config)
    
    // Post-processing for Persian
    return postprocessPersian(result), nil
}
```

#### 3.3 Database Schema and Migrations

Core tables for the system:

```sql
-- Users and authentication
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Chat threads and messages
CREATE TABLE chat_threads (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE messages (
    id INTEGER PRIMARY KEY,
    thread_id INTEGER NOT NULL,
    role TEXT NOT NULL, -- 'user' or 'assistant'
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (thread_id) REFERENCES chat_threads(id)
);

-- Document storage and RAG
CREATE TABLE documents (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding BLOB, -- Vector embedding
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- System settings
CREATE TABLE system_settings (
    id INTEGER PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL, -- JSON value
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 3.4 System Requirements and Performance

**Minimum Requirements:**
- CPU: 4 cores (x86_64 or ARM64)
- RAM: 8GB (16GB recommended)
- Storage: 10GB free space
- OS: Windows 10+, macOS 10.15+, or Linux

**Performance Optimization:**
- Lazy loading of components
- Database query optimization
- Vector indexing for RAG
- Model quantization
- Caching strategies

### Chapter 4: Execution Plan

#### 4.1 Development Phases

**Phase 1: Core Infrastructure (Weeks 1-4)**
- [x] Project setup and CI/CD
- [x] Database schema and migrations
- [x] Basic API endpoints
- [x] Authentication system
- [x] Frontend routing and layout

**Phase 2: AI Integration (Weeks 5-8)**
- [x] LLM model integration
- [x] Whisper service implementation
- [x] Basic chat functionality
- [x] Translation service
- [x] Image generation

**Phase 3: Advanced Features (Weeks 9-12)**
- [x] RAG system implementation
- [x] Document processing
- [x] User management
- [x] Admin panel
- [x] Settings management

**Phase 4: Polish and Deployment (Weeks 13-16)**
- [ ] Performance optimization
- [ ] Security hardening
- [ ] Documentation completion
- [ ] Deployment automation
- [ ] User acceptance testing

#### 4.2 Testing Strategy

**Unit Testing**
- Server-side functions and procedures
- Frontend components and hooks
- Utility functions
- Database operations

**Integration Testing**
- API endpoints
- Database transactions
- External service integration
- Cross-service communication

**End-to-End Testing**
- User workflows
- Authentication flows
- Document upload and processing
- Chat and translation features

#### 4.3 Quality Assurance

**Code Quality**
- TypeScript strict mode
- ESLint and Prettier configuration
- Code review process
- Automated linting in CI

**Performance Monitoring**
- Response time tracking
- Memory usage monitoring
- Database query analysis
- Frontend bundle size optimization

**Security Measures**
- Input validation
- SQL injection prevention
- XSS protection
- Authentication and authorization testing

## منابع (References)

1. Vaswani, A., et al. (2017). "Attention is All You Need". arXiv:1706.03762
2. Radford, A., et al. (2019). "Language Models are Unsupervised Multitask Learners". OpenAI
3. Lewis, P., et al. (2020). "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks". arXiv:2005.11401
4. Radford, A., et al. (2022). "Robust Speech Recognition via Large-Scale Weak Supervision". arXiv:2212.04356
5. Touvron, H., et al. (2023). "Llama 2: Open Foundation and Fine-Tuned Chat Models". arXiv:2307.09288

---

**پروژه**: Dastyar AI
**نوع**: پایان‌نامه کارشناسی ارشد
**رشته**: علوم کامپیوتر - هوش مصنوعی
**آخرین به‌روزرسانی**: 2025-11-23