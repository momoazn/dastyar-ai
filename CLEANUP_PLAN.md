# Dastyar-AI Project Cleanup Implementation Plan

## Executive Summary

This plan addresses security vulnerabilities, code quality issues, dependency management, and project organization across the dastyar-ai monorepo. The cleanup is structured in 6 phases, prioritizing security first, then dependencies, files, code quality, documentation, and verification.

**Total Estimated Time:** 4-6 hours
**Risk Level:** Low-Medium (with proper git safeguards)

---

## Phase 1: Security & Git History Cleanup (CRITICAL)

**Priority:** HIGHEST | **Risk:** Medium | **Time:** 30-45 minutes

### Objective

Remove sensitive files from repository and prevent future commits of secrets.

### Issues Addressed

- SSL certificates in root (192.168.70.128+2.pem, 192.168.70.128+2-key.pem)
- config.json tracked in git (contains potential secrets)
- Missing .gitignore entries for sensitive files

### Files to Modify/Remove

#### 1. Update .gitignore

**File:** `/Users/mohamadhosein/Workspace/side/dastyar-ai/.gitignore`

**Action:** Add after line 181 (after existing `*.pem`):

```gitignore
# Configuration files with secrets
config.json
/config.json
/server.log

# Turbo logs (override wildcard)
.turbo/**/*.log
```

**Rationale:**

- `*.pem` already exists at line 181
- `*.db` already exists at line 161
- `*.log` exists at line 38 but needs specific exclusion for root level
- config.json needs explicit root-level exclusion

#### 2. Remove Files from Git History

**Commands:**

```bash
cd /Users/mohamadhosein/Workspace/side/dastyar-ai

# Create backup branch first
git branch backup-before-cleanup

# Remove config.json from git tracking
git rm --cached config.json

# Stage .gitignore changes
git add .gitignore

# Commit changes
git commit -m "security: remove sensitive files from tracking and update .gitignore

- Remove config.json from git tracking (contains secrets)
- Add explicit .gitignore entries for root-level logs
- SSL certificates already ignored by existing *.pem rule

BREAKING: config.json must now be created manually or via config:generate"

# Verify removal
git ls-files | grep -E 'config.json|\.pem|\.db|server\.log'
```

#### 3. Update Documentation

**File:** `/Users/mohamadhosein/Workspace/side/dastyar-ai/README.md`

**Action:** Add to "Getting Started" section:

````markdown
### Configuration

The application requires a `config.json` file or `.env` file for configuration.

**Option 1: Generate config.json (Recommended)**

```bash
bun run config:generate
```
````

**Option 2: Use .env file**
Copy `.env.example` to `.env` and configure your settings.

**⚠️ IMPORTANT:** Never commit `config.json`, `.env`, or SSL certificates to git.

````

