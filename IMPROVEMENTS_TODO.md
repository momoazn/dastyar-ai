# Dastyar AI - Improvements & Fixes Todo List

## 📋 How to Use This Document

### Priority Levels
- **🚨 Critical (High Priority)**: Must be fixed immediately - affects functionality and security
- **🔧 Medium Priority**: Important for stability and user experience
- **🏗️ Low Priority**: Nice-to-have improvements for maintainability and testing

### Implementation Approach
1. **Start with Critical issues** - Fix TypeScript errors and security vulnerabilities first
2. **Follow the timeline** in the Implementation Priority Matrix
3. **Check off completed items** as you work through them
4. **Update success metrics** regularly to track progress

### File Organization
- Each todo item includes specific file paths where changes need to be made
- Code examples are provided for complex implementations
- New files are marked with `(new)` suffix

### Dependencies
- Run `bun update` after updating package.json files
- Test thoroughly after dependency updates
- Update both root and app-specific package.json files

## 🚨 Critical Issues (High Priority)

### Type Safety & TypeScript Errors
- [ ] **Verify TypeScript error status**
  - **Current Status**: TypeScript compilation passes with 0 errors (as of latest check)
  - **Action Required**: Run `bun run check-types` to confirm current state
  - **If errors exist**: Document specific errors and fix them systematically
  - **If no errors**: Consider enabling stricter TypeScript settings for future-proofing
- [ ] **Implement strict TypeScript configuration**
  - **File: `apps/web/tsconfig.json`**
    - Enable `"noImplicitAny": true`
    - Enable `"strict": true`
    - Add `"exactOptionalPropertyTypes": true`
    - Add `"noImplicitReturns": true`
    - Add `"noFallthroughCasesInSwitch": true`
  - **File: `apps/server/tsconfig.json`**
    - Enable `"noImplicitAny": true`
    - Enable `"strict": true`
  - Create shared types package for API interfaces
  - Add proper generic types for React Query hooks
  - Implement proper error type definitions
- [ ] **Add type safety improvements** (if no current errors)
  - **File: `apps/web/src/components/sidebar/hooks.ts`**
    - Fix `'res' is of type 'unknown'` (line 17) - add proper typing
  - Add comprehensive type definitions for all API responses
  - Implement proper error types throughout the application
  - Add type guards for runtime type checking where needed

### Security Vulnerabilities
- [ ] **Update vulnerable dependencies**
  - **High Priority: `devalue` prototype pollution**
    - Update `@tanstack/react-form` to version `>=1.23.3` (contains devalue fix)
    - Run `bun update @tanstack/react-form` in web directory
    - Verify fix with `bun audit`
  - **Moderate: `prismjs` DOM Clobbering**
    - Update `react-syntax-highlighter` to version `>=15.6.6`
    - Run `bun update react-syntax-highlighter` in web directory
    - Consider switching to `shiki` or `rehype-highlight` for better security
  - **Moderate: `esbuild` development server exposure**
    - Update `drizzle-kit` to latest version (contains esbuild update)
    - Run `bun update drizzle-kit` in server directory
    - Configure esbuild with `--allow-overwrite=false` in production
  - **Low: `vite` middleware issues**
    - Update `vite` to version `>=6.3.6`
    - Update `@tailwindcss/vite` to latest
    - Configure Vite with proper CSP headers
- [ ] **Run security audit regularly**
  - **File: `package.json`** (root)
    - Add `"audit": "bun audit"` script
    - Add `"audit:fix": "bun audit --fix"` script
  - **File: `.github/workflows/security-audit.yml`** (new)
    - Create GitHub Actions workflow for weekly security audits
    - Set up automated PRs for security updates using Dependabot
    - Configure vulnerability alerts
  - Implement dependency update policy:
    - Critical/high severity: Update within 24 hours
    - Medium severity: Update within 1 week
    - Low severity: Update within 1 month

### Dependencies & Package Management
- [ ] **Update outdated root dependencies**
  - **File: `package.json`** (root)
    - Update `@biomejs/biome`: `2.1.2` → `2.2.5`
    - Update `@types/bun`: `1.2.20` → `1.2.23`
    - Update `bun-types`: `1.2.20` → `1.2.23`
    - Update `@types/node`: `24.3.0` → `24.7.0`
    - Update `turbo`: `2.5.6` → `2.5.8`
    - Update `ultracite`: `5.1.1` → `5.6.1`
  - Run `bun update` in root directory
  - Test all scripts after updates
