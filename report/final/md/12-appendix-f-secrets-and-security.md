# پیوست F: مدیریت اسرار و امنیت

این پیوست با اتکا به `docs/SECRETS.md`، چارچوب مدیریت اسرار را ارائه می‌کند. در سیستم‌های local-first نیز مدیریت اسرار اهمیت دارد؛ زیرا اشتباه در پیکربندی می‌تواند به نشت داده یا دسترسی غیرمجاز منجر شود.

یادداشت همگام‌سازی با کد: در پیاده‌سازی فعلی سرور (`apps/server/src/config.ts`)، پیکربندی از فایل `config.json` خوانده و با Zod اعتبارسنجی می‌شود و (حداقل در مسیر کد فعلی) ادغام مستقیم `process.env` در شِمای پیکربندی دیده نمی‌شود. همچنین تابع `validateProductionSecrets()` در حال حاضر برخی کنترل‌های امنیتی (مانند `JWT_SECRET` و کلیدهای API در صورت فعال بودن سرویس‌ها) را اعمال می‌کند و کنترل‌هایی مانند محدودسازی `CORS_ORIGIN` که در سند زیر توصیه شده‌اند، الزاماً enforce نشده‌اند. بنابراین متن زیر باید به عنوان «راهنمای پیشنهادی/سیاست‌نامه امنیتی» خوانده شود و برای استقرار تولید، لازم است با واقعیت پیاده‌سازی و سیاست‌های سازمانی همگام گردد.

## متن سند

```md
# Secrets Management Guide

This document explains how secrets and sensitive configuration are managed in Dastyar AI.

## Overview

Dastyar AI uses a layered configuration system that prioritizes security:

1. **Environment Variables** (highest priority) - Production secrets MUST use this
2. **config.json** - Non-sensitive configuration defaults
3. **Schema defaults** - Fallback values for development

## Sensitive Configuration Fields

The following fields contain sensitive data and should be managed carefully:

- `JWT_SECRET` - Secret key for signing authentication tokens
- `GROQ_API_KEY` - API key for Groq service (if enabled)
- `GEMINI_API_KEY` - API key for Google Gemini (if enabled)

## Configuration Priority

The config system loads in this order:

```
Environment Variables > config.json > Schema Defaults
```

**Important:** In production, sensitive fields MUST come from environment variables, not config.json.

## Development Setup

### Using .env File (Recommended)

Create a `.env` file in the project root (git-ignored):

```bash
# Copy from example
cp .env.example .env

# Edit with your values
nano .env
```

Example `.env` file:

```env
# Required: Generate with: openssl rand -base64 48
JWT_SECRET=your-unique-secret-here

# Optional: Only if using Groq
GROQ_API_KEY=your-groq-api-key-here
GROQ_ENABLED=true

# Optional: Only if using Gemini
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_ENABLED=true
```

### Using config.json (Development Only)

For local development, you can use `config.json`, but **NEVER commit secrets to it**.

The repository `config.json` has sensitive fields removed. To use secrets in development:

1. **Option A:** Use `.env` file (recommended)
2. **Option B:** Add secrets to `config.json` locally (ensure it's git-ignored or never committed)

## Production Deployment

### Security Requirements

In production, the system enforces these security checks:

1. ✅ JWT_SECRET must not be a default/example value
2. ✅ API keys must be set if their services are enabled
3. ✅ CORS_ORIGIN must not contain wildcards or localhost
4. ✅ Sensitive fields should come from environment variables

### Setting Environment Variables

#### Option 1: System Environment Variables

```bash
export JWT_SECRET="$(openssl rand -base64 48)"
export GROQ_API_KEY="your-api-key"
export GROQ_ENABLED="true"
```

#### Option 2: .env File with Production Values

```bash
# Create production .env file
cat > .env.production <<EOF
NODE_ENV=production
JWT_SECRET=$(openssl rand -base64 48)
GROQ_API_KEY=your-api-key
GROQ_ENABLED=true
CORS_ORIGIN=https://yourdomain.com
EOF

# Load it before starting the server
source .env.production
./dastyar-ai
```

#### Option 3: Docker Environment Variables

```dockerfile
# In docker-compose.yml
services:
  dastyar:
    environment:
      JWT_SECRET: ${JWT_SECRET}
      GROQ_API_KEY: ${GROQ_API_KEY}
      GROQ_ENABLED: "true"