### Verification Steps
```bash
# 1. Verify files removed from tracking
git status | grep -E 'config.json'
# Should show: deleted: config.json

# 2. Verify .gitignore works
echo "test" > config.json
git status | grep config.json
# Should NOT appear in untracked files

# 3. Clean up test
rm config.json

# 4. Verify backup branch exists
git branch | grep backup-before-cleanup
````

### Rollback Plan

```bash
# If something goes wrong
git reset --hard HEAD~1
git checkout backup-before-cleanup
```

### Automation Potential

- **Manual git operations required** (cannot automate git rm safely)
- .gitignore update could be automated with sed/awk

---

## Phase 2: Dependencies Cleanup

**Priority:** HIGH | **Risk:** Low | **Time:** 20-30 minutes

### Objective

Remove unused dependencies, fix version inconsistencies, and correct dependency classifications.

### Issues Addressed

- Unused dependencies: tokenlens, radix-ui, ollama (web), prettier (root)
- jszip in wrong location (root instead of whisper devDependencies)
- Version mismatches: @ai-sdk, ai, @orpc packages
- Non-existent packages/\* workspace

### Files to Modify

#### 1. Root package.json

**File:** `/Users/mohamadhosein/Workspace/side/dastyar-ai/package.json`

**Changes:**

```json
{
  "devDependencies": {
    "@biomejs/biome": "2.2.5",
    "@types/bun": "^1.3.1",
    "@types/node": "^24.9.2",
    "bun-types": "^1.3.1",
    "turbo": "^2.6.0",
    "ultracite": "5.6.2"
    // REMOVE: "jszip": "^3.10.1"
  },
  "workspaces": [
    "apps/*"
    // REMOVE: "packages/*"
  ]
}
```

**Rationale:**

- jszip only used in whisper build script, should be local to whisper
- packages/\* directory doesn't exist
- Keep root clean for monorepo coordination only

#### 2. Web package.json

**File:** `/Users/mohamadhosein/Workspace/side/dastyar-ai/apps/web/package.json`

**Changes:**

```json
{
  "dependencies": {
    // REMOVE: "tokenlens": "^1.3.1",  // Not used (0 imports found)
    // REMOVE: "radix-ui": "^1.4.3",    // Meta-package, use @radix-ui/* instead
    // REMOVE: "ollama": "^0.6.0",      // Only used in server

    // UPDATE version consistency
    "@ai-sdk/react": "^2.0.76", // Keep at 2.0.76
    "ai": "^5.0.76" // UPDATE from 5.0.76 to match @ai-sdk version
  }
}
```

**Rationale:**

- tokenlens: No imports found in codebase
- radix-ui: Meta-package not needed, already using @radix-ui/\* packages
- ollama: Server-side only, not needed in frontend
- @ai-sdk + ai versions should stay aligned

#### 3. Server package.json

**File:** `/Users/mohamadhosein/Workspace/side/dastyar-ai/apps/server/package.json`

**Changes:**

```json
{
  "dependencies": {
    // UPDATE for version consistency
    "@ai-sdk/openai": "^2.0.76", // UPDATE from ^2.0.67
    "ai": "^5.0.76", // UPDATE from ^5.0.61
    "@orpc/client": "^1.9.4", // UPDATE from ^1.9.3
    "@orpc/server": "^1.9.4" // UPDATE from ^1.9.3
  }
}
```

**Rationale:**

- Align @ai-sdk and ai versions across packages
- Update @orpc to match web package version

#### 4. Whisper package.json (CREATE)

**File:** `/Users/mohamadhosein/Workspace/side/dastyar-ai/apps/whisper/package.json`

**Action:** Check if exists, if not mention in root scripts

**Note:** jszip is only used in `/Users/mohamadhosein/Workspace/side/dastyar-ai/scripts/tasks/build-whisper.ts`
Since this is a root-level script, jszip should stay in root devDependencies OR move to a scripts package.

**Revised Decision:** Keep jszip in root devDependencies (it's used by root-level build scripts)

### Commands

```bash
cd /Users/mohamadhosein/Workspace/side/dastyar-ai

# 1. Update root package.json
bun remove jszip
# Edit workspaces manually

# 2. Update web dependencies
cd apps/web
bun remove tokenlens radix-ui ollama
# Note: Don't update ai version yet, test first

# 3. Update server dependencies
cd ../server
bun add @ai-sdk/openai@^2.0.76 ai@^5.0.76 @orpc/client@^1.9.4 @orpc/server@^1.9.4

# 4. Return to root and reinstall
cd ../..
bun install

# 5. Verify build still works
bun run check-types
```

### Verification Steps

```bash
# 1. Verify removals
grep -r "tokenlens\|radix-ui" apps/web/src/
# Should return no imports

# 2. Verify versions
cat apps/web/package.json | grep -E "@ai-sdk|\"ai\":"
cat apps/server/package.json | grep -E "@ai-sdk|\"ai\":"
# Should show consistent versions

# 3. Verify build
bun run check-types
# Should pass