- [ ] **Update server dependencies**
  - **File: `apps/server/package.json`**
    - Update `@emnapi/core`: `1.4.5` → `1.5.0`
    - Update `@emnapi/wasi-threads`: check for updates
    - Update `drizzle-orm`: check for updates
    - Update `drizzle-zod`: check for updates
    - Update `hono`: check for updates
    - Update `ollama-ai-provider-v2`: check for updates
    - Update `openai`: check for updates
  - Run `bun update` in `apps/server/` directory
  - Test server build and functionality
- [ ] **Update web dependencies**
  - **File: `apps/web/package.json`**
    - Update `react`: `19.1.1` → `19.2.0`
    - Update `react-dom`: `19.1.1` → `19.2.0`
    - Update `@tanstack/react-query`: `5.85.5` → `5.90.2`
    - Update `@tanstack/react-router`: `1.131.27` → `1.132.47`
    - Update `@tanstack/react-form`: `1.19.2` → `1.23.6`
    - Update `jotai`: `2.13.1` → `2.15.0`
    - Update `lucide-react`: `0.541.0` → `0.545.0`
    - Update `ollama`: `0.5.17` → `0.5.18`
    - Update `@vitejs/plugin-react`: `4.7.0` → `5.0.4` (breaking change - test carefully)
    - Update `vite`: `6.3.5` → `7.1.9` (breaking change - test carefully)
    - Update all `@radix-ui/*` packages to latest
    - Update `@types/node`: `22.17.2` → `24.7.0`
    - Update `@types/react*` packages to match React version
  - Run `bun update` in `apps/web/` directory
  - Test build process and all routes
  - Update Vite config if needed for version 5.x

## 🔧 Code Quality Issues (Medium Priority)

### Error Handling
- [ ] **Replace bare catch blocks with proper error handling**
  - **File: `apps/server/src/procedures/threads.ts`**
    - Replace `catch { return [] as const; }` (line 29) with proper error logging
    - Add specific error types for database connection issues
    - Return appropriate HTTP status codes
  - **File: `apps/server/src/database/migrate.ts`**
    - Replace bare `catch { return false; }` (line 84) with specific error handling
    - Log migration failures with context
  - **File: `apps/web/src/hooks/use-image-generation.ts`**
    - Add proper error typing for all catch blocks (lines 57, 73, 87)
    - Implement user-friendly error messages
  - Add error logging middleware to Hono app
  - Implement consistent error response format across all endpoints
- [ ] **Implement structured error handling**
  - **File: `apps/server/src/lib/errors.ts`** (new)
    - Create custom error classes:
      ```typescript
      export class DatabaseError extends Error {
        constructor(message: string, public code: string) {
          super(message);
          this.name = 'DatabaseError';
        }
      }
      export class ValidationError extends Error {
        constructor(message: string, public field: string) {
          super(message);
          this.name = 'ValidationError';
        }
      }
      export class ExternalServiceError extends Error {
        constructor(message: string, public service: string) {
          super(message);
          this.name = 'ExternalServiceError';
        }
      }
      ```
  - **File: `apps/server/src/middleware/error-handler.ts`** (new)
    - Create Hono error handling middleware
    - Map custom errors to appropriate HTTP status codes
    - Add request ID tracking for error correlation
  - **File: `apps/web/src/components/error-boundary.tsx`** (new)
    - Create React error boundary component
    - Implement error reporting to logging service
    - Show user-friendly error messages
  - Implement graceful degradation:
    - Show cached data when API fails
    - Fallback UI for failed components
    - Offline mode capabilities

