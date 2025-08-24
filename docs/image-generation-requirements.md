# Image Generation Feature Requirements

## Overview

This document outlines the comprehensive requirements to complete the image generation feature with proper file storage, sidebar integration, and improved UI/UX.

## Current State Analysis

- **Database:** `generatedImages` table stores base64 images (needs file path storage)
- **API:** Basic CRUD operations exist in `apps/server/src/api/procedures/images.ts`
- **Frontend:** Route exists at `apps/web/src/routes/image.tsx` with basic functionality
- **Storage:** Images currently stored as base64 in SQLite database
- **Sidebar:** No image list integration exists

## 1. Database Schema Updates ✅

**Current Status:** Schema exists but needs modification for file storage

**Requirements:**

- Modify `generatedImages` table in `apps/server/src/database/schema/index.ts`
- Change `imageData` field from `text` (base64) to `filePath` (string)
- Add `fileName` field for unique file naming
- Keep existing fields: `id`, `prompt`, `negativePrompt`, `settings`, `createdAt`, `updatedAt`

**Migration needed:** Convert existing base64 data to files during upgrade

## 2. File Storage System

**Requirements:**

### Configuration

- Add `IMAGES_DIR` environment variable (default: `./generated-images/`)
- Integrate with centralized config system in `apps/server/src/config/index.ts`
- Support relative and absolute paths

### File Operations

- **Naming Convention:** `{timestamp}-{id}.png` for uniqueness
- **Directory Structure:**
  ```
  generated-images/
  ├── 2024/01/        # Year/Month organization
  ├── thumbnails/     # Generated thumbnails
  └── temp/          # Temporary generation files
  ```
- **File Management:**
  - Save generated images to configured directory
  - Generate thumbnails (256x256) for performance
  - Implement cleanup for orphaned files
  - Add file validation (format, size limits)
  - Handle disk space monitoring

### Storage Service

Create `apps/server/src/services/image-storage.ts`:

- `saveImage(base64Data, metadata)` - Save image file and return path
- `deleteImage(filePath)` - Remove image file and thumbnail
- `cleanupOrphaned()` - Remove files without database records
- `getImageUrl(id)` - Generate serving URL for image

## 3. Server API Enhancements

**Current Location:** `apps/server/src/api/procedures/images.ts`

### Updated Endpoints

- **`generate`** - Save files instead of base64 in database
- **`get`** - Return file URLs instead of base64 data
- **`list`** - Include thumbnail URLs for performance
- **`delete`** - Remove both database record and files
- **`clear`** - Clean up all database records and files

### New Endpoints

- **`serve`** - Static file serving endpoint `GET /api/images/{id}/file`
- **`cleanup`** - Administrative endpoint for file cleanup

### Error Handling

- File system permission validation
- Disk space checks before generation
- Graceful fallback when files missing
- Proper HTTP status codes for file operations

## 4. Sidebar Image List Component

**Requirements:**

### Component Structure

Create `apps/web/src/components/sidebar/images-sidebar.tsx`:

- Grid layout with thumbnail previews
- Show generation date and time
- Display truncated prompts as captions
- Implement click-to-select functionality
- Context menu for actions (delete, download, share)

### Features

- **Thumbnail Display:** 64x64 pixel thumbnails with hover effects
- **Infinite Scroll:** Load images in batches of 20
- **Search/Filter:** Filter by prompt text or date range
- **Selection State:** Highlight currently selected image
- **Loading States:** Skeleton loaders for smooth UX
- **Empty State:** Friendly message when no images exist

### Integration

- Add to `apps/web/src/components/sidebar/index.ts`
- Integrate with `AppSidebar` component
- Add navigation item for images in `nav.ts`

## 5. Enhanced Image Route (`/image.tsx`)

**Current Location:** `apps/web/src/routes/image.tsx`

### Image Preview Section

**Requirements:**

- **Full-size Display:** Responsive image viewer with proper aspect ratio
- **Zoom Functionality:** Click to zoom, pinch-to-zoom on mobile
- **Navigation:** Previous/Next arrows for browsing between images
- **Metadata Panel:** Collapsible panel showing:
  - Full prompt and negative prompt
  - Generation settings (steps, CFG scale, sampler, etc.)
  - Creation date and time
  - File size and dimensions
- **Fullscreen Mode:** Dedicated fullscreen view with ESC key support
- **Loading States:** Skeleton loader while image loads

### Generation Controls Enhancement

**Requirements:**

- **Preset Templates:** Quick-select common styles (portrait, landscape, artistic, etc.)
- **Advanced Settings:** Collapsible section for power users
- **Parameter Validation:** Real-time feedback on parameter values
- **Settings Persistence:** Remember user preferences across sessions
- **Progress Tracking:** Real-time progress bar during generation

### Improved Layout

- **Responsive Design:** Optimal layout for desktop, tablet, mobile
- **Split View:** Image preview on left, controls on right (desktop)
- **Stack View:** Stacked layout for mobile devices
- **Sticky Controls:** Keep generation form accessible while scrolling

## 6. UI/UX Polish Requirements

### Visual Improvements