# 4. Verify dev server
bun run dev:web &
sleep 5
curl http://localhost:5173
kill %1
```

### Risk Assessment

- **Low Risk:** Unused dependencies removal
- **Medium Risk:** Version updates (test thoroughly)

### Rollback Plan

```bash
git checkout -- package.json apps/*/package.json bun.lock
bun install
```

### Automation Potential

- **Semi-automated:** Use jq or node script to edit package.json
- **Manual verification required:** Test builds

---

## Phase 3: File System Cleanup

**Priority:** MEDIUM | **Risk:** Low | **Time:** 15-20 minutes

### Objective

Remove unnecessary files, reorganize documentation, and clean up empty directories.

### Issues Addressed

- Empty component directories (auth, layout, code)
- Admin panel docs scattered in /docs/
- Proposal documents without clear versioning
- server.log, dev.db in root (runtime files)

### Files to Delete

#### 1. Empty Component Directories

```bash
cd /Users/mohamadhosein/Workspace/side/dastyar-ai/apps/web/src/components

# Verify empty before deletion
ls -la auth/
ls -la layout/
ls -la code/

# If truly empty (no files found)
rmdir auth/ layout/ code/
```

#### 2. Runtime Files in Root

```bash
cd /Users/mohamadhosein/Workspace/side/dastyar-ai

# Remove if they exist (should be git-ignored already)
rm -f server.log dev.db

# Verify
ls -la *.log *.db
```

#### 3. SSL Certificates

```bash
# These should be already ignored by .gitignore *.pem rule
# Just verify they're not tracked
git ls-files | grep .pem
# Should return nothing

# Optionally move to a secure location
mkdir -p ~/.ssl-certs/dastyar-ai
mv *.pem ~/.ssl-certs/dastyar-ai/ 2>/dev/null || true
```

### Documentation Reorganization

#### 1. Create Admin Panel Subdirectory

```bash
cd /Users/mohamadhosein/Workspace/side/dastyar-ai/docs

# Create subdirectory
mkdir -p admin-panel

# Move admin panel docs (7 files)
mv ADMIN_PANEL_*.md admin-panel/

# Create index
cat > admin-panel/README.md << 'DOC'
# Admin Panel Documentation

This directory contains all documentation related to the Dastyar AI admin panel implementation.

## Documentation Index

- [README](ADMIN_PANEL_README.md) - Overview and features
- [Quick Start](ADMIN_PANEL_QUICK_START.md) - Getting started guide
- [Implementation](ADMIN_PANEL_IMPLEMENTATION.md) - Technical implementation details
- [Progress](ADMIN_PANEL_PROGRESS.md) - Development progress tracking
- [Phase 3](ADMIN_PANEL_PHASE3.md) - Phase 3 implementation
- [Summary](ADMIN_PANEL_SUMMARY.md) - Feature summary
- [Index](ADMIN_PANEL_INDEX.md) - Document index

## Quick Links

- Jump to [User Management](ADMIN_PANEL_README.md#user-management)
- Jump to [Model Management](ADMIN_PANEL_README.md#model-management)
- Jump to [System Settings](ADMIN_PANEL_README.md#system-settings)
DOC
```

#### 2. Organize Proposal Documents

```bash
cd /Users/mohamadhosein/Workspace/side/dastyar-ai/docs/proposal

# Create archive subdirectory if not exists
mkdir -p archive

# The main proposal is already moved (3523f7b commit)
# Verify structure
ls -la

# Expected structure:
# - archive/ (older drafts)
# - Chapter*.md (current chapters)
# - FULL_*.md (consolidated versions)
# - PROPOSAL_PLAN.md (planning doc)
```

**Note:** Proposal reorganization already done in commit 3523f7b, verify only

#### 3. Create Missing /specs/ Directory

```bash
cd /Users/mohamadhosein/Workspace/side/dastyar-ai

# Create specs directory (referenced in CLAUDE.md)
mkdir -p specs

# Create README
cat > specs/README.md << 'DOC'
# Technical Specifications

This directory contains technical specifications, API documentation, and architecture decisions.

## Directory Structure

- `/api` - API endpoint specifications
- `/architecture` - Architecture decision records (ADRs)
- `/database` - Database schema and migration docs
- `/integration` - Third-party integration specs

## Contributing

When adding specifications:
1. Use markdown format
2. Include version/date
3. Link to related implementation
4. Update this index
DOC

# Create subdirectories
mkdir -p specs/{api,architecture,database,integration}

# Create placeholder for future improvements tracking
cat > specs/IMPROVEMENTS_TODO.md << 'DOC'
# Improvements TODO

Track technical debt and planned improvements here.

## Testing Coverage Gaps

- [ ] Authentication flows unit tests
- [ ] AI orchestration integration tests
- [ ] Config generation logic tests

## Code Quality

- [ ] Reduce complexity in transcribe.tsx (complexity 21)
- [ ] Add proper error handling in silent catch blocks
- [ ] Replace type assertions with proper type guards

## Documentation

- [ ] API endpoint documentation
- [ ] Database schema documentation
- [ ] Architecture decision records

## Performance

- [ ] Profile LLM response streaming
- [ ] Optimize image generation workflow
- [ ] Cache transcription results
DOC
```

### Verification Steps

```bash
# 1. Verify empty dirs removed
ls apps/web/src/components/ | grep -E 'auth|layout|code'
# Should return nothing

# 2. Verify docs organized
ls docs/admin-panel/ | wc -l
# Should show 8 files (7 moved + 1 new README)

# 3. Verify specs created
ls -la specs/
# Should show README and subdirectories

# 4. Verify no runtime files in root
ls -la *.log *.db *.pem 2>&1
# Should show "No such file or directory"
```

### Git Commands

```bash
cd /Users/mohamadhosein/Workspace/side/dastyar-ai

# Stage documentation changes
git add docs/admin-panel/
git add specs/
git add -u docs/  # Stage deletions

# Commit
git commit -m "refactor(docs): reorganize documentation structure

- Move admin panel docs to docs/admin-panel/
- Create specs/ directory per CLAUDE.md guidelines
- Add specs/IMPROVEMENTS_TODO.md for tracking technical debt
- Remove empty component directories (auth, layout, code)
- Remove runtime files from root (server.log, dev.db)"
```

### Automation Potential

- **Fully automated:** File moves, directory creation
- **Safe for scripting:** All operations are non-destructive

---

## Phase 4: Code Quality Improvements

**Priority:** MEDIUM | **Risk:** Medium | **Time:** 60-90 minutes

### Objective

Fix code quality issues identified by Ultracite/Biome and reduce technical debt.

### Issues Addressed

- Type assertions bypassing type safety
- Silent error suppression in catch blocks
- High complexity functions (complexity 21)
- Missing switch default cases
- Unused function parameters

### Code Fixes by File

#### 1. /apps/web/src/routes/code/$runId.tsx

**Issue:** Type assertion at line 106

```typescript
// BEFORE (line 106)
const parsed = JSON.parse(runData.output as string) as unknown;

// AFTER - Add proper type guard
const parsed = JSON.parse(runData.output as string);
if (typeof parsed !== "object" || parsed === null) {
  return "Invalid output format";
}
```

**Additional Change:** Extract formatOutput to reduce complexity

```typescript
// Create separate formatter functions
const formatGenerateOutput = (parsed: unknown): string => {
  return (parsed as { generatedCode?: string }).generatedCode || "";
};

const formatExplainOutput = (parsed: unknown): string => {
  return (parsed as { explanation?: string }).explanation || "";
};

const formatReviewOutput = (parsed: unknown): string => {
  const r = parsed as { feedback?: string; suggestions?: string[] };
  const suggestions = (r.suggestions ?? []).map((s) => `- ${s}`).join("\n");
  return `${r.feedback ?? ""}${suggestions ? `\n\n${suggestions}` : ""}`;
};

const formatRefactorOutput = (parsed: unknown): string => {
  const r = parsed as { refactoredCode?: string; explanation?: string };
  return `${r.explanation ?? ""}\n\n${r.refactoredCode ?? ""}`;
};

// Then in formatOutput
const formatOutput = (): string => {
  try {
    const parsed = JSON.parse(runData.output as string);
    if (typeof parsed !== "object" || parsed === null) {
      return "Invalid output format";
    }

    switch (mode) {
      case "generate":
        return formatGenerateOutput(parsed);
      case "explain":
        return formatExplainOutput(parsed);
      case "review":
        return formatReviewOutput(parsed);
      case "refactor":
        return formatRefactorOutput(parsed);
      default:
        return "";
    }
  } catch {
    return runData.output || "";
  }
};
```

#### 2. /apps/server/src/routes/chat.ts

**Issue:** Type assertion at line 85

```typescript
// BEFORE (line 85)
const uiMessages = messages as unknown as MyUIMessage[];

// AFTER - Add Zod validation
import { z } from "zod";

const MyUIMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  // ... other fields
});

const MyUIMessageArraySchema = z.array(MyUIMessageSchema);

// In handler
const parseResult = MyUIMessageArraySchema.safeParse(messages);
if (!parseResult.success) {
  return sendError(c, {
    status: 400,
    code: "INVALID_MESSAGE_FORMAT",
    message: "Invalid message format",
  });
}
const uiMessages = parseResult.data;
```

#### 3. /apps/web/src/routes/code/index.tsx

**Issue:** Silent error suppression at lines 134-141

```typescript
// BEFORE
const _handleCopy = () => {
  try {
    navigator.clipboard.writeText(output).catch(() => {
      /* ignore */
    });
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  } catch {
    // noop
  }
};

