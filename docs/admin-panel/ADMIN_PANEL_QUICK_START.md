# Admin Panel - Quick Start Guide

## What's Been Implemented

### Phase 1 ✅ Core User Management

Complete user management system with advanced features:

**Backend Features:**

- Paginated user listing with search and filtering
- User statistics collection (messages, documents, images, etc.)
- Safe user deletion with admin count validation
- Type-safe API endpoints with Zod validation

**Frontend Features:**

- Advanced users table with:
  - Pagination (10, 25, 50 items per page)
  - Search by username
  - Filter by role (admin/user)
  - Responsive design
- User detail modal showing:
  - Profile information
  - Activity metrics (7 different stats)
  - Formatted timestamps
- Delete user confirmation dialog with typed confirmation
- Change user role dialog
- Reset password dialog

### Phase 2 🆕 Model Management Enhancement

Enhanced model management system:

**Backend Features:**

- Add new models with metadata (creator, family, size)
- Duplicate model detection
- Type-safe model creation

**Frontend Features:**

- Add Model dialog with form validation
- Enhanced models table with:
  - Provider filter (Ollama, LM Studio, Stable Diffusion, Whisper)
  - Status filter (enabled/disabled)
  - Add model button
  - Visual status indicators
- Toggle model enable/disable

---

## How to Use the Admin Panel

### Accessing the Admin Panel

1. Navigate to `/admin` route (requires admin role)
2. Two main tabs: Users and Models

### Managing Users

#### View User List

- See all users in paginated table
- Search by username using search box
- Filter by role
- Change pagination size

#### View User Details

1. Click the three-dot menu on any user
2. Select "مشاهده جزئیات" (View Details)
3. See user profile and activity metrics

#### Change User Role

1. Click the three-dot menu on any user
2. Select "تغییر نقش" (Change Role)
3. Choose new role (admin/user)
4. Confirm

#### Reset User Password

1. Click the three-dot menu on any user
2. Select "تنظیم مجدد رمز عبور" (Reset Password)
3. Enter new password
4. Confirm

#### Delete User

1. Click the three-dot menu on any user
2. Select "حذف کاربر" (Delete User)
3. Type "DELETE" or "حذف" to confirm
4. Click "حذف کاربر" button
5. User and all associated data will be deleted

**Note:** Cannot delete the only admin user in the system

### Managing Models

#### View All Models

- See all available LLM models
- Check enabled/disabled status
- View provider information

#### Filter Models

- **By Provider:** Ollama, LM Studio, Stable Diffusion, Whisper
- **By Status:** Enabled or Disabled

#### Add New Model

1. Click "+ افزودن مدل" (Add Model) button
2. Fill in model details:
   - **نام مدل** (Model Name) - Required
   - **ارائه‌دهنده** (Provider) - Required dropdown
   - **سازنده** (Creator) - Optional
   - **خانواده** (Family) - Optional
   - **حجم** (Size) - Optional
3. Click "اضافه کردن مدل" button

**Validation:**

- Model names must be unique per provider
- Cannot add duplicate models
- Error message if model already exists

#### Enable/Disable Model

1. Toggle the switch next to any model
2. Status updates immediately
3. Disabled models won't be available to users

---

## API Endpoints Reference

### User Management

```
POST /admin/listUsersWithPagination
Input: { page: number, pageSize: number, search?: string, role?: "admin"|"user" }
Returns: { users: [], total: number, page: number, pageSize: number, totalPages: number }

POST /admin/getUserDetails
Input: { userId: number }
Returns: User with stats (messageCount, documentCount, imageCount, etc.)

POST /admin/updateUserRole
Input: { userId: number, newRole: "admin"|"user" }
Returns: Updated user object

POST /admin/updateUserPassword
Input: { userId: number, newPassword: string }
Returns: { success: boolean }

POST /admin/deleteUser
Input: { userId: number }
Returns: { success: boolean }
```

### Model Management

```
POST /admin/listAllModels
Returns: Array of all LLM models

POST /admin/addModel
Input: { identifier: string, provider: string, creator?: string, family?: string, size?: string }
Returns: Created model object

POST /admin/toggleModelStatus
Input: { modelId: number, isEnabled: boolean }
Returns: Updated model object
```

---

## File Structure

### New Components

```
apps/web/src/components/admin/
├── users-table.tsx                 (Enhanced)
│   └── Features: pagination, search, filter, delete
├── user-detail-dialog.tsx          (New)
│   └── Shows user stats and info
├── delete-user-dialog.tsx          (New)
│   └── Confirmation with typed input
├── models-table.tsx                (Enhanced)
│   └── Features: provider/status filter, add model
└── add-model-dialog.tsx            (New)
    └── Form to register new models
```

### Backend Files

```
apps/server/src/
├── repositories/
│   ├── admin.ts                    (Enhanced)
│   │   └── New: getUsersWithPagination, getUserWithStats, deleteUser
│   └── llm-models.ts               (Enhanced)
│       └── New: addModel
└── procedures/
    └── admin.ts                    (Enhanced)
        └── New: listUsersWithPagination, getUserDetails, deleteUser, addModel
```

---

## Technical Stack

- **React 19** - UI framework
- **TanStack React Query** - Data fetching and caching
- **TanStack Router** - Routing
- **Tailwind CSS** - Styling
- **Shadcn/ui** - UI components
- **Zod** - Validation
- **ORPC** - Type-safe RPC calls
- **Sonner** - Toast notifications
- **Lucide Icons** - Icons

---

## Security Features

1. **Admin-Only Access**

   - All endpoints require `adminProcedure` middleware
   - Backend verification on every request
   - No client-side role checking only

2. **Data Protection**

   - Passwords never exposed in responses
   - User deletion cascades to all related data
   - Sensitive data redacted from logs

3. **Validation**

   - All inputs validated with Zod schemas
   - Duplicate model detection
   - Cannot delete only admin user
   - Confirmation required for deletions

4. **Audit Trail**
   - All changes logged
   - Error tracking and monitoring

---

## Troubleshooting

### Models Not Loading

- Check database connection
- Verify models exist in database
- Check browser console for errors

### User Deletion Fails

- Verify user is not the only admin
- Check database permissions
- Review server logs

### Add Model Dialog Issues

- Check model identifier is unique per provider
- Verify all required fields filled
- Check error message in toast notification

---

## Next Steps (Planned)

- [ ] Phase 3: System Settings panel
- [ ] Phase 4: Analytics Dashboard with metrics
- [ ] Phase 5: Audit logging and batch operations
- [ ] Add translations for new features
- [ ] Add comprehensive test suite
- [ ] Add performance monitoring

---

## Accessing the Admin Panel

### Prerequisites

- Admin role assigned to user account
- Database with users table

### URL

```
http://localhost:5173/admin
```

### First Admin Setup

If no admin exists, you need to manually create one:

```sql
-- Insert admin user directly (replace with actual values)
INSERT INTO users (username, password, role, created_at, updated_at)
VALUES ('admin', '[hashed_password]', 'admin', datetime('now'), datetime('now'));
```

---

## Support & Issues

For issues or questions:

1. Check server logs: `server.log`
2. Check browser console (F12)
3. Review this guide again
4. Check implementation plan: `ADMIN_PANEL_IMPLEMENTATION.md`

---

**Last Updated:** 2025-11-23
**Admin Panel Version:** 1.0 (Phase 1-2 Complete)
