# DRY & KISS Refactoring Plan - Dastyar AI
**Comprehensive Code Quality Improvement Initiative**

## Executive Summary

**Goal:** Apply DRY (Don't Repeat Yourself) and KISS (Keep It Simple, Stupid) principles to reduce code duplication and complexity, while eliminating AI-generated code artifacts

**Target Impact:** 50-55% code reduction (~4,500 lines saved including AI slop removal)

**Scope:** Full refactoring across all layers (repository, components, procedures, hooks) + AI slop cleanup

**Risk:** Aggressive - Major changes with comprehensive regression testing

**Timeline:** 6 weeks (no specific deadline)

---

## Phase 1: Foundation - Repository Layer & CRUD Consolidation
**Priority:** HIGHEST | **Files:** 7 repository files | **Impact:** 1,200+ lines reduced

### 1.1 Create BaseRepository Pattern
**New File:** `/apps/server/src/repositories/base.ts`

Create a generic `BaseRepository<T>` class with:
- Standardized CRUD operations (create, get, list, update, delete)
- Centralized error handling with `withErrorHandling()`
- User validation
- Logging middleware

### 1.2 Refactor Repository Files
**Files to Refactor:**
- `threads.ts` (270 lines → 80 lines)
- `translations.ts` (100 lines → 40 lines)
- `summaries.ts` (71 lines → 30 lines)
- `messages.ts` (74 lines → 35 lines)
- `images.ts` (41 lines → 25 lines)
- `image-threads.ts` (33 lines → 20 lines)
- `llm-models.ts` (60 lines → 30 lines)

**Pattern:** All repositories inherit from BaseRepository, eliminating 7 duplicated try-catch blocks per file

### Testing
```bash
bun run test:api
bun run check-types
```

---

## Phase 2: Sidebar Components Consolidation
**Priority:** HIGH | **Files:** 5 components | **Impact:** 600+ lines reduced

### 2.1 Create GenericList Component
**New File:** `/apps/web/src/components/sidebar/generic-list.tsx`

A reusable component that eliminates 80% duplicate code across:
- `translations-list.tsx` (62 lines → 15 lines)
- `summaries-list.tsx` (58 lines → 15 lines)
- `chat-threads-list.tsx` (111 lines → 20 lines)
- `images-sidebar.tsx` (77 lines → 20 lines)
- `code-runs-list.tsx` (90 lines → 20 lines)

### 2.2 Implementation Strategy
The GenericList component accepts:
- Query options (React Query)
- Entity type and getters (getId, getTitle)
- Route template and path prefix
- Empty state component
- Mutation handlers

---

## Phase 3: Large Component Simplification (KISS)
**Priority:** HIGH | **Files:** 4 large components | **Impact:** 1,000+ lines reduced

> [!NOTE]
> Line counts verified against actual codebase on 2025-12-22.

### 3.1 Split translation/index.tsx (482 lines)
**New Files:**
```
/apps/web/src/routes/translation/components/
  - translation-form.tsx
  - translation-results.tsx
  - translation-pdf-handler.tsx
  - translation-state.ts
  - translation-hooks.ts
```

### 3.2 Split code/index.tsx (547 lines)
**New Files:**
```
/apps/web/src/routes/code/components/
  - code-mode-selector.tsx
  - code-input-area.tsx
  - code-output-display.tsx
  - code-language-selector.tsx
/apps/web/src/routes/code/hooks/
  - use-code-processing.ts
```

### 3.3 Split users-table.tsx (354 lines)
**New Files:**
```
/apps/web/src/components/admin/users-table/
  - header.tsx
  - row.tsx
  - actions.tsx
  - hooks.ts
  - table.tsx
```

### 3.4 Split settings-panel.tsx (432 lines)
**New Files:**
```
/apps/web/src/components/admin/settings/
  - general-settings.tsx
  - security-settings.tsx
  - file-management-settings.tsx
  - ai-models-settings.tsx
  - rate-limit-settings.tsx
  - settings-form.tsx
```

---

## Phase 4: Procedure Handlers Consolidation
**Priority:** MEDIUM | **Files:** 8 procedure files | **Impact:** 600+ lines reduced

### 4.1 Extend Existing Procedure Base Handler
**Existing File:** `/apps/server/src/procedures/base.ts` (74 lines)

> [!IMPORTANT]
> `base.ts` already exists with `protectedProcedure` and `adminProcedure`. Extend it with `createCRUDHandlers()` factory.

Add to existing `base.ts`:
- `createCRUDHandlers()` factory for standardized CRUD
- Reusable error handling utilities
- Common input validation schemas

### 4.2 Refactor Procedure Files
**Files to Refactor (actual line counts):**
- `translation.ts` (404 lines → 150 lines)
- `summarize.ts` (115 lines → 50 lines)
- `image-threads.ts` (47 lines → 25 lines)
- `code.ts` (165 lines → 60 lines)
- `documents.ts` (125 lines → 50 lines)
- `llm-models.ts` (72 lines → 35 lines)
- `transcribe.ts` (105 lines → 45 lines)
- `threads.ts` (55 lines → 30 lines)

---

## Phase 5: Hooks Consolidation
**Priority:** MEDIUM | **Files:** 6 hook files | **Impact:** 400+ lines reduced

### 5.1 Create Generic Mutation Hooks
**New File:** `/apps/web/src/hooks/use-generic-mutations.ts`

Reusable hooks for:
- `useGenericMutations(entity)` - CRUD operations
- `useEntityQuery(entity, id)` - Single entity fetching
- `useEntityList(entity)` - List querying

### 5.2 Refactor Hook Files
**Files to Refactor:**
- `use-chat-threads.ts`
- `use-translations.ts`
- `use-summaries.ts`
- `use-image-threads.ts`
- `use-code-runs.ts`
- `use-image-generation.ts`

---

## Phase 6: Error Handling & Utilities
**Priority:** MEDIUM | **Files:** Utility files | **Impact:** 300+ lines reduced

### 6.1 Create Error Handler Utilities
**New File:** `/apps/server/src/utils/error-handler.ts`
- `AppError` class
- `asyncHandler` wrapper
- `withValidation` helper

### 6.2 Create Query Builder Utilities
**New File:** `/apps/server/src/utils/query-builder.ts`
- Standardized query patterns
- Pagination helpers
- Filtering utilities

### 6.3 Create UI Utility Components
**New File:** `/apps/web/src/components/ui/generic/`
- `PaddingWrapper` - Eliminates 40+ `className="p-4"` instances
- `CenteredContainer` - Eliminates 30+ flex centering patterns
- `GridLayout` - Eliminates 20+ grid patterns

---

## Phase 7: AI Slop Detection & Removal
**Priority:** HIGH | **Scope:** Entire codebase | **Impact:** Code quality + 200-400 lines reduced

> [!IMPORTANT]
> AI-generated code often introduces patterns that don't match human coding style. This phase cleans up inconsistencies to maintain a unified codebase.

### Codebase Analysis Findings (2025-12-22)

| Pattern | Count | Location | Action |
|---------|-------|----------|--------|
| `as any` | 16 | `routeTree.gen.ts` only | ✅ Exclude (auto-generated) |
| `: any` | 0 | None | ✅ Clean |
| `@ts-ignore` | 0 | None | ✅ Clean |
| `@ts-expect-error` | 3 | `pdf.ts`, test files | ✅ Documented & justified |

**Key Finding:** The codebase is relatively clean of AI slop type escapes. Focus cleanup efforts on:
1. **Redundant try/catch in repositories** - Each function has try/catch even for simple operations
2. **Verbose JSDoc comments** - Many obvious functions have full JSDoc blocks
3. **Repetitive userId validation** - Each repo method validates userId separately

### 7.1 Excessive & Redundant Comments
**Detection Criteria:**
- Comments explaining obvious code (e.g., `// increment counter` above `counter++`)
- Verbose JSDoc blocks for simple private functions
- Comments that restate what the code already does
- Inconsistent comment style within the same file
- "This function..." or "This method..." comments that add no value

**Example Violations:**
```typescript
// BAD - AI slop
// This function handles the click event
function handleClick() {
  // Get the button element
  const button = document.getElementById('button');
  // Add event listener for click
  button.addEventListener('click', () => {
    // Log the click to console
    console.log('clicked');
  });
}

// GOOD - Clean code
function handleClick() {
  const button = document.getElementById('button');
  button.addEventListener('click', () => console.log('clicked'));
}
```

**Files to Audit:**
- All repository files (`/apps/server/src/repositories/`)
- All procedure files (`/apps/server/src/procedures/`)
- All component files (`/apps/web/src/components/`)
- All route files (`/apps/web/src/routes/`)

---

### 7.2 Unnecessary Defensive Patterns
**Detection Criteria:**
- Try/catch blocks around operations that can't throw
- Null checks on values already validated upstream
- Type guards on strongly-typed function parameters
- Error handling that catches and re-throws without modification
- Defensive checks in internal/trusted code paths

**Example Violations:**
```typescript
// BAD - Excessive defensive coding
async function getUserById(id: string): Promise<User> {
  try {
    if (!id) {
      throw new Error('ID is required');
    }
    if (typeof id !== 'string') {
      throw new Error('ID must be a string');
    }
    const user = await db.user.findUnique({ where: { id } });
    if (!user) {
      return null;
    }
    return user;
  } catch (error) {
    console.error('Error in getUserById:', error);
    throw error;
  }
}

// GOOD - Trust the type system & validated inputs
async function getUserById(id: string): Promise<User | null> {
  return db.user.findUnique({ where: { id } });
}
```

**Files to Audit:**
- Repository layer (all CRUD operations)
- Procedure handlers (already validated by middleware)
- Internal utility functions (not exposed to external input)

---

### 7.3 Type Escape Hatches (`any` and `as` Casts)
**Detection Criteria:**
- `as any` used to bypass type errors
- `as unknown as T` escape patterns
- Function parameters typed as `any`
- Return types of `any`
- Inline `// @ts-ignore` or `// @ts-expect-error` without explanation

**Commands to Find:**
```bash
# Find all 'any' type usages
grep -rn ": any" apps/ --include="*.ts" --include="*.tsx"
grep -rn "as any" apps/ --include="*.ts" --include="*.tsx"

# Find type assertions
grep -rn "as unknown as" apps/ --include="*.ts" --include="*.tsx"

# Find ts-ignore comments
grep -rn "@ts-ignore\|@ts-expect-error" apps/ --include="*.ts" --include="*.tsx"
```

**Resolution Strategy:**
1. Add proper type definitions where missing
2. Create utility types for complex patterns
3. Use generics instead of `any`
4. Document legitimate `any` usage with explanation comments

---

### 7.4 Style Inconsistencies
**Detection Criteria:**
- Mixed quote styles (`'` vs `"`) within same file
- Inconsistent arrow function patterns (`() => {}` vs `function()`)
- Inconsistent error handling patterns (some with toast, some with console)
- Mixed async patterns (`.then()` vs `async/await`)
- Inconsistent import ordering
- Inconsistent component structure (hooks order, return patterns)

**Files to Audit (Priority):**
1. Files touched by AI in recent commits
2. Files with mixed patterns identified by ESLint
3. Large files that have been incrementally modified

**Automated Detection:**
```bash
# Run ESLint strict mode
bun run lint --report-unused-disable-directives --max-warnings 0

# Check for formatting consistency
bunx prettier --check apps/
```

---

### 7.5 AI Slop Cleanup Checklist
**Per-File Review Process:**
- [ ] Remove comments stating the obvious
- [ ] Remove unnecessary try/catch around non-throwing code
- [ ] Remove null checks on pre-validated data
- [ ] Replace `any` with proper types
- [ ] Normalize async patterns (prefer async/await)
- [ ] Align style with surrounding code (quotes, formatting)
- [ ] Verify error messages are helpful, not generic

**Codebase-Wide Tasks:**
- [ ] Create ESLint rules for common AI slop patterns
- [ ] Update `.eslintrc` with stricter comment rules
- [ ] Add Prettier configuration for consistent formatting
- [ ] Document codebase style conventions in `CONTRIBUTING.md`

---

## Implementation Order

### Week 1: Repository Layer
1. Create `base.ts` with BaseRepository
2. Refactor `threads.ts` (largest, most complex)
3. Refactor `translations.ts`, `summaries.ts`, `messages.ts`
4. Test all repository operations

### Week 2: Sidebar Components
1. Create `generic-list.tsx`
2. Refactor `translations-list.tsx`, `summaries-list.tsx`
3. Refactor remaining sidebar components
4. Visual regression testing

### Week 3: Procedure Handlers
1. Create `base.ts` with CRUD handlers
2. Refactor `translation.ts` (most complex)
3. Refactor remaining procedure files
4. Integration testing

### Week 4: Large Components
1. Split `translation/index.tsx`
2. Split `code/index.tsx`
3. Split `users-table.tsx`

### Week 5: Finishing & Cleanup
1. Split `settings-panel.tsx`
2. Refactor hooks
3. Create utility functions
4. Intermediate testing and documentation

### Week 6: AI Slop Detection & Removal
1. Run automated detection scripts (grep for `any`, excessive comments)
2. Audit repository and procedure layers for defensive over-engineering
3. Review and clean components for style inconsistencies
4. Update ESLint/Prettier configs for ongoing prevention
5. Final testing and documentation

---

## Critical Files to Implement

### Phase 1 (Repository Layer)
1. `/apps/server/src/repositories/base.ts` - **Foundation**
2. `/apps/server/src/repositories/threads.ts` - **Primary target (270 lines)**
3. `/apps/server/src/repositories/translations.ts` - **CRUD example**
4. `/apps/server/src/repositories/summaries.ts` - **Simple repo**

### Phase 2 (Sidebar Components)
5. `/apps/web/src/components/sidebar/generic-list.tsx` - **Core component**
6. `/apps/web/src/components/sidebar/translations-list.tsx` - **Refactor example**
7. `/apps/web/src/components/sidebar/summaries-list.tsx` - **DRY target**

### Phase 3 (Large Components)
8. `/apps/web/src/routes/translation/components/translation-hooks.ts` - **State management**
9. `/apps/web/src/routes/translation/components/translation-form.tsx` - **Form split**
10. `/apps/web/src/routes/code/hooks/use-code-processing.ts` - **Logic extraction**
11. `/apps/web/src/components/admin/users-table/row.tsx` - **Table row component**

### Phase 4 (Procedure Handlers)
12. `/apps/server/src/procedures/base.ts` - **Handler factory**
13. `/apps/server/src/procedures/translation.ts` - **Refactor from 403 lines**

### Phase 5-6 (Hooks & Utilities)
14. `/apps/web/src/hooks/use-generic-mutations.ts` - **Mutation consolidation**
15. `/apps/server/src/utils/error-handler.ts` - **Error standardization**

### Phase 7 (AI Slop Removal)
16. **Codebase-wide audit** - Scan for slop patterns using grep commands
17. **ESLint custom rules** - Prevent future AI slop introduction
18. **Style guide** - Document conventions in `CONTRIBUTING.md`

---

## Testing Strategy

### Backup Before Starting
```bash
git branch backup-before-refactor
```

### Unit Tests
```bash
# Test BaseRepository
bun test repositories/base.test.ts

# Test GenericList
bun test components/sidebar/generic-list.test.tsx

# Test refactored components
bun test routes/translation/
bun test routes/code/
bun test components/admin/users-table/
```

### Integration Tests
```bash
# Full workflow tests
bun run test:api -- translation
bun run test:api -- code
bun run test:api -- admin
```

### Visual Regression
```bash
cd apps/web
npm run test:visual
# Compare before/after screenshots
```

---

## Rollback Plan

### Full Rollback
```bash
git reset --hard backup-before-refactor
```

### Partial Rollback (per phase)
```bash
git reset --hard HEAD~N  # N = commits in phase
```

### File-specific Rollback
```bash
git checkout backup-phase1 -- apps/server/src/repositories/threads.ts
```

---

## Success Metrics

### Code Reduction Targets
- ✅ Repository layer: **70% reduction** (1,200+ lines)
- ✅ Sidebar components: **75% reduction** (600+ lines)
- ✅ Procedure handlers: **60% reduction** (800+ lines)
- ✅ Large components: **60% reduction** (1,000+ lines)
- ✅ AI slop removal: **200-400 lines** (comments, defensive code, type escapes)
- ✅ **Total: 50-55% overall reduction (4,500+ lines)**

### Quality Metrics
- ✅ Reduce cognitive complexity to <15 for all functions
- ✅ Improve test coverage to >80%
- ✅ Zero DRY violations
- ✅ Zero KISS violations
- ✅ All functions <100 lines
- ✅ All components <200 lines

### AI Slop Metrics
- ✅ Zero `as any` type escapes (without documented justification)
- ✅ Zero redundant try/catch around non-throwing operations
- ✅ Zero "obvious" comments (comments that repeat code)
- ✅ Consistent style across files (quotes, async patterns, imports)
- ✅ No unexplained `@ts-ignore` or `@ts-expect-error`

### Performance
- ✅ No degradation in response times
- ✅ Bundle size reduction (if applicable)
- ✅ Query performance maintained or improved

---

## Risk Mitigation

### Strategy 1: Incremental Implementation
- Implement one repository at a time
- Test immediately after each change
- Commit after successful test

### Strategy 2: Maintain Backward Compatibility
- Keep existing exports in repository files
- Gradually deprecate old patterns
- Update imports only after full refactoring

### Strategy 3: Comprehensive Testing
- Unit tests for new abstractions
- Integration tests for workflows
- Visual regression for UI components
- Performance benchmarks

### Strategy 4: Feature Flags (if needed)
- Keep old code paths available
- Toggle between old/new implementations
- Gradual rollout

---

## Next Steps

The plan is ready for implementation. Each phase:
- Is self-contained with clear boundaries
- Can be rolled back independently
- Has specific success criteria
- Includes comprehensive testing

**Ready to start with Phase 1: Repository Layer consolidation.**