// AFTER - Proper error handling with user feedback
const handleCopy = () => {
  navigator.clipboard
    .writeText(output)
    .then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    })
    .catch((error) => {
      console.error("Failed to copy to clipboard:", error);
      toast.error("Failed to copy to clipboard");
    });
};
```

**Note:** Requires adding toast notification library or using existing error boundary

#### 4. /apps/web/src/routes/transcribe.tsx

**Issue 1:** Missing switch default case at lines 138-149

```typescript
// BEFORE
let title = "";
switch (mode) {
  case "action-items":
    title = fa.transcribe.smartActions.actionItems;
    break;
  case "meeting-notes":
    title = fa.transcribe.smartActions.meetingNotes;
    break;
  case "concise":
    title = fa.transcribe.smartActions.summarize;
    break;
}

// AFTER
let title = "";
switch (mode) {
  case "action-items":
    title = fa.transcribe.smartActions.actionItems;
    break;
  case "meeting-notes":
    title = fa.transcribe.smartActions.meetingNotes;
    break;
  case "concise":
    title = fa.transcribe.smartActions.summarize;
    break;
  default:
    console.warn(`Unknown smart action mode: ${mode}`);
    title = fa.transcribe.smartActions.summarize; // fallback
    break;
}
```

**Issue 2:** High complexity (21) - needs refactoring

```typescript
// STRATEGY: Extract functions for:
// 1. File validation
// 2. Transcription submission
// 3. Smart action handling
// 4. Result processing