- **Modern Design System:**

  - Consistent color palette with proper contrast ratios
  - Unified spacing system (4px grid)
  - Modern typography hierarchy
  - Subtle shadows and border radius for depth

- **Interactive Elements:**

  - Hover states for all interactive components
  - Smooth transitions (200ms ease-out)
  - Loading animations with skeleton loaders
  - Toast notifications with better messaging

- **Theme Support:**
  - Enhanced dark mode with proper contrast
  - Light mode optimization
  - System theme preference detection

### Animation & Transitions

- **Image Loading:** Progressive enhancement with blur-to-sharp effect
- **Page Transitions:** Smooth navigation between images
- **Form Interactions:** Animated form validation feedback
- **Sidebar Animations:** Slide-in/slide-out with proper easing

### Accessibility

- **Screen Reader Support:** ARIA labels for all interactive elements
- **Keyboard Navigation:** Tab order and keyboard shortcuts
- **Focus Management:** Proper focus indicators and management
- **High Contrast:** Support for high contrast mode
- **Reduced Motion:** Respect user's reduced motion preferences

## 7. Additional Features

### Image Collections

- **Folders/Albums:** Organize images into collections
- **Tagging System:** Add custom tags for categorization
- **Advanced Search:** Search by prompt, tags, date, settings
- **Bulk Operations:** Select multiple images for batch actions

### Export & Sharing

- **Individual Download:** High-quality PNG download
- **Bulk Export:** ZIP download of selected images
- **Metadata Export:** JSON export with generation settings
- **Share Links:** Generate shareable links for images
- **Print Support:** Optimized print layout

### Performance Optimizations

- **Lazy Loading:** Load images only when needed
- **Thumbnail Caching:** Client-side thumbnail cache
- **Background Generation:** Queue system for multiple generations
- **Memory Management:** Efficient image loading and disposal

## 8. Configuration & Deployment

### Environment Configuration

- **Storage Paths:** Configurable via environment variables
- **Generation Limits:** Max images per user/session
- **File Size Limits:** Maximum file size and resolution
- **Cleanup Policies:** Automatic cleanup of old images

### Production Deployment

- **Binary Integration:** Ensure image storage works with compiled binary
- **Asset Management:** Include image directories in deployment
- **Backup Strategy:** Regular backup of generated images
- **Migration Scripts:** Handle database schema updates

### Monitoring & Maintenance

- **Disk Usage:** Monitor storage space consumption
- **Performance Metrics:** Track generation times and success rates
- **Error Logging:** Comprehensive error tracking
- **Health Checks:** Validate file system access and permissions

## 9. Error Handling & Validation

### File System Operations

- **Permission Checks:** Validate read/write access to storage directories
- **Disk Space:** Check available space before generation
- **File Corruption:** Validate image files and handle corruption
- **Network Issues:** Handle temporary storage unavailability

### User Input Validation

- **Prompt Validation:** Length limits and content filtering
- **Parameter Ranges:** Enforce valid ranges for all generation parameters
- **File Uploads:** If supporting custom inputs, validate file types and sizes
- **Rate Limiting:** Prevent abuse with reasonable generation limits

### Graceful Degradation

- **Offline Mode:** Cache thumbnails for offline viewing
- **Fallback UI:** Alternative interface when storage unavailable
- **Progressive Enhancement:** Core functionality without advanced features

## 10. Testing Strategy

### Unit Tests

- **File Operations:** Test all storage service functions
- **API Endpoints:** Validate all image-related procedures
- **Component Logic:** Test React components and hooks

### Integration Tests

- **End-to-End Flow:** Complete image generation workflow
- **Database Operations:** Test schema changes and migrations
- **File System Integration:** Validate storage and retrieval

### Performance Tests

- **Load Testing:** Multiple concurrent generations
- **Large Collections:** UI performance with 1000+ images
- **Memory Usage:** Prevent memory leaks in long sessions

### Error Scenarios

- **Storage Failures:** Test behavior when disk full or permissions denied
- **Network Issues:** Handle API timeouts and connectivity problems
- **Corrupt Data:** Recovery from corrupted images or database entries

## Implementation Priority

### Phase 1: Core Infrastructure

1. Database schema migration
2. File storage service implementation
3. Updated API endpoints
4. Basic file serving

### Phase 2: Frontend Integration

1. Sidebar image list component
2. Enhanced image route with file URLs
3. Basic UI improvements
4. Error handling

### Phase 3: Polish & Features

1. Advanced UI/UX improvements
2. Animation and transitions
3. Additional features (collections, export)
4. Performance optimizations

### Phase 4: Production Ready

1. Comprehensive testing
2. Documentation
3. Deployment configuration
4. Monitoring and maintenance tools

## Success Criteria

- ✅ Images stored as files instead of database base64
- ✅ Responsive sidebar with thumbnail navigation
- ✅ Polished image viewing experience with zoom and metadata
- ✅ Smooth generation workflow with real-time feedback
- ✅ Proper error handling and graceful degradation
- ✅ Accessible interface supporting keyboard navigation
- ✅ Performance optimized for large image collections
- ✅ Production-ready deployment configuration
