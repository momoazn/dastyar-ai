# Settings Section Rebuild Plan

**Created:** 2025-12-13
**Status:** Awaiting Approval

---

## Table of Contents
1. [Current State Analysis](#current-state-analysis)
2. [Identified Problems](#identified-problems)
3. [Proposed Solution](#proposed-solution)
4. [New Architecture](#new-architecture)
5. [Implementation Plan](#implementation-plan)
6. [UI/UX Mockups](#uiux-mockups)
7. [File Changes](#file-changes)
8. [Migration Strategy](#migration-strategy)

---

## Current State Analysis

### Files Involved

| File | Purpose | Lines | Issues |
|------|---------|-------|--------|
| `routes/settings.tsx` | Main settings route with tabs | 169 | Complex tab logic, crowded |
| `admin/settings-panel.tsx` | Admin system settings | 432 | All fields left-aligned, no RTL, chaotic layout |
| `settings/account-settings.tsx` | User account settings | 296 | RTL issues, layout problems |
| `settings/preferences-settings.tsx` | User preferences | 222 | Complex form, no categorization |
| `preferences-sections/code-preferences.tsx` | Code assistant settings | 139 | Senseless for non-developers |
| `preferences-sections/translation-preferences.tsx` | Translation settings | 172 | 4 fields for same purpose |
| `preferences-sections/summary-preferences.tsx` | Summary settings | 142 | 3 nearly identical fields |
| `preferences-sections/transcribe-preferences.tsx` | Transcription settings | 89 | Limited options |

### Current Tab Structure

```
Settings Page (5 tabs for admins, 2 for users)
├── 💳 Account (حساب کاربری)
│   ├── Username change
│   └── Password change
├── ⚙️ Preferences (تنظیمات پیش‌فرض)
│   ├── Code preferences (3 fields)
│   ├── Translation preferences (4 fields)
│   ├── Summary preferences (3 fields)
│   └── Transcribe preferences (2 fields)
├── 👥 Users (Admin only)
├── 🤖 Models (Admin only)
└── 🛡️ System (Admin only)
    ├── General settings (2 fields)
    ├── Security settings (3 fields)
    ├── File management (2 fields)
    ├── AI Models settings (5 fields)
    └── Rate limiting (2 fields)
```

---

## Identified Problems

### 1. **RTL & Layout Issues** 🚨 Critical
- Forms are left-aligned despite `dir="rtl"` on wrapper
- Input fields have `text-right` but layout flows LTR
- Grid layouts use `grid-cols-2` without RTL consideration
- Buttons use `flex-row-reverse` inconsistently
- Labels positioned incorrectly relative to fields

### 2. **Information Architecture Problems** 📊
- **Too many tabs:** 5 tabs for admins is overwhelming
- **Scattered admin settings:** Users, Models, System are separate but related
- **Preferences as single tab:** 12+ fields crammed into one scrollable area
- **No visual hierarchy:** All settings look equally important
- **Missing tooltips/descriptions:** Users don't know what settings do

### 3. **UX Issues** 👤
- No search functionality in settings
- No reset to defaults for individual sections
- Unsaved changes warning is at the bottom (not visible)
- Loading states are inconsistent
- No confirmation before destructive actions on some settings
- No visual feedback while saving

### 4. **Senseless Settings** 🤔
- **Code Mode preferences:** Most users aren't developers, why default?
- **Programming Language preferences:** Irrelevant for many users
- **Separate model selections:** Each feature has its own model picker (4 model selects!)
- **Tone settings repeated:** Same tone options in Translation and Summary
- **Transcribe model as text input:** Should be a select or auto-detected

### 5. **Admin Panel Issues** 👨‍💼
- Settings Panel (`settings-panel.tsx`) is a wall of form fields
- No visual separation between setting categories
- Checkbox styling is native HTML (inconsistent with design system)
- Security settings intermixed with file settings
- No audit trail or change history

### 6. **Technical Debt** 🔧
- No form validation on admin settings
- Type casting everywhere (`settings.app_name as string`)
- No optimistic updates
- Saving all settings at once (inefficient)
- Hardcoded default values in component

---

## Proposed Solution

### New Design Philosophy

1. **Separate User & Admin Settings Completely**
   - User settings: `/settings` - Personal preferences
   - Admin settings: `/admin/settings` - System configuration

2. **Smart Categorization**
   - Group related settings
   - Use accordions/collapsibles instead of tabs where appropriate
   - Progressive disclosure (show advanced only when needed)

3. **RTL-First Design**
   - All layouts designed for RTL
   - Proper use of `ms-*` and `me-*` (margin-inline-start/end)
   - Icons positioned correctly

4. **Meaningful Preferences**
   - Remove rarely used preferences
   - Make smart defaults
   - Allow one-time setup wizards

---

## New Architecture

### User Settings (`/settings`)

```
Settings
├── 🧑‍💼 Profile (پروفایل)
│   ├── Avatar (future)
│   ├── Display name (future)
│   └── Username
│
├── 🔐 Security (امنیت)
│   ├── Change password
│   └── Active sessions (future)
│
├── 🎨 Appearance (ظاهر) [Future]
│   ├── Theme (dark/light/system)
│   └── Font size
│
└── ⚡ Quick Settings (تنظیمات سریع)
    ├── Default AI Model (one model for all!)
    ├── Default Language (fa/en)
    ├── Voice Language (transcription)
    └── Translation preferences (simplified)
```

### Admin Dashboard (`/admin`)

```
Admin Dashboard (داشبورد مدیریت)
├── 📊 Overview (نمای کلی)
│   ├── Stats cards
│   └── Quick actions
│
├── 👥 Users (کاربران)
│   ├── Users list
│   └── User details
│
├── 🤖 AI Models (مدل‌های هوش مصنوعی)
│   ├── Models list
│   └── Add/sync models
│
└── ⚙️ Configuration (پیکربندی)
    ├── 🏢 General
    │   ├── App name
    │   └── App description
    │
    ├── 🔒 Security
    │   ├── Token settings
    │   ├── Session settings
    │   └── Password policies
    │
    ├── 📁 Storage
    │   ├── Max file size
    │   └── Allowed file types
    │
    ├── 🚦 Rate Limiting
    │   ├── Enable/disable
    │   └── Requests per minute
    │
    └── 🧠 AI Features
        ├── Transcription toggle
        ├── Translation toggle
        ├── Code execution toggle
        ├── Image generation toggle
        └── Response timeout
```

---

## Implementation Plan

### Phase 1: Foundation (Week 1)
**Goal:** Create new component structure and fix RTL issues

1. **Create new settings component library**
   - `SettingsSection` - Collapsible section wrapper
   - `SettingsItem` - Individual setting row
   - `SettingsGroup` - Group of related settings
   - `SettingsHeader` - Section header with icon

2. **Create RTL-aware form components**
   - Update form field layouts
   - Fix input alignment
   - Add proper spacing utilities

3. **Restructure routes**
   - Keep `/settings` for users
   - Create `/admin` route with sub-routes

### Phase 2: User Settings Rebuild (Week 1-2)
**Goal:** Clean, minimal user settings

1. **ProfileSection**
   - Username display and edit
   - Clean single-column layout

2. **SecuritySection**
   - Password change (simplified flow)
   - Show success/error inline

3. **QuickSettings**
   - Single model selector (replaces 4!)
   - Language preference
   - Voice input language

### Phase 3: Admin Settings Rebuild (Week 2)
**Goal:** Professional admin configuration panel

1. **AdminLayout**
   - Sidebar navigation
   - Breadcrumbs
   - Section-based routing

2. **Config sections as separate routes**
   - `/admin/config/general`
   - `/admin/config/security`
   - `/admin/config/storage`
   - `/admin/config/rate-limiting`
   - `/admin/config/ai-features`

3. **Improved UX**
   - Auto-save per field
   - Visual feedback
   - Reset to defaults

### Phase 4: Polish & Cleanup (Week 2-3)
**Goal:** Remove old code, finalize

1. Delete old components
2. Update translations
3. Add tests
4. Documentation

---

## UI/UX Mockups

### User Settings - New Layout

```
┌────────────────────────────────────────────────────────┐
│                       تنظیمات                          │
│                 مدیریت تنظیمات حساب کاربری              │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 👤 پروفایل                                    ▼ │  │
│  ├─────────────────────────────────────────────────┤  │
│  │                                                 │  │
│  │  نام کاربری   ──────────────────────────────── │  │
│  │               │ mohammad_hmn                 │ │  │
│  │               ──────────────────────────────── │  │
│  │                                   [ویرایش]    │  │
│  │                                                 │  │
│  └─────────────────────────────────────────────────┘  │
│                                                        │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 🔐 امنیت                                      ▼ │  │
│  ├─────────────────────────────────────────────────┤  │
│  │                                                 │  │
│  │  رمز عبور     ●●●●●●●●                         │  │
│  │                                   [تغییر]     │  │
│  │                                                 │  │
│  └─────────────────────────────────────────────────┘  │
│                                                        │
│  ┌─────────────────────────────────────────────────┐  │
│  │ ⚡ تنظیمات سریع                                ▼ │  │
│  ├─────────────────────────────────────────────────┤  │
│  │                                                 │  │
│  │  مدل پیش‌فرض  ──────────────────────────────── │  │
│  │               │ Claude 3.5 Sonnet          ▾│ │  │
│  │               ──────────────────────────────── │  │
│  │                                                 │  │
│  │  زبان         ◉ فارسی    ○ English             │  │
│  │                                                 │  │
│  │  زبان ورودی   ◉ فارسی    ○ English             │  │
│  │  صوتی                                          │  │
│  │                                                 │  │
│  └─────────────────────────────────────────────────┘  │
│                                                        │
│                               [ذخیره تغییرات]         │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Admin Config - New Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  ○ ○ ○                    پیکربندی سیستم                         │
├──────────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌────────────────────────────────────────────────┐  │
│ │          │ │                                                │  │
│ │ 🏢 عمومی │ │  تنظیمات عمومی                                 │  │
│ │ ─────────│ │  ─────────────────────────────────────────     │  │
│ │ 🔒 امنیت │ │                                                │  │
│ │ ─────────│ │  نام برنامه                                    │  │
│ │ 📁 ذخیره │ │  ┌───────────────────────────────────────┐     │  │
│ │ ─────────│ │  │ دستیار هوشمند                         │     │  │
│ │ 🚦 نرخ   │ │  └───────────────────────────────────────┘     │  │
│ │ ─────────│ │                                                │  │
│ │ 🧠 هوش   │ │  شرح برنامه                                    │  │
│ │   مصنوعی │ │  ┌───────────────────────────────────────┐     │  │
│ │          │ │  │ دستیار هوش مصنوعی فارسی برای        │     │  │
│ │          │ │  │ کارهای روزانه شما                     │     │  │
│ │          │ │  └───────────────────────────────────────┘     │  │
│ │          │ │                                                │  │
│ │          │ │  ┌────────────┐  ┌────────────────────────┐    │  │
│ │          │ │  │   لغو      │  │   ذخیره تغییرات ✓     │    │  │
│ │          │ │  └────────────┘  └────────────────────────┘    │  │
│ │          │ │                                                │  │
│ └──────────┘ └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## File Changes

### New Files to Create

```
apps/web/src/
├── components/
│   └── settings/
│       ├── settings-section.tsx      # Collapsible section
│       ├── settings-item.tsx         # Form row component
│       ├── settings-header.tsx       # Section header
│       ├── profile-section.tsx       # Profile settings
│       ├── security-section.tsx      # Security settings
│       └── quick-settings.tsx        # Quick preferences
│
├── routes/
│   ├── settings.tsx                  # Rebuilt user settings
│   └── admin/
│       ├── index.tsx                 # Admin dashboard
│       ├── users.tsx                 # Users management
│       ├── models.tsx                # Models management
│       └── config/
│           ├── index.tsx             # Config overview
│           ├── general.tsx           # General settings
│           ├── security.tsx          # Security settings
│           ├── storage.tsx           # Storage settings
│           ├── rate-limiting.tsx     # Rate limiting
│           └── ai-features.tsx       # AI toggles
│
└── lib/texts/
    └── settings.ts                   # Updated translations
```

### Files to Delete

```
apps/web/src/components/settings/
├── preferences-settings.tsx          # Replaced by quick-settings
└── preferences-sections/
    ├── code-preferences.tsx          # Remove entirely
    ├── translation-preferences.tsx   # Simplify into quick-settings
    ├── summary-preferences.tsx       # Remove (use default model)
    └── transcribe-preferences.tsx    # Simplify into quick-settings
```

### Files to Heavily Modify

```
apps/web/src/
├── components/admin/settings-panel.tsx  → Split into config sections
├── routes/settings.tsx                  → Complete rewrite
└── lib/texts/settings.ts                → Add new keys
```

---

## Migration Strategy

### Phase 1: Parallel Development
- Create new components alongside old ones
- New routes under `/settings-new` for testing
- Don't break existing functionality

### Phase 2: Feature Flag
- Add feature flag `USE_NEW_SETTINGS`
- Gradually enable for testing
- Keep old implementation as fallback

### Phase 3: Cutover
- Replace old routes with new
- Delete old component files
- Update documentation

### Phase 4: Cleanup
- Remove feature flag
- Delete migration code
- Final testing

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Settings load time | ~800ms | <400ms |
| Number of tabs (user) | 2 | 1 (sections) |
| Number of tabs (admin) | 5 | 0 (routes) |
| Form fields visible at once | 12+ | 3-5 per section |
| RTL issues | 8+ | 0 |
| Mobile usability | Poor | Good |

---

## Approval Checklist

- [ ] Reviewed by Product Owner
- [ ] UX Design approved
- [ ] Technical approach approved
- [ ] Timeline agreed
- [ ] Resources allocated

---

## Notes

- Consider adding keyboard shortcuts for power users
- Future: User preferences sync across devices
- Future: Export/import settings
- Future: Dark mode toggle (currently no theme switcher)

---

**Awaiting your approval to proceed with implementation.**