// Example extraction:
const validateAudioFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 25 * 1024 * 1024; // 25MB
  if (file.size > maxSize) {
    return { valid: false, error: "File too large (max 25MB)" };
  }

  const validTypes = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/webm"];
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: "Invalid file type" };
  }

  return { valid: true };
};

// Use in component:
const handleFileSelect = (file: File) => {
  const validation = validateAudioFile(file);
  if (!validation.valid) {
    toast.error(validation.error);
    return;
  }
  setSelectedFile(file);
};
```

**Issue 3:** Unused parameter

- Identify and remove OR prefix with underscore per Biome convention

#### 5. /apps/web/src/routes/translation/components/pdf-result-display.tsx

**Issue:** Unused function parameter

```typescript
// Find unused parameters and either:
// 1. Remove if truly unused
// 2. Prefix with _ if needed for signature matching
// 3. Use in implementation if it should be used

// Example:
// BEFORE
const handleSomething = (param1: string, unusedParam: number) => {
  console.log(param1);
};

// AFTER
const handleSomething = (param1: string, _unusedParam: number) => {
  console.log(param1);
};
```

### Commands

```bash
cd /Users/mohamadhosein/Workspace/side/dastyar-ai

# 1. Run Ultracite check to get baseline
npx ultracite check > /tmp/ultracite-before.txt

# 2. Make code changes (use Edit tool in actual implementation)
# ... edit files as specified above ...

# 3. Run Ultracite fix for auto-fixable issues
npx ultracite fix

# 4. Run check again
npx ultracite check > /tmp/ultracite-after.txt

# 5. Compare results
diff /tmp/ultracite-before.txt /tmp/ultracite-after.txt

# 6. Type check
bun run check-types

# 7. Run tests
bun run test
```

### Verification Steps

```bash
# 1. Verify type safety improvements
grep -n "as unknown" apps/web/src/routes/code/\$runId.tsx
grep -n "as unknown" apps/server/src/routes/chat.ts
# Should show reduced or zero occurrences

# 2. Verify error handling
grep -n "/\* ignore \*/" apps/web/src/routes/code/index.tsx
grep -n "// noop" apps/web/src/routes/code/index.tsx
# Should show zero occurrences

# 3. Verify switch statements
grep -A 15 "switch (mode)" apps/web/src/routes/transcribe.tsx | grep "default:"
# Should show default cases

# 4. Run Ultracite
npx ultracite check
# Should show improvement in issue count

# 5. Type check
bun run check-types
# Should pass with no errors

# 6. Run tests
bun run test
# Should pass
```

### Git Commands

```bash
cd /Users/mohamadhosein/Workspace/side/dastyar-ai

git add apps/web/src/routes/code/\$runId.tsx
git add apps/server/src/routes/chat.ts
git add apps/web/src/routes/code/index.tsx
git add apps/web/src/routes/transcribe.tsx
git add apps/web/src/routes/translation/components/pdf-result-display.tsx

git commit -m "refactor: improve type safety and error handling

- Replace type assertions with proper type guards and validation
- Add Zod validation for message parsing in chat routes
- Improve error handling in clipboard operations with user feedback
- Add default cases to switch statements for exhaustive checking
- Extract complex formatting logic to reduce cognitive complexity
- Remove/prefix unused function parameters per Biome conventions

Fixes:
- Type safety: Replaced 'as unknown' assertions
- Error handling: Replaced silent catch blocks with proper logging
- Code complexity: Reduced transcribe.tsx complexity from 21 to <15
- Exhaustiveness: Added default cases to all switches"
```

### Risk Assessment

- **Medium Risk:** Type changes may affect runtime behavior
- **Mitigation:** Thorough testing before commit

### Rollback Plan

```bash
git reset --hard HEAD~1
```

### Automation Potential

- **Semi-automated:** npx ultracite fix handles many issues
- **Manual required:** Complex type safety and refactoring changes

---

## Phase 5: Environment & Configuration

**Priority:** LOW | **Risk:** Low | **Time:** 15 minutes

### Objective

Complete .env.example and ensure all configuration options are documented.

### Issues Addressed

- Missing environment variables in .env.example (SERVER_PORT, SERVER_HOST)
- Inconsistent naming between .env.example and actual usage

### File to Modify

#### /Users/mohamadhosein/Workspace/side/dastyar-ai/.env.example

**Current state:** Has PORT and HOST
**Finding claims:** Missing SERVER_PORT, SERVER_HOST

**Analysis:** The .env.example appears complete based on the file read earlier. This may be a false positive OR the code uses SERVER_PORT but .env.example shows PORT.

**Verification needed:**

```bash
# Check what env vars are actually used in code
cd /Users/mohamadhosein/Workspace/side/dastyar-ai
grep -r "process.env.SERVER_PORT" apps/server/src/
grep -r "process.env.PORT" apps/server/src/
grep -r "process.env.HOST" apps/server/src/
grep -r "process.env.SERVER_HOST" apps/server/src/
```

**If SERVER_PORT/SERVER_HOST are used:**

Add to .env.example after line 22:

```bash
# Alternative environment variable names (legacy compatibility)
# Some configurations may use these names instead
SERVER_PORT=3000
SERVER_HOST=127.0.0.1
```

**If only PORT/HOST are used:**

- No changes needed, this is a false positive

### Commands

```bash
cd /Users/mohamadhosein/Workspace/side/dastyar-ai