```

#### Option 4: Cloud Platform Secrets

Most cloud platforms have secrets management:

- **AWS**: Use AWS Secrets Manager or Parameter Store
- **Azure**: Use Azure Key Vault
- **GCP**: Use Google Secret Manager
- **Heroku**: Use Config Vars
- **Docker**: Use Docker Secrets

## Generating Secure Secrets

### JWT Secret

```bash
# Generate 48-byte (384-bit) secret
openssl rand -base64 48

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"

# Or using Bun
bun -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

### API Keys

API keys should be obtained from the respective service providers:

- **Groq**: https://console.groq.com/
- **Gemini**: https://ai.google.dev/

## Security Best Practices

### ✅ DO

- Use environment variables for all secrets in production
- Generate unique JWT_SECRET for each deployment
- Rotate secrets regularly
- Use secrets management services in cloud deployments
- Keep `.env` files in `.gitignore`
- Use different secrets for development, staging, and production
- Document which secrets are required for which features

### ❌ DON'T

- Commit secrets to git (check with `git log --all -S "JWT_SECRET"`)
- Use default/example secrets in production
- Share secrets in chat/email/tickets
- Store secrets in config.json in production
- Reuse the same secrets across environments
- Log secrets (even in debug mode)

## Validation

The system automatically validates secrets on startup:

### Development Mode

- Allows default values (shows warnings)
- No enforcement of environment variable usage
- Useful for quick local testing

### Production Mode

- **Fails to start** if using default/example secrets
- Requires environment variables for sensitive fields
- Validates CORS configuration
- Ensures API keys are set if services are enabled

## Checking Your Configuration

To verify your secrets are properly configured:

```bash
# Start the server - it will validate on startup
bun run start

# Check logs for validation messages:
# ✅ "Production secrets validation passed"
# ❌ "Production security configuration issues detected"
```

## Troubleshooting

### Error: "JWT_SECRET is using a default/example value"

**Solution:** Set a unique JWT_SECRET:

```bash
export JWT_SECRET="$(openssl rand -base64 48)"
```

### Error: "GROQ is enabled but GROQ_API_KEY is not set"

**Solution:** Either set the API key or disable the service:

```bash
export GROQ_API_KEY="your-api-key"
# OR
export GROQ_ENABLED="false"
```

### Error: "Sensitive field found in config.json in production mode"

**Warning:** You have secrets in config.json in production.

**Solution:** Move them to environment variables:

1. Remove the field from config.json
2. Set it as an environment variable instead
3. Restart the server

## Migration Guide

### Migrating from config.json to Environment Variables

If you have secrets in config.json:

1. **Extract secrets to .env file:**

```bash
# Create .env file
cat > .env <<EOF
JWT_SECRET=$(grep JWT_SECRET config.json | cut -d'"' -f4)
GROQ_API_KEY=$(grep GROQ_API_KEY config.json | cut -d'"' -f4)
EOF
```

2. **Remove secrets from config.json:**

```bash
# Edit config.json and remove:
# - JWT_SECRET
# - GROQ_API_KEY
# - GEMINI_API_KEY
```

3. **Test the configuration:**

```bash
# Load .env and start server
source .env
bun run start
```

4. **Commit the cleaned config.json:**

```bash
git add config.json
git commit -m "chore: remove secrets from config.json"
```

## Audit Checklist

Before deploying to production, verify:

- [ ] `.env` file is in `.gitignore`
- [ ] No secrets in `config.json`
- [ ] Unique JWT_SECRET generated and set
- [ ] API keys set for enabled services
- [ ] Production CORS_ORIGIN configured
- [ ] Secrets rotation schedule established
- [ ] Team members know where to find secrets (secrets manager)
- [ ] Backup/disaster recovery plan includes secrets

## Related Documentation

- [.env.example](../.env.example) - Example environment variables
- [config.json](../config.json) - Non-sensitive configuration
- [apps/server/src/config.ts](../apps/server/src/config.ts) - Configuration loading logic
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment guide

## Support

If you need help with secrets management:

1. Check this documentation
2. Review `.env.example` for available options
3. Check server logs for validation errors
4. Open an issue on GitHub (never include actual secrets!)
```

## نکات تکمیلی (Threat Modeling خلاصه)

- مسیرهای ورود داده (فایل‌ها، صوت، متن) باید اعتبارسنجی شوند و اندازه/نوع محدود گردد.
- مسیرهای خروج داده باید شفاف باشد (چه چیزی در چه شرایطی از دستگاه خارج می‌شود).
- لاگ‌ها نباید حاوی اسرار یا محتوای حساس باشند؛ redaction باید در نظر گرفته شود.
