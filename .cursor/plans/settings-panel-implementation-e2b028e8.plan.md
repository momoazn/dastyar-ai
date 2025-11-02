<!-- e2b028e8-82c9-442e-9906-dc9bf8116bd3 7c4d470a-f400-43c7-b55b-b07d01f8a22e -->
# Settings Panel Implementation

## Overview

Build a settings panel accessible from the user profile menu where users can manage their account credentials and feature preferences (models and options for code, translate, summarize, transcribe). Admin users get additional sections for managing users and models.

## Database Schema Changes

### New Table: `user_preferences`

Store user-specific default preferences in `apps/server/src/database/schema/index.ts`:

- `id` (PK, auto-increment)
- `user_id` (FK to users, unique)
- `code_model_id` (FK to llm_models, nullable)
- `code_mode` (enum: generate/explain/review/debug, nullable)
- `code_language` (enum: programming languages, nullable)
- `translation_model_id` (FK to llm_models, nullable)
- `translation_source_language` (enum: language codes, nullable)
- `translation_target_language` (enum: language codes, nullable)
- `translation_tone` (enum: tones, nullable)
- `summarize_model_id` (FK to llm_models, nullable)
- `summarize_mode` (enum: concise/standard/detailed, nullable)
- `summarize_tone` (enum: tones, nullable)
- `transcribe_model` (text, nullable) - Whisper model name
- `transcribe_engine` (enum: whisperx/whisper, nullable)
- `transcribe_language` (enum: fa/en, nullable)
- `created_at`, `updated_at` timestamps

## Backend Implementation

### 1. Repository Layer (`apps/server/src/repositories/user-preferences.ts`)

- `getUserPreferences(userId)` - Get or create default preferences for user
- `updateUserPreferences(userId, preferences)` - Update preferences
- `upsertUserPreferences(userId, preferences)` - Create or update preferences

### 2. Auth Procedures (`apps/server/src/procedures/auth.ts`)

Add new procedures:

- `updateUsername` - protectedProcedure to change username (with validation)
- `updatePassword` - protectedProcedure to change password (requires current password)

### 3. Settings Procedures (`apps/server/src/procedures/settings.ts`)

New file with procedures:

- `getPreferences` - protectedProcedure to get user preferences
- `updatePreferences` - protectedProcedure to update user preferences (partial updates)

### 4. Admin Procedures (`apps/server/src/procedures/admin.ts`)

Already exists with:

- `listUsers`, `updateUserRole`, `updateUserPassword` (for admin use)
- `listAllModels`, `toggleModelStatus` (for admin use)

## Frontend Implementation

### 1. Settings Route (`apps/web/src/routes/settings.tsx`)

New route component with:

- Tabs for different sections:
- Account: Username, Password changes
- Preferences: Code, Translate, Summarize, Transcribe settings
- Admin (only if user role is admin): Users list, Models management
- Use existing admin components (`UsersTable`, `ModelsTable`) for admin section

### 2. Settings Components (`apps/web/src/components/settings/`)

Create directory with:

- `settings-layout.tsx` - Main layout with tabs
- `account-settings.tsx` - Username/password forms
- `preferences-settings.tsx` - Feature preference forms
- `feature-preferences-section.tsx` - Reusable component for each feature

### 3. Preferences Atoms (`apps/web/src/atoms/preferences.ts`)

Jotai atoms to sync preferences with server:

- `userPreferencesAtom` - Store loaded preferences
- Hooks to update preferences atom when changed

### 4. Update Model Selection Hooks (`apps/web/src/hooks/use-feature-model-selection.ts`)

Modify hooks (except chat) to:

- Check user preferences first before falling back to last used or first available
- Persist selections to preferences when user changes model
- Note: Chat model selection remains unchanged (uses last used model per thread)

### 5. Navigation Updates

- Add Settings link to `apps/web/src/components/sidebar/user-profile-button.tsx` (dropdown menu)
- Optionally add to sidebar navigation in `nav.ts` if preferred

### 6. ORPC Client Updates

Ensure `apps/web/src/utils/orpc.ts` includes the new procedures in the router type.

## Key Implementation Details

1. **UI/UX Consistency**:

- Follow Card-based layout pattern (`Card className="p-6"`)
- Use Tabs component for section navigation (matching admin page pattern)
- RTL support: `text-right` alignment, Persian text from `fa` lib
- Form validation with react-hook-form + zodResolver
- Loading states: Use LoadingSpinner or custom spinner pattern
- Error states: Display in Card with `text-destructive`
- Success feedback: Use `toast.success()` from sonner
- Empty states: Show message in Card with `text-muted-foreground`

2. **Username Update**: Validate uniqueness, update JWT if changed, show toast on success

3. **Password Update**: 

- Require current password verification
- Use Dialog pattern (like ResetPasswordDialog) for password change
- Show confirmation before changing

4. **Preferences**: 

- Use partial updates (only send changed fields)
- Auto-save on change or manual save button (decide based on UX)
- Show loading state during save

5. **Model Validation**: Ensure selected models exist and are enabled before saving

6. **Admin Access**: Use role check from `useUser` hook to conditionally render admin tab

7. **Migration**: Create database migration for `user_preferences` table

8. **Form Patterns**:

- Use zod schemas for validation
- Follow existing form patterns from `ResetPasswordDialog`
- Show FormMessage for errors
- Disable buttons during loading states

## Files to Create/Modify

### New Files:

- `apps/server/src/database/schema/index.ts` (add user_preferences table)
- `apps/server/src/repositories/user-preferences.ts`
- `apps/server/src/procedures/settings.ts`
- `apps/web/src/routes/settings.tsx`
- `apps/web/src/components/settings/*.tsx` (multiple components)
- `apps/web/src/atoms/preferences.ts`
- Migration file in `apps/server/src/database/migrations/`

### Modified Files:

- `apps/server/src/procedures/auth.ts` (add updateUsername, updatePassword)
- `apps/server/src/procedures/index.ts` (export settings procedures)
- `apps/web/src/hooks/use-feature-model-selection.ts` (use preferences for code/translate/summarize)
- `apps/web/src/components/sidebar/user-profile-button.tsx` (add settings link)
- `apps/server/src/database/index.ts` (export user preferences schema)