### API Design & Validation
- [ ] **Strengthen input validation**
  - **Expand Zod schemas in procedures:**
    - **File: `apps/server/src/procedures/threads.ts`**
      - Add validation for thread titles (max length, allowed characters)
      - Add rate limiting for thread creation
    - **File: `apps/server/src/procedures/messages.ts`**
      - Validate message content length and format
      - Add spam detection for message content
    - **File: `apps/server/src/procedures/images.ts`**
      - Validate prompt length and content
      - Add image generation parameter validation
  - **File upload validation:**
    - **File: `apps/server/src/routes/images.ts`**
      - Add file size limits (max 10MB for images)
      - Validate file types (PNG, JPG, WebP only)
      - Implement virus scanning (optional)
      - Add upload rate limiting per user
  - **Rate limiting implementation:**
    - **File: `apps/server/src/middleware/rate-limit.ts`** (new)
      - Implement sliding window rate limiting
      - Different limits for different endpoints
      - Use Redis/memory store for rate limit data
  - **Request sanitization:**
    - **File: `apps/server/src/middleware/sanitization.ts`** (new)
      - Sanitize string inputs to prevent XSS
      - Trim whitespace from all inputs
      - Normalize Unicode characters
- [ ] **Standardize API responses**
  - **File: `apps/server/src/lib/response.ts`** (new)
    - Create standardized response format:
      ```typescript
      interface ApiResponse<T = any> {
        success: boolean;
        data?: T;
        error?: {
          code: string;
          message: string;
          details?: any;
        };
        meta?: {
          pagination?: {
            page: number;
            limit: number;
            total: number;
          };
          requestId: string;
        };
      }
      ```
  - **HTTP status codes mapping:**
    - 200: Success
    - 201: Created
    - 400: Bad Request (validation errors)
    - 401: Unauthorized
    - 403: Forbidden
    - 404: Not Found
    - 429: Too Many Requests (rate limited)
    - 500: Internal Server Error
  - **Pagination implementation:**
    - Add cursor-based pagination for messages
    - Add offset-based pagination for lists
    - Include pagination metadata in responses
  - **API versioning strategy:**
    - Use URL path versioning: `/api/v1/threads`
    - Implement version negotiation
    - Deprecation headers for old versions
    - Maintain backward compatibility

### Database & Data Layer
- [ ] **Optimize database schema**
  - **File: `apps/server/src/database/schema/index.ts`**
    - Add indexes for frequently queried columns:
      ```sql
      -- Add to threads table
      CREATE INDEX idx_threads_is_archived ON threads(isArchived);
      CREATE INDEX idx_threads_last_message_at ON threads(lastMessageAt);

      -- Add to messages table
      CREATE INDEX idx_messages_thread_id ON messages(threadId);
      CREATE INDEX idx_messages_created_at ON messages(createdAt);
      CREATE INDEX idx_messages_status ON messages(status);

      -- Add to generated_images table
      CREATE INDEX idx_images_created_at ON generated_images(createdAt);
      ```
    - Add foreign key constraints (currently missing)
    - Add CHECK constraints for data validation
    - Add partial indexes for better performance
  - Implement database connection pooling with `better-sqlite3` options
  - Add database WAL mode for better concurrency
- [ ] **Improve migration system**
  - **File: `apps/server/src/database/migrate.ts`**
    - Simplify the complex fallback logic in `runMigrations()`
    - Fix SQL injection risks in `checkIfMigrated()` function:
      ```typescript
      // Replace string interpolation with parameterized queries
      const tableExists = sqlite
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
        .get(tableName);
      ```
    - Add migration rollback capabilities:
      - Create down migration files
      - Add `migrate:down` script
    - Implement database seeding:
      - **File: `apps/server/src/database/seed.ts`** (new)
      - Add sample threads and messages for development
      - Add seed script to package.json
  - Add migration testing to ensure rollbacks work correctly

## ⚡ Performance Optimizations (Medium Priority)

### Frontend Performance
- [ ] **Implement React optimizations**
  - **Component memoization:**
    - **File: `apps/web/src/components/chat/message.tsx`**
      - Already uses `memo()`, verify it's effective
    - **File: `apps/web/src/components/sidebar/chat-threads-list.tsx`**
      - Add `React.memo` to thread list items
      - Memoize thread data transformations
    - **File: `apps/web/src/components/ai-elements/conversation.tsx`**
      - Memoize message rendering
  - **Hook optimizations:**
    - **File: `apps/web/src/components/chat/chat-input.tsx`**
      - Memoize `modelItems` calculation (line 111-131)
      - Use `useCallback` for event handlers
    - **File: `apps/web/src/hooks/use-chat-thread.ts`**
      - Add dependency array optimization
  - **Virtual scrolling:**
    - **File: `apps/web/src/components/sidebar/`**
      - Implement virtual scrolling for long thread lists
      - Use `react-window` or `react-virtualized`
  - **Route lazy loading:**
    - **File: `apps/web/src/routes/`**
      - Convert route imports to dynamic imports
      - Add loading components for route transitions