# 1. Check actual usage
grep -rn "process.env.SERVER_PORT\|process.env.SERVER_HOST" apps/server/src/ > /tmp/env-usage.txt
cat /tmp/env-usage.txt

# 2. If found, update .env.example
# (manual edit or sed)

# 3. Verify completeness
comm -3 <(grep "=" .env.example | cut -d= -f1 | sort) <(grep -rh "process.env\." apps/ | grep -oP "process\.env\.\K\w+" | sort -u)
# Should show minimal differences (only computed/dynamic vars)
```

### Verification Steps

```bash
# 1. Verify all env vars documented
grep -rh "process.env\." apps/server/src/ | grep -oP "process\.env\.\K\w+" | sort -u > /tmp/used-vars.txt
grep "^[A-Z_]*=" .env.example | cut -d= -f1 | sort > /tmp/documented-vars.txt
diff /tmp/used-vars.txt /tmp/documented-vars.txt

# 2. Test config generation
bun run config:generate
cat config.json
# Should have all required fields

# 3. Test config validation
bun run config:validate
# Should pass
```

### Git Commands

```bash
# Only if changes were needed
git add .env.example
git commit -m "docs: update .env.example with missing environment variables

- Add SERVER_PORT and SERVER_HOST for legacy compatibility
- Ensure all environment variables used in code are documented"
```

### Risk Assessment

- **Very Low Risk:** Documentation only

### Automation Potential

- **Fully automated:** Script can extract env vars from code and compare

---

## Phase 6: Final Verification & Documentation Update

**Priority:** LOW | **Risk:** None | **Time:** 20-30 minutes

### Objective

Verify all changes, update documentation, and create summary report.

### Tasks

#### 1. Run Complete Test Suite

```bash
cd /Users/mohamadhosein/Workspace/side/dastyar-ai

# Type checking
bun run check-types

# Unit tests
bun run test

# API tests
bun run test:api

# Lint check
npx ultracite check

# Build verification
bun run build --skip-whisper
```

#### 2. Update CLAUDE.md

**File:** `/Users/mohamadhosein/Workspace/side/dastyar-ai/CLAUDE.md`

**Add section after "Testing Guidelines":**

```markdown
## Code Quality Standards

This project enforces strict code quality through Ultracite and Biome:

- Run `npx ultracite fix` before committing
- Zero tolerance for `any` types
- No silent error suppression (empty catch blocks)
- All switch statements must have default cases
- Cognitive complexity limit: 15
- No type assertions without validation

## Ignored Files & Security

The following patterns are git-ignored for security:

- `*.pem` - SSL certificates
- `config.json` - Contains secrets
- `*.db` - Database files
- `*.log` - Log files at root level

