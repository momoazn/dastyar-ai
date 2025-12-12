# Admin Panel Implementation Plan

## Overview

Build a comprehensive admin panel for the Dastyar AI application to provide administrators with centralized management capabilities for users, models, system settings, and monitoring.

## Current State (Updated 2025-11-23)

✅ **Phase 1 & 2 COMPLETE**
- Admin route at `/admin` fully functional
- Admin layout component with tabs
- Enhanced admin procedures for user and model management
- Full RBAC with "admin" and "user" roles
- 7 admin components (5 new, 2 enhanced)
- 4 new backend procedures implemented

---

## Phase 1: Core User Management (Foundation) ✅ COMPLETE

### 1.1 Users Table Enhancement
**Status**: ✅ COMPLETE

**Components created/updated**:
- `UsersTable.tsx` - Complete table with advanced features ✅
  - ✅ Pagination support (10, 25, 50 items per page)
  - ✅ Search/filter by username (real-time)
  - ✅ Filter by role (admin/user)
  - ✅ Sort by creation date
  - ✅ User count display
  - ✅ Responsive layout

**Features**:
- Display all users with pagination (10, 25, 50 per page)
- Search by username
- Filter by role (admin/user)
- Sort by multiple columns
- Bulk actions (reset passwords, change roles)

**Backend Requirements - COMPLETED**:
- ✅ `getUsersWithPagination()` - Pagination, filtering, sorting
- ✅ `getUserWithStats()` - User activity tracking (7 metrics)
- ✅ Endpoints for pagination and filtering

### 1.2 User Detail Modal/Drawer
**Components created**: ✅
- `UserDetailDialog.tsx` - Complete user profile viewer ✅
  - ✅ Basic info (username, role, created date, updated date)
  - ✅ Activity metrics (7 different statistics):
    - Messages sent
    - Documents uploaded
    - Images generated
    - Translations made
    - Summaries created
    - Code runs executed
    - Chat threads created
  - ✅ Formatted timestamps (Persian locale)
  - ✅ Accessible dialog layout

**Backend Requirements - COMPLETED**:
- ✅ `admin.getUserDetails(userId)` - Implemented
- ✅ Returns user stats with counts

### 1.3 User Actions
**Components status**: ✅ COMPLETE
- `ChangeRoleDialog.tsx` - ✅ Fully functional (existing)
- `ResetPasswordDialog.tsx` - ✅ Fully functional (existing)
- `DeleteUserDialog.tsx` - ✅ NEW - Created with typed confirmation

**Implemented Procedures**:
- ✅ `updateUserRole` - Change user role with validation
- ✅ `updateUserPassword` - Reset password
- ✅ `deleteUser` - Safe deletion with admin check

**Features Implemented**:
- ✅ Change user role with confirmation
- ✅ Reset password functionality
- ✅ Delete users with safe confirmation (cannot delete only admin)
- ✅ Cascading delete cleanup

---

## Phase 2: Model Management ✅ COMPLETE

### 2.1 Models Table Enhancement
**Status**: ✅ COMPLETE

**Components updated**: ✅
- `ModelsTable.tsx` - Enhanced model management ✅
  - ✅ Display: ID, identifier, provider, family, size, status
  - ✅ Filter by provider (ollama, lmstudio, stable-diffusion, whisper)
  - ✅ Filter by status (enabled/disabled)
  - ✅ Combined filtering (provider + status)
  - ✅ Add model button with dialog trigger

**Features Implemented**:
- ✅ List all models with metadata
- ✅ Toggle enable/disable for individual models
- ✅ Provider filtering with 4 options
- ✅ Status filtering with 3 options
- ✅ Visual status badges and indicators
- ✅ Responsive layout

### 2.2 Add Model Dialog
**Components created**: ✅
- `AddModelDialog.tsx` - Register new models ✅
  - ✅ Provider selection (ollama, lmstudio, stable-diffusion, whisper)
  - ✅ Model identifier input (required)
  - ✅ Metadata fields (creator, family, size - optional)
  - ✅ Default enabled status on creation
  - ✅ Form validation
  - ✅ Error handling and feedback

**Backend Requirements - COMPLETED**:
- ✅ `admin.addModel(identifier, provider, metadata)` - Implemented
- ✅ Duplicate model validation
- ✅ Unique constraint on (identifier, provider) pair

### 2.3 Model Configuration (Planned for Future)
**Status**: Deferred - Basic CRUD operations complete
- `ModelConfigDialog.tsx` - Future enhancement for:
  - Provider settings
  - Model-specific parameters
  - Performance settings

**Backend Ready for Future**:
- Foundation: `updateModel()` exists in repository
- Can be extended for advanced configuration

---

## Phase 3: System Settings & Configuration