- [ ] **Optimize bundle size**
  - **Code splitting strategy:**
    - **File: `apps/web/src/main.tsx`**
      - Implement route-based code splitting
      - Split vendor chunks from app code
    - **File: `apps/web/vite.config.ts`**
      - Configure manual chunks:
        ```typescript
        build: {
          rollupOptions: {
            output: {
              manualChunks: {
                'react-vendor': ['react', 'react-dom'],
                'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
                'router-vendor': ['@tanstack/react-router'],
              }
            }
          }
        }
        ```
  - **Bundle analysis:**
    - Add `webpack-bundle-analyzer` or `vite-bundle-analyzer`
    - Set up bundle size monitoring in CI
    - Track bundle size trends
  - **Dependency optimization:**
    - Remove unused dependencies with `bun remove`
    - Replace heavy libraries with lighter alternatives
    - Use ESM imports for better tree shaking
- [ ] **Improve loading states**
  - **Skeleton loaders:**
    - **File: `apps/web/src/components/ui/skeleton.tsx`** (enhance existing)
      - Create message skeleton component
      - Create thread list skeleton
      - Create image grid skeleton
  - **Optimistic updates:**
    - **File: `apps/web/src/hooks/use-chat-thread.ts`**
      - Implement optimistic message updates
      - Add rollback on failure
  - **Loading state management:**
    - Use TanStack Query for consistent loading states
    - Add global loading indicator
    - Implement progressive loading for long content

### Backend Performance
- [ ] **Add caching layers**
  - Implement response caching for expensive operations
  - Add Redis/memory caching for frequently accessed data
  - Cache model availability checks
  - Implement CDN for static assets
- [ ] **Optimize I/O operations**
  - Convert synchronous file operations to async
  - Implement streaming for large file uploads/downloads
  - Add connection pooling for external services
  - Optimize database queries with proper indexing



## 🏗️ Architecture & Structure (Low Priority)

### Code Organization
- [ ] **Refactor large components**
  - Break down complex React components into smaller pieces
  - Extract reusable logic into custom hooks
  - Implement proper separation of concerns
  - Add component documentation
- [ ] **Improve file structure**
  - Organize files by feature/domain
  - Implement consistent naming conventions
  - Add barrel exports (index.ts files)
  - Create shared utilities library

### Configuration Management
- [ ] **Enhance configuration system**
  - Add environment-specific configurations
  - Implement configuration validation
  - Add configuration hot-reloading for development
  - Document all configuration options
- [ ] **Security configuration**
  - Implement secrets management
  - Add configuration encryption for sensitive data
  - Implement configuration audit logging

## 🔒 Security Best Practices (Low Priority)

### Input Security
- [ ] **Implement comprehensive input validation**
  - Add server-side validation for all inputs
  - Implement Content Security Policy (CSP)
  - Add XSS protection
  - Validate file uploads thoroughly
- [ ] **Improve CORS configuration**
  - Replace wildcard CORS origin with specific domains
  - Implement CORS preflight handling
  - Add CORS headers for security

### Data Protection
- [ ] **Implement data encryption**
  - Encrypt sensitive data at rest
  - Add HTTPS enforcement
  - Implement secure session management
  - Add data backup encryption
- [ ] **Add security monitoring**
  - Implement audit logging for security events
  - Add intrusion detection
  - Monitor for suspicious activities
  - Implement rate limiting and DDoS protection

## 📊 Monitoring & Observability (Low Priority)

### Logging & Monitoring
- [ ] **Implement structured logging**
  - Add request/response logging
  - Implement error tracking (Sentry, LogRocket)
  - Add performance monitoring
  - Create log aggregation system
- [ ] **Add application metrics**
  - Implement APM (Application Performance Monitoring)
  - Add custom business metrics
  - Monitor database performance
  - Track user engagement metrics

### Documentation
- [ ] **Create comprehensive documentation**
  - Add API documentation (OpenAPI/Swagger)
  - Document component APIs
  - Create deployment guides
  - Add troubleshooting guides
- [ ] **Code documentation**
  - Add JSDoc comments for complex functions
  - Document configuration options
  - Create architecture decision records
  - Add inline code comments for complex logic