Never commit these files. Use `.env.example` as a template for configuration.
```

#### 3. Create Cleanup Summary

**File:** `/Users/mohamadhosein/Workspace/side/dastyar-ai/docs/CLEANUP_SUMMARY.md`

````markdown
# Project Cleanup Summary

**Date:** 2025-12-12
**Version:** 1.0.0

## Overview

Comprehensive cleanup of dastyar-ai monorepo addressing security, dependencies, code quality, and organization.

## Changes Made

### Security (Phase 1)

- ✅ Removed config.json from git tracking
- ✅ Updated .gitignore for sensitive files
- ✅ Added documentation for configuration setup

### Dependencies (Phase 2)

- ✅ Removed unused dependencies (tokenlens, radix-ui, ollama from web)
- ✅ Fixed version inconsistencies (@ai-sdk, ai, @orpc)
- ✅ Removed non-existent packages/\* workspace
- ✅ Kept jszip in root (used by build scripts)

### File System (Phase 3)

- ✅ Removed empty component directories (auth, layout, code)
- ✅ Organized admin panel docs into subdirectory
- ✅ Created /specs/ directory per CLAUDE.md
- ✅ Added IMPROVEMENTS_TODO.md for tracking technical debt
- ✅ Cleaned up runtime files from root

### Code Quality (Phase 4)

- ✅ Replaced type assertions with validation
- ✅ Improved error handling (no silent failures)
- ✅ Reduced complexity in transcribe.tsx
- ✅ Added default cases to switch statements
- ✅ Fixed unused parameters

### Configuration (Phase 5)

- ✅ Verified .env.example completeness
- ✅ Documented all environment variables

## Metrics

| Metric          | Before | After | Change   |
| --------------- | ------ | ----- | -------- |
| Type Assertions | 5+     | 0-2   | -60-100% |
| Silent Catches  | 3      | 0     | -100%    |
| Unused Deps     | 4      | 0     | -100%    |
| Empty Dirs      | 3      | 0     | -100%    |
| Max Complexity  | 21     | <15   | -29%     |

## Breaking Changes

1. **config.json no longer tracked in git**
   - **Action Required:** Run `bun run config:generate` or copy `.env.example` to `.env`
   - **Why:** Security - prevents accidental commit of secrets

## Testing

All tests pass:

- ✅ Type checking: `bun run check-types`
- ✅ Unit tests: `bun run test`
- ✅ API tests: `bun run test:api`
- ✅ Lint: `npx ultracite check`
- ✅ Build: `bun run build`

## Next Steps

1. Monitor for any runtime issues post-deployment
2. Add integration tests for AI orchestration
3. Continue tracking improvements in specs/IMPROVEMENTS_TODO.md
4. Consider adding pre-commit hooks for ultracite

## Rollback

If needed, restore from backup branch:

```bash
git checkout backup-before-cleanup
```
````

## References

- Original findings: [exploration report]
- CLAUDE.md guidelines: `/CLAUDE.md`
- Improvements tracking: `/specs/IMPROVEMENTS_TODO.md`

````

#### 4. Update README.md
**File:** `/Users/mohamadhosein/Workspace/side/dastyar-ai/README.md`

**Add "Recent Changes" section:**
```markdown
## Recent Changes

### December 2025 - Project Cleanup

Major cleanup improving security, code quality, and organization:
- Removed sensitive files from git tracking
- Cleaned up dependencies and fixed version conflicts
- Improved type safety and error handling
- Reorganized documentation structure

See [CLEANUP_SUMMARY.md](docs/CLEANUP_SUMMARY.md) for details.
````

### Commands

```bash
cd /Users/mohamadhosein/Workspace/side/dastyar-ai

# 1. Run all verifications
bun run check-types && \
bun run test && \
bun run test:api && \
npx ultracite check

# 2. Create documentation
# (manual edits as specified above)

# 3. Final git status check
git status

# 4. Create summary commit
git add docs/CLEANUP_SUMMARY.md CLAUDE.md README.md
git commit -m "docs: add cleanup summary and update guidelines

- Document all changes from cleanup effort
- Update CLAUDE.md with code quality standards
- Add security guidelines for ignored files
- Update README with recent changes section"
```

### Verification Checklist

```bash
# Checklist script
cat > /tmp/verify-cleanup.sh << 'VERIFY'
#!/bin/bash

echo "=== Dastyar-AI Cleanup Verification ==="
echo ""

# Security
echo "1. Security Checks..."
git ls-files | grep -E 'config.json|\.pem|\.db' && echo "❌ FAIL: Sensitive files tracked" || echo "✅ PASS: No sensitive files tracked"

# Dependencies
echo "2. Dependency Checks..."
grep -q "tokenlens\|radix-ui" apps/web/package.json && echo "❌ FAIL: Unused deps present" || echo "✅ PASS: Unused deps removed"

# File System
echo "3. File System Checks..."
ls apps/web/src/components/auth 2>/dev/null && echo "❌ FAIL: Empty dirs present" || echo "✅ PASS: Empty dirs removed"
ls docs/admin-panel/ | grep -q "ADMIN_PANEL" && echo "✅ PASS: Admin docs organized" || echo "❌ FAIL: Admin docs not organized"
ls specs/ >/dev/null 2>&1 && echo "✅ PASS: /specs/ directory exists" || echo "❌ FAIL: /specs/ directory missing"

# Code Quality
echo "4. Code Quality Checks..."
bun run check-types >/dev/null 2>&1 && echo "✅ PASS: Type check" || echo "❌ FAIL: Type check"
npx ultracite check 2>&1 | grep -q "0 errors" && echo "✅ PASS: No lint errors" || echo "⚠️  WARN: Lint errors present"

# Tests
echo "5. Test Checks..."
bun run test >/dev/null 2>&1 && echo "✅ PASS: Unit tests" || echo "❌ FAIL: Unit tests"

echo ""
echo "=== Verification Complete ==="
VERIFY

chmod +x /tmp/verify-cleanup.sh
/tmp/verify-cleanup.sh
```

### Final Git Operations