### 3.1 Settings Tab
**Components to create**:
- `SettingsPanel.tsx` - Centralized system settings
  - Application name
  - API configuration
  - File upload limits
  - Token expiration
  - Session management settings

**Sections**:
- General Settings (app name, description)
- Security Settings (token expiration, password policy)
- File Management (upload limits, allowed formats)
- AI Model Settings (default models, timeouts)
- Logging & Monitoring (log level, retention)

### 3.2 Configuration Management
**Backend Requirements**:
- Create repository: `config-settings`
- CRUD endpoints for settings
- Settings schema validation
- Default settings initialization

---

## Phase 4: Monitoring & Analytics

### 4.1 Dashboard Tab
**Components to create**:
- `AdminDashboard.tsx` - System overview
  - Key metrics cards:
    - Total users
    - Active users (last 7 days)
    - Models available (enabled/disabled count)
    - System health status
    - Total AI operations (messages, translations, summaries, images, code runs)
  - Activity charts:
    - Daily user activity (line chart)
    - Model usage by provider (pie chart)
    - AI operation distribution (bar chart)
  - Recent activities list
    - New user registrations
    - Model status changes
    - Failed operations

**Components to create**:
- `MetricsCard.tsx` - Reusable metric display
- `ActivityChart.tsx` - Chart wrapper
- `ActivityLog.tsx` - Recent events list

**Backend Requirements**:
- Create endpoints:
  - `admin.getDashboardStats()` - Overall metrics
  - `admin.getActivityMetrics(timeRange)` - Usage metrics
  - `admin.getActivityLog(limit, offset)` - Recent activity

### 4.2 System Health Monitoring
**Components to create**:
- `HealthStatus.tsx` - Service status monitor
  - API server status
  - Database status
  - Whisper server status (if applicable)
  - Last activity timestamp

**Backend Requirements**:
- Create endpoint: `admin.getSystemHealth()`
- Service status checks

---

## Phase 5: Advanced Features

### 5.1 Audit Logging
**Database Table**:
```typescript
auditLogs: {
  id: integer (PK)
  adminId: integer (FK users)
  action: string (UPDATE_USER_ROLE, DELETE_USER, etc.)
  targetType: string (USER, MODEL, SETTING, etc.)
  targetId: integer
  oldValues: json
  newValues: json
  reason: string (optional)
  createdAt: timestamp
}
```

**Features**:
- Log all admin actions with before/after values
- Audit log viewer with search and filter
- Export audit logs

### 5.2 Batch Operations
**Components to create**:
- `BulkActionsPanel.tsx` - Execute operations on multiple items
  - Bulk password reset for users
  - Bulk role change
  - Bulk model enable/disable
  - Export user list
  - Export activity logs

### 5.3 System Maintenance
**Components to create**:
- `MaintenancePanel.tsx` - System cleanup and optimization
  - Clear old logs (configurable retention)
  - Database cleanup (orphaned documents, etc.)
  - Cache management
  - Backup management

---

## Directory Structure (Current State)

### ✅ Implemented (Phases 1-2)
```
apps/web/src/
├── components/
│   └── admin/
│       ├── users-table.tsx                  [✅ ENHANCED - Phase 1]
│       ├── user-detail-dialog.tsx           [✅ NEW - Phase 1]
│       ├── delete-user-dialog.tsx           [✅ NEW - Phase 1]
│       ├── change-role-dialog.tsx           [✅ EXISTS]
│       ├── reset-password-dialog.tsx        [✅ EXISTS]
│       ├── models-table.tsx                 [✅ ENHANCED - Phase 2]
│       └── add-model-dialog.tsx             [✅ NEW - Phase 2]

apps/server/src/
├── repositories/
│   ├── admin.ts                             [✅ ENHANCED - Phase 1]
│   └── llm-models.ts                        [✅ ENHANCED - Phase 2]
└── procedures/
    └── admin.ts                             [✅ ENHANCED - Phases 1-2]
```

### 🔄 Planned (Phases 3-5)
```
apps/web/src/
├── components/
│   └── admin/
│       ├── settings-panel.tsx               [PLANNED - Phase 3]
│       ├── dashboard.tsx                    [PLANNED - Phase 4]
│       ├── metrics-card.tsx                 [PLANNED - Phase 4]
│       ├── activity-chart.tsx               [PLANNED - Phase 4]
│       ├── activity-log.tsx                 [PLANNED - Phase 4]
│       ├── health-status.tsx                [PLANNED - Phase 4]
│       ├── audit-logs-viewer.tsx            [PLANNED - Phase 5]
│       ├── bulk-actions-panel.tsx           [PLANNED - Phase 5]
│       └── maintenance-panel.tsx            [PLANNED - Phase 5]

apps/server/src/
├── database/
│   └── schema/
│       └── Add audit_logs table             [PLANNED - Phase 5]
├── repositories/
│   ├── system-settings.ts                   [PLANNED - Phase 3]
│   └── audit-logs.ts                        [PLANNED - Phase 5]
└── procedures/
    ├── system.ts                            [PLANNED - Phase 3]
    └── audit.ts                             [PLANNED - Phase 5]
```