## 🧪 Testing & Quality Assurance (Low Priority)

### Test Suite Implementation
- [ ] **Set up testing framework**
  - **Choose testing stack:**
    - Frontend: Vitest + React Testing Library + jsdom
    - Backend: Vitest + Supertest for API testing
    - E2E: Playwright for critical user flows
  - **File: `apps/web/package.json`**
    - Add `vitest`, `@testing-library/react`, `@testing-library/jest-dom`
    - Add test scripts: `"test"`, `"test:watch"`, `"test:coverage"`
  - **File: `apps/server/package.json`**
    - Add `vitest`, `supertest`, `@types/supertest`
    - Add test scripts for API testing
  - **File: `vitest.config.ts`** (new, root level)
    - Configure Vitest for both apps
    - Set up coverage reporting with istanbul
    - Configure test environment and globals
- [ ] **Implement unit tests**
  - **Utility functions** (`apps/web/src/lib/utils.ts`, `apps/server/src/utils/`)
    - Test text direction detection
    - Test ID generation functions
    - Test LLM JSON parsing
    - Test text extraction utilities
  - **React components** (priority order)
    - Test `Message` component rendering
    - Test `ChatInput` form interactions
    - Test `PromptInput` component states
    - Test sidebar components (lists, navigation)
  - **Server procedures** (`apps/server/src/procedures/`)
    - Test thread CRUD operations
    - Test message operations
    - Test model listing procedures
    - Test image generation procedures
  - **Custom hooks** (`apps/web/src/hooks/`)
    - Test `useChatThread` hydration logic
    - Test `useImageGeneration` state management
    - Test `useTranscription` error handling
- [ ] **Implement integration tests**
  - **API endpoints testing**
    - Test `/rpc/*` endpoints with real database
    - Test `/api/chat` streaming responses
    - Test `/api/images` file upload/download
    - Test error responses and validation
  - **Database operations**
    - Test migrations with real SQLite database
    - Test concurrent operations
    - Test foreign key constraints
    - Test data integrity
  - **External service integrations**
    - Mock Ollama API calls and test error handling
    - Mock LMStudio API calls and test fallbacks
    - Test Stable Diffusion API integration
    - Test transcription service with audio files
  - **End-to-end tests** (Playwright)
    - Test complete chat conversation flow
    - Test image generation workflow
    - Test file upload and transcription
    - Test error recovery scenarios
- [ ] **Set up CI/CD pipeline**
  - **File: `.github/workflows/ci.yml`** (new)
    - Run tests on every push/PR
    - Run linting and type checking
    - Generate coverage reports
    - Upload coverage to Codecov
  - **File: `.github/workflows/e2e.yml`** (new)
    - Run E2E tests on deployment
    - Test against staging environment
    - Performance regression testing
  - **Code quality checks**
    - Biome linting on all files
    - TypeScript strict checking
    - Bundle size monitoring
    - Security vulnerability scanning

## 📋 Implementation Priority Matrix

### Immediate (Week 1-2)
- Verify and fix any remaining TypeScript errors (if any exist)
- Update security vulnerabilities
- Implement proper error handling
- Add basic input validation

### Short-term (Month 1)
- Update all dependencies
- Optimize frontend performance
- Improve database design
- Implement basic error handling and input validation

### Medium-term (Month 2-3)
- Add monitoring and logging
- Implement security best practices
- Refactor architecture
- Add comprehensive documentation

### Long-term (Month 3+)
- Implement comprehensive testing suite
- Advanced performance optimizations
- Enterprise features (multi-tenancy, etc.)
- Advanced security features
- Scalability improvements

## ✅ Success Metrics

- [ ] **Code Quality**: ✅ 0 TypeScript errors (achieved), 100% lint compliance
- [ ] **Security**: 0 high-severity vulnerabilities, regular security audits
- [ ] **Performance**: <3s initial page load, <100ms API response times
- [ ] **Testing**: >80% code coverage, all critical paths tested (Long-term goal)
- [ ] **Reliability**: <0.1% error rate, 99.9% uptime
- [ ] **Maintainability**: Clear documentation, modular architecture

---

*Last updated: October 2025*
*Total actionable items: 120+*
*Note: TypeScript errors resolved - reduced from 50+ specific error fixes*