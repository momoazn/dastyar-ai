# Phase 3 Quick Reference - System Settings

## Overview
Complete implementation of system settings management for the admin panel with database persistence, comprehensive validation, and user-friendly interface.

---

## For Administrators

### Access Settings
1. Login as admin user
2. Navigate to `/admin`
3. Click **Settings** tab (3rd tab)

### Modify Settings
1. Find the section containing the setting
2. Update the value
3. "تغییرات ذخیره‌نشده" (unsaved changes) badge appears
4. Click "ذخیره تغییرات" (Save Changes)
5. Success toast confirms save
6. Setting takes effect immediately

### Revert Changes
- Click "لغو" (Cancel) to discard unsaved changes
- All values reload from server

---

## For Developers

### Reading Settings

**On the Server:**
```typescript
import { getSetting, getSettingValue } from "@/repositories/system-settings";

// Get specific setting
const maxFileSize = await getSetting("max_file_size_mb");
console.log(maxFileSize.value); // 50

// Get with fallback default
const timeout = await getSettingValue("model_response_timeout_seconds", 300);
console.log(timeout); // 300 or configured value

// Get all settings
const allSettings = await getSetting("*"); // Not implemented, use getAllSettings()
```

**On the Client:**
```typescript
import { orpc } from "@/utils/orpc";

// Fetch all settings
const settings = await orpc.admin.getAllSettings.query();

// Use in component
const maxSize = settings.find(s => s.key === "max_file_size_mb")?.value;
```

### Adding a New Setting

1. **Add to initialization** (`system-settings.ts`):
```typescript
defaults['new_setting_key'] = 'default_value';
```

2. **Add translation** (`persian-texts.ts`):
```typescript
settingLabel: "نام تنظیم جدید",
```

3. **Add UI input** (`settings-panel.tsx`):
```typescript
<Input
  value={settings.new_setting_key as string}
  onChange={(e) => handleSettingChange("new_setting_key", e.target.value)}
/>
```

### Accessing in Application Logic

```typescript
// Check if feature is enabled
const enableTranscription = await getSettingValue("enable_transcription");
if (enableTranscription) {
  // Enable transcription feature
}

// Use numeric setting
const maxFileSize = await getSettingValue("max_file_size_mb", 50);
if (fileSize > maxFileSize * 1024 * 1024) {
  throw new Error("File too large");
}
```

---

## File Locations

### Backend
- **Repository:** `apps/server/src/repositories/system-settings.ts`
- **Procedures:** `apps/server/src/procedures/admin.ts` (lines with settings)
- **Schema:** `apps/server/src/database/schema/index.ts`
- **Types:** `SelectSystemSetting`, `InsertSystemSetting`

### Frontend
- **Component:** `apps/web/src/components/admin/settings-panel.tsx`
- **Types:** `apps/web/src/types/database.ts`
- **Route:** `apps/web/src/routes/admin.tsx`
- **Translations:** `apps/web/src/lib/persian-texts.ts` (fa.admin.settings)

### Database
- **Table:** `system_settings`
- **Migration:** `apps/server/src/database/migrations/0001_elite_sunspot.sql`

### Documentation
- **Phase 3 Guide:** `docs/ADMIN_PANEL_PHASE3.md`
- **Progress:** `docs/ADMIN_PANEL_PROGRESS.md`
- **Completion:** `PHASE3_COMPLETION_SUMMARY.md`

---

## Default Settings Reference

| Key | Type | Default | Purpose |
|-----|------|---------|---------|
| `app_name` | string | "Dastyar AI" | Application display name |
| `app_description` | string | "Persian AI Assistant" | Short app description |
| `max_file_size_mb` | number | 50 | Max upload size in MB |
| `allowed_file_types` | array | ["pdf", "txt", ...] | Allowed file extensions |
| `token_expiration_hours` | number | 24 | JWT token lifetime |
| `session_timeout_minutes` | number | 30 | Session inactivity timeout |
| `password_min_length` | number | 6 | Password minimum length |
| `password_require_special_chars` | boolean | false | Require special chars in password |
| `password_require_numbers` | boolean | false | Require numbers in password |
| `password_require_uppercase` | boolean | false | Require uppercase in password |
| `model_response_timeout_seconds` | number | 300 | Model response timeout |
| `enable_transcription` | boolean | true | Enable transcription feature |
| `enable_translation` | boolean | true | Enable translation feature |
| `enable_code_execution` | boolean | true | Enable code execution feature |
| `enable_image_generation` | boolean | true | Enable image generation feature |

---

## Common Tasks

### Change Token Expiration
1. Go to Settings tab
2. Look for "Security Settings" section
3. Find "انقضای توکن (ساعت)" (Token Expiration Hours)
4. Change value from 24 to desired hours
5. Save

### Disable a Feature
1. Go to Settings tab
2. Look for "AI Model Settings" section
3. Uncheck the feature (e.g., "فعال کردن ترجمه")
4. Save

### Update File Upload Limits
1. Go to Settings tab
2. Look for "File Management Settings" section
3. Update "حداکثر اندازه فایل (مگابایت)"
4. Save

### Check Current Rate Limit
1. Go to Settings tab
2. Look for "Rate Limit Settings" section
3. View "درخواست‌های مجاز در دقیقه"

---

## API Reference

### ORPC Procedures

**`getAllSettings()`**
```typescript
const settings = await orpc.admin.getAllSettings.query();
// Returns: SystemSetting[]
```

**`getSetting(key)`**
```typescript
const setting = await orpc.admin.getSetting.query({ key: "app_name" });
// Returns: SystemSetting
// Throws: NOT_FOUND if key doesn't exist
```

**`upsertSetting(key, value, description?)`**
```typescript
const updated = await orpc.admin.upsertSetting.mutate({
  key: "app_name",
  value: "My App",
  description: "Application name"
});
// Returns: SystemSetting
```

**`deleteSetting(key)`**
```typescript
const result = await orpc.admin.deleteSetting.mutate({ key: "app_name" });
// Returns: { success: true }
```

**`initializeSettings()`**
```typescript
const result = await orpc.admin.initializeSettings.mutate({});
// Returns: { success: true }
```

---

## Troubleshooting

### Settings Don't Load
- Check browser console for errors
- Verify admin role is correct
- Check database connection

### Changes Don't Save
- Verify no validation errors in form
- Check network tab in DevTools
- Review server logs for ORPC errors

### Setting Values Not Updating Application
- Verify setting key matches usage in code
- Check if feature needs server restart
- For feature flags, ensure code checks current value (not cached)

### Persian Text Shows Incorrectly
- Verify `lang="fa"` on html element
- Check UTF-8 encoding in file
- Reload page and clear cache

---

## Performance Notes

- Settings loaded once on component mount
- Cached by React Query for 5 minutes (default)
- Changes are bulk operations (fast)
- No N+1 query problems
- Optimistic UI updates (feel instant)

---

## Security Notes

- All endpoints require admin role
- Validated at procedure level (backend)
- Input validation via Zod schemas
- No sensitive data stored in settings
- Settings are readable (not secrets)
- For secrets, use environment variables

---

## Related Documentation

- **Complete Guide:** docs/ADMIN_PANEL_PHASE3.md
- **Progress Tracking:** docs/ADMIN_PANEL_PROGRESS.md
- **Admin README:** ADMIN_PANEL_README.md
- **Quick Start:** docs/ADMIN_PANEL_QUICK_START.md

---

**Last Updated:** 2025-11-23
**Status:** Production Ready
**Phase:** 3 of 5