---

## Implementation Status

### ✅ Completed (2025-11-23)

1. **Phase 1 (COMPLETE)**: Core User Management
   - ✅ Enhanced users table with pagination/search/filter
   - ✅ User detail modal with stats
   - ✅ Delete user functionality with safety checks

2. **Phase 2 (COMPLETE)**: Model Management
   - ✅ Enhanced models table with filtering
   - ✅ Add model dialog with validation
   - ✅ Duplicate detection

### 📋 Planned

3. **Phase 3 (NEXT)**: System Settings
   - [ ] Settings panel
   - [ ] Database settings table
   - [ ] Configuration management ORPC procedures

4. **Phase 4**: Monitoring & Analytics
   - [ ] Dashboard with metrics cards
   - [ ] Activity charts and trends
   - [ ] System health monitoring

5. **Phase 5**: Advanced Features
   - [ ] Audit logging system
   - [ ] Batch operations
   - [ ] Maintenance tools
   - [ ] Export functionality

---

## Technology Stack

- **Frontend**: React 19, TanStack Router, Tailwind CSS
- **UI Components**: Shadcn/ui (existing)
- **Data Fetching**: ORPC client (existing)
- **Charts**: Recharts (to be added if not present)
- **Backend**: Bun/Hono, Drizzle ORM, SQLite
- **Validation**: Zod

---

## API Endpoint Design

### User Management
- `GET /admin/users` - List users (paginated, filtered)
- `GET /admin/users/:id` - Get user details
- `PUT /admin/users/:id/role` - Update user role
- `PUT /admin/users/:id/password` - Reset password
- `DELETE /admin/users/:id` - Delete user

### Models
- `GET /admin/models` - List all models
- `POST /admin/models` - Add new model
- `PUT /admin/models/:id` - Update model config
- `PATCH /admin/models/:id/status` - Toggle enable/disable

### System
- `GET /admin/dashboard/stats` - Dashboard metrics
- `GET /admin/health` - System health status
- `GET /admin/activity-logs` - Activity log entries

### Audit
- `GET /admin/audit-logs` - Audit log viewer
- `GET /admin/audit-logs/export` - Export audit logs

### Settings
- `GET /admin/settings` - Get all settings
- `PUT /admin/settings` - Update settings
- `GET /admin/settings/:key` - Get specific setting

---

## Security Considerations

1. **Authorization**
   - All admin endpoints protected with `adminProcedure`
   - Verify admin role on backend for every sensitive operation
   - No client-side role checking only

2. **Audit Trail**
   - Log all admin actions
   - Include admin user ID, timestamp, and changes
   - Immutable audit logs

3. **Data Protection**
   - Password resets should generate temporary passwords
   - User deletion should soft-delete by default
   - Sensitive data (passwords, configs) never exposed in logs

4. **Rate Limiting**
   - Implement rate limiting on admin endpoints
   - Monitor for suspicious bulk operations

---

## Testing Strategy

1. **Unit Tests**: Repository and procedure logic
2. **Integration Tests**: Admin endpoint workflows
3. **E2E Tests**: Admin panel user flows
4. **Performance Tests**: Dashboard metrics loading time
5. **Security Tests**: Authorization bypass attempts

---

## Success Metrics

### ✅ Phase 1-2 Complete
- [x] All users can be viewed and managed
- [x] User pagination, search, and filtering works
- [x] User detail modal shows activity metrics
- [x] Users can be deleted safely (prevents only admin deletion)
- [x] Models can be toggled on/off
- [x] Models can be filtered by provider and status
- [x] New models can be added with duplicate detection
- [x] All actions require admin role verification

### ⏳ Phase 3-5 Planned
- [ ] Admin dashboard shows accurate metrics
- [ ] Settings can be viewed and updated
- [ ] Audit trail tracks all admin actions
- [ ] Admin panel loads in < 2 seconds
- [ ] 95%+ test coverage on admin procedures
- [ ] All admin features fully documented and tested

---

## Implementation Notes

### Completed Standards
- ✅ Uses existing UI component library (shadcn/ui)
- ✅ Follows project's accessibility guidelines (Ultracite)
- ✅ Responsive design for mobile admin access implemented
- ✅ Loading states and error handling comprehensive
- ✅ Optimistic updates where appropriate
- ✅ ORPC used for type-safe API calls
- ✅ Full Persian language support (RTL)
- ✅ Comprehensive documentation provided

### For Future Phases
- Consider dark mode support (if app has it)
- Add performance monitoring
- Implement advanced filtering options
- Add bulk operation optimizations
- Consider real-time updates for admin panel metrics