```bash
# Review all changes
git log --oneline backup-before-cleanup..HEAD

# Create cleanup tag
git tag -a v1.0.0-cleanup -m "Project cleanup complete

- Security: Removed sensitive files from tracking
- Dependencies: Cleaned up and aligned versions
- Code Quality: Improved type safety and error handling
- Documentation: Reorganized and updated
- File System: Cleaned up empty dirs and runtime files"

# Push (when ready)
# git push origin master
# git push origin v1.0.0-cleanup
```

---

## Summary

### Phases Overview

| Phase             | Priority | Risk   | Time       | Auto %  |
| ----------------- | -------- | ------ | ---------- | ------- |
| 1. Security & Git | HIGHEST  | Medium | 30-45m     | 20%     |
| 2. Dependencies   | HIGH     | Low    | 20-30m     | 50%     |
| 3. File System    | MEDIUM   | Low    | 15-20m     | 90%     |
| 4. Code Quality   | MEDIUM   | Medium | 60-90m     | 30%     |
| 5. Environment    | LOW      | Low    | 15m        | 80%     |
| 6. Verification   | LOW      | None   | 20-30m     | 70%     |
| **TOTAL**         |          |        | **2.5-4h** | **57%** |

### Critical Success Factors

1.  **Backup First:** Create backup-before-cleanup branch
2.  **Test Between Phases:** Run verification after each phase
3.  **Commit Frequently:** One commit per phase for easy rollback
4.  **Document Changes:** Update docs as you go
5.  **Verify Builds:** Ensure `bun run dev` works after each phase

### Risk Mitigation

- **Backup branch:** Can rollback entire cleanup
- **Phase commits:** Can rollback individual phases
- **Verification scripts:** Catch issues early
- **Type checking:** Prevents runtime errors
- **Test suite:** Validates functionality

### Post-Cleanup

1.  Monitor application for 24-48 hours
2.  Update CI/CD pipelines if needed
3.  Communicate breaking changes to team
4.  Schedule follow-up for IMPROVEMENTS_TODO.md items
5.  Consider adding pre-commit hooks

---

## Appendix A: Quick Reference Commands

### Before Starting

```bash
cd /Users/mohamadhosein/Workspace/side/dastyar-ai
git branch backup-before-cleanup
git status
```

### After Each Phase

```bash
bun run check-types
bun run test
git status
git diff
```

### Emergency Rollback

```bash
git reset --hard HEAD~1  # Rollback last commit
# OR
git checkout backup-before-cleanup  # Rollback all changes
```

### Verify Success

```bash
/tmp/verify-cleanup.sh
bun run dev
```

---

## Appendix B: File Reference

### Files to Modify

- `/Users/mohamadhosein/Workspace/side/dastyar-ai/.gitignore`
- `/Users/mohamadhosein/Workspace/side/dastyar-ai/package.json`
- `/Users/mohamadhosein/Workspace/side/dastyar-ai/apps/web/package.json`
- `/Users/mohamadhosein/Workspace/side/dastyar-ai/apps/server/package.json`
- `/Users/mohamadhosein/Workspace/side/dastyar-ai/apps/web/src/routes/code/$runId.tsx`
- `/Users/mohamadhosein/Workspace/side/dastyar-ai/apps/server/src/routes/chat.ts`
- `/Users/mohamadhosein/Workspace/side/dastyar-ai/apps/web/src/routes/code/index.tsx`
- `/Users/mohamadhosein/Workspace/side/dastyar-ai/apps/web/src/routes/transcribe.tsx`
- `/Users/mohamadhosein/Workspace/side/dastyar-ai/apps/web/src/routes/translation/components/pdf-result-display.tsx`
- `/Users/mohamadhosein/Workspace/side/dastyar-ai/.env.example`
- `/Users/mohamadhosein/Workspace/side/dastyar-ai/CLAUDE.md`
- `/Users/mohamadhosein/Workspace/side/dastyar-ai/README.md`

### Files to Create

- `/Users/mohamadhosein/Workspace/side/dastyar-ai/docs/admin-panel/README.md`
- `/Users/mohamadhosein/Workspace/side/dastyar-ai/specs/README.md`
- `/Users/mohamadhosein/Workspace/side/dastyar-ai/specs/IMPROVEMENTS_TODO.md`
- `/Users/mohamadhosein/Workspace/side/dastyar-ai/docs/CLEANUP_SUMMARY.md`

### Files to Delete/Move

- Empty dirs: `apps/web/src/components/{auth,layout,code}`
- Runtime: `server.log`, `dev.db` (if present)
- SSL certs: `*.pem` (move to secure location)
- Docs: Move `ADMIN_PANEL_*.md` to `docs/admin-panel/`

### Files to Remove from Git

- `config.json` (git rm --cached)
