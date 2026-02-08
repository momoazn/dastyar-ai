# پیوست H: بیلد، اجرا و آزمون

این پیوست، نمایی از اسکریپت‌های عملیاتی و تست‌های API را ارائه می‌کند.

## اسکریپت‌های ریشه (package.json)

```json
{
  "name": "dastyar-ai",
  "devDependencies": {
    "@biomejs/biome": "2.2.5",
    "@types/bun": "^1.3.1",
    "@types/node": "^24.9.2",
    "bun-types": "^1.3.1",
    "jszip": "^3.10.1",
    "turbo": "^2.6.0",
    "ultracite": "5.6.2"
  },
  "packageManager": "bun@1.3.0",
  "private": true,
  "scripts": {
    "check-types": "turbo check-types",
    "dev": "turbo dev",
    "build": "bun scripts/build.ts",
    "build:windows": "bun scripts/build.ts --platform=windows",
    "build:all": "bun scripts/build.ts --platform=all",
    "start": "bun scripts/start.ts",
    "stop": "bun scripts/stop.ts",
    "status": "bun scripts/status.ts",
    "download:ffmpeg": "bun scripts/downloads/download-ffmpeg.ts",
    "download:ffmpeg:all": "bun scripts/downloads/download-ffmpeg.ts --all",
    "download:model": "bun scripts/downloads/download-model.ts",
    "test": "turbo test",
    "test:coverage": "turbo test:coverage",
    "test:api": "cd apps/server && bun run run-all-tests-orpc.ts",
    "dev:web": "turbo -F web dev",
    "dev:server": "turbo -F server dev",
    "dev:whisper": "turbo -F whisper dev",
    "config:generate": "turbo -F server config:generate",
    "config:show": "turbo -F server config:show",
    "config:validate": "turbo -F server config:validate",
    "db:push": "turbo -F server db:push",
    "db:studio": "turbo -F server db:studio",
    "db:generate": "turbo -F server db:generate",
    "db:migrate": "turbo -F server db:migrate",
    "lint:fix": "bun ultracite fix",
    "lint:check": "bun ultracite check",
    "clean": "bun run clean:deps && bun run clean:build",
    "clean:deps": "rm -rf node_modules apps/*/node_modules packages/*/node_modules",
    "clean:build": "rm -rf apps/*/dist apps/*/build apps/*/.vite apps/*/.turbo whisper/dist"
  },
  "workspaces": [
    "apps/*"
  ]
}
```

## تست‌های API (scripts/testing)

- `test-auth-api.ts`
- `test-chat-api.ts`
- `test-code-api.ts`
- `test-document-api.ts`
- `test-image-api.ts`
- `test-summary-api.ts`
- `test-translation-api.ts`
- `test-whisper-api.ts`

## توصیه

برای گزارش‌های تحویلی، خروجی اجرای تست‌ها و لاگ‌های کلیدی باید به عنوان ضمیمه به همراه مشخصات محیط (نسخه Bun/Go، مدل‌ها و سخت‌افزار) ثبت شود تا قابلیت بازتولید و مقایسه نسخه‌ها فراهم گردد.

یادداشت اجرایی: در نسخه فعلی مخزن، برخی اسکریپت‌های معرفی‌شده در `apps/server/package.json` (مانند `config:generate` و `seed:models`) به فایل‌هایی اشاره می‌کنند که در مسیرهای ذکرشده موجود نیستند. بنابراین، پیش از اتکا به این دستورات در فرآیندهای CI/CD یا runbookهای سازمانی، لازم است مسیرها/اسکریپت‌ها با وضعیت واقعی کد همگام‌سازی شوند.
