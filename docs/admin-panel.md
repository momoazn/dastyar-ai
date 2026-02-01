# Admin Panel Documentation

## 🎯 Overview

The Dastyar AI Admin Panel provides comprehensive management capabilities for system administrators, including user management, model administration, and system settings configuration.

## ✅ Completed Features

### Phase 1: User Management
- **User Listing**: Paginated (10/25/50 per page), searchable, filterable by role
- **User Details**: View activity metrics (messages, documents, images, translations, summaries, code runs, threads)
- **User Actions**: Change role, reset password, delete with confirmation
- **Safety Features**: Prevents deleting only admin user

### Phase 2: Model Management
- **Model Listing**: View all LLM models with status indicators
- **Filtering**: By provider (Ollama, LM Studio, Stable Diffusion, Whisper) and status (enabled/disabled)
- **Model Toggle**: Enable/disable models with single switch
- **Add Models**: Register new models with optional metadata (creator, family, size)
- **Duplicate Detection**: Prevents adding duplicate models per provider

### Phase 3: System Settings
- **Settings Panel**: Manage 15+ configuration settings in 5 organized sections
- **General Settings**: Application name and description
- **Security Settings**: Token expiration, session timeout, password policies
- **File Management**: Max file size, allowed file types
- **AI Model Settings**: Response timeout, feature toggles (transcription, translation, code, images)
- **Rate Limiting**: Enable/disable and requests per minute threshold
- **Change Tracking**: Visual indicator for unsaved changes
- **Database Storage**: Persistent key-value settings with JSON values

## 🚀 Quick Start

### For Administrators

**Access Admin Panel:**
1. Login as admin user
2. Navigate to `/admin`
3. Use Users, Models, or Settings tabs

**Common Tasks:**
- Search and filter users
- View user activity metrics
- Change user roles
- Delete users (with confirmation)
- Add new AI models
- Toggle model status
- Configure system settings

### For Developers

**Key Files:**
- Frontend: `apps/web/src/components/admin/`
- Backend: `apps/server/src/procedures/admin.ts`
- Repositories: `apps/server/src/repositories/`
- Database: `apps/server/src/database/schema/`

**Adding New Features:**
1. Create component in `apps/web/src/components/admin/`
2. Add ORPC procedure in `apps/server/src/procedures/admin.ts`
3. Add repository function if needed
4. Update Persian translations in `apps/web/src/lib/persian-texts.ts`

## 🏗️ Architecture

```
Admin Panel (/admin)
├── Users Tab          │      Models Tab       │    Settings Tab
│  ├─ UsersTable      │      ├─ ModelsTable  │      ├─ SettingsPanel
│  ├─ Search/Filter   │      ├─ Filtering    │      ├─ General Settings
│  ├─ Pagination      │      ├─ Toggle       │      ├─ Security Settings
│  └─ Detail Modal    │      └─ Add Dialog   │      ├─ File Management
                           │                  │      ├─ AI Model Settings
                           │                  │      └─ Rate Limiting
                           └───────────────────┴─────────────────────
                                      │
                             ORPC API Procedures
                                      │
                             Repository Functions
                                      │
                               SQLite Database
```

## 🔐 Security

- **Authentication**: All endpoints require admin role, JWT token authentication
- **Authorization**: Role-based access control, backend-side validation
- **Data Protection**: Passwords never exposed, input validation with Zod schemas
- **Safety Features**: Cannot delete only admin, confirmation dialogs, typed confirmation

## 📊 Implementation Details

### Frontend Components
- `users-table.tsx` - Main users list with pagination
- `user-detail-dialog.tsx` - User stats modal
- `delete-user-dialog.tsx` - Deletion confirmation
- `models-table.tsx` - Models list with filters
- `add-model-dialog.tsx` - Add new model form
- `settings-panel.tsx` - System settings management
- `change-role-dialog.tsx` - Change user role
- `reset-password-dialog.tsx` - Reset user password

### Backend Procedures
- `listUsersWithPagination` - Get users with filters & pagination
- `getUserDetails` - Get user with stats
- `deleteUser` - Delete user safely
- `updateUserRole` - Change role
- `updateUserPassword` - Reset password
- `addModel` - Register new model
- `toggleModelStatus` - Enable/disable model
- `listAllModels` - Get all models
- Settings procedures for system configuration

### Database Schema
- `users` - User accounts and roles
- `llm_models` - AI model configurations
- `system_settings` - Key-value settings storage
- Related tables for activity tracking

## 🧪 Testing

### Manual Testing Checklist

**User Management:**
- [ ] List users with pagination
- [ ] Search users by username
- [ ] Filter users by role
- [ ] View user details and stats
- [ ] Change user role
- [ ] Reset user password
- [ ] Delete user (with confirmation)
- [ ] Verify cannot delete only admin

**Model Management:**
- [ ] List all models
- [ ] Filter by provider
- [ ] Filter by status
- [ ] Toggle model enable/disable
- [ ] Add new model
- [ ] Verify duplicate detection

**Settings Management:**
- [ ] View all settings
- [ ] Update general settings
- [ ] Configure security settings
- [ ] Set file management limits
- [ ] Configure AI model settings
- [ ] Set up rate limiting

## 🔄 Future Roadmap

### Phase 4: Analytics Dashboard (Planned)
- Key metrics cards (total users, active users, models, etc.)
- Activity charts (daily trends, usage by provider, etc.)
- System health status
- Recent activity log

### Phase 5: Advanced Features (Planned)
- Audit logging system
- Batch operations (bulk user/model management)
- System maintenance tools
- Export functionality
- Login history viewer

## 📞 Support & Troubleshooting

### Common Issues
- **Models not loading**: Check database connection, verify models exist
- **User deletion fails**: Verify user is not only admin, check permissions
- **Settings not saving**: Check database connection, review server logs

### Debugging
1. Open browser DevTools (F12)
2. Check Network tab for ORPC requests
3. Check Console tab for errors
4. Review `server.log` file
5. Use `bun run db:studio` to inspect database

---

**Status**: ✅ Phases 1-3 Complete (60% overall)
**Last Updated**: 2025-11-23
**Maintained By**: Development Team