# E2E Testing Plan: Auth & Admin Flow

## Prerequisites

- App runs on localhost:3001 (web) with API proxy to localhost:3000 (server)
- Uses SQLite database (needs reset capability for clean tests)
- Farsi (Persian) UI - selectors must use text or test IDs

---

## Test Suite 1: Initial Setup & First User Registration

**Goal:** Verify first user becomes admin automatically

### Steps:

1. Reset database (clean state with no users)
2. Navigate to /register
3. Fill registration form:
   - Username: `testadmin`
   - Password: `password123`
   - Confirm: `password123`
4. Submit form
5. Assert:
   - Admin confirmation dialog appears with text: "شما به عنوان اولین کاربر، مدیر سیستم هستید"
   - After clicking confirm, redirected to home (/)
   - LocalStorage has auth-token set
   - User can access admin panel at /admin

---

## Test Suite 2: Regular User Registration

**Goal:** Verify subsequent users become regular users

### Steps:

1. Ensure admin user exists (from Suite 1)
2. Logout or use incognito
3. Navigate to /register
4. Register new user:
   - Username: `testuser`
   - Password: `userpass123`
   - Confirm: `userpass123`
5. Assert:
   - No admin confirmation dialog
   - Redirected to home
   - User CANNOT access /admin (should be redirected or see error)
   - Sidebar shows user role, not admin

---

## Test Suite 3: Login Flow

**Goal:** Test successful and failed login attempts

### Steps:

1. Navigate to /login
2. Test successful login:
   - Username: `testadmin`
   - Password: `password123`
   - Assert: Redirected to home, token stored
3. Test failed login:
   - Wrong password
   - Assert: Error message: "نام کاربری یا رمز عبور اشتباه است"
4. Test redirect preservation:
   - Navigate to /admin (unauthenticated)
   - Should redirect to /login?redirect=/admin
   - After login, should redirect back to /admin

---

## Test Suite 4: App Interaction After Login

**Goal:** Ensure authenticated users can use app features

### Steps:

1. Login as regular user
2. Chat functionality:
   - Navigate to /chat
   - Send a test message
   - Assert: Message appears in thread
3. Image generation:
   - Navigate to /image
   - Generate an image (mock if needed)
   - Assert: Image appears in gallery
4. Settings access:
   - Navigate to /settings
   - Assert: Can update username
   - Assert: Can update password (with current password verification)

---

## Test Suite 5: Admin Panel - User Management

**Goal:** Test admin-only features

### Steps:

1. Login as admin (testadmin)
2. Navigate to /admin
3. View users list:
   - Assert: Table shows both testadmin (admin) and testuser (user)
   - Role badges are correct
4. Create new user:
   - Click "افزودن کاربر"
   - Fill form: username `newuser`, password `newpass123`, role `user`
   - Assert: New user appears in list
5. Edit user:
   - Change newuser role to admin
   - Assert: Role badge updates
6. Delete user:
   - Delete newuser
   - Assert: Confirmation dialog appears
   - After confirm, user removed from list

---

## Test Suite 6: Admin Panel - Settings Management

**Goal:** Test admin settings functionality

### Steps:

1. In admin panel, locate Settings section
2. Update API keys:
   - Set OpenAI API key
   - Assert: Key is masked/saved
3. Toggle features:
   - Enable/disable image generation
   - Assert: Setting persists after refresh

---

## Test Suite 7: Password Management

**Goal:** Test password change flows

### Steps:

1. As regular user (testuser):
   - Go to /settings
   - Change password (requires current password)
   - Assert: Success message
   - Assert: Can login with new password
2. Admin password reset:
   - Admin can reset any user's password from admin panel
   - Assert: User can login with reset password

---

## Test Suite 8: Session & Logout

**Goal:** Test session persistence and logout

### Steps:

1. Login, verify token in localStorage
2. Refresh page
3. Assert: Still authenticated (auto-login via token)
4. Click logout
5. Assert: Token removed from localStorage
6. Assert: Redirected to /login
7. Assert: Cannot access protected routes

---

## Technical Implementation Notes

### Database Reset Strategy

**Option 1: Delete SQLite file**

```bash
rm apps/server/prisma/dev.db
```

**Option 2: Use migration reset**

```bash
bun run db:reset
```

### Test Data

| User     | Username    | Password      | Role            |
| -------- | ----------- | ------------- | --------------- |
| Admin    | `testadmin` | `password123` | admin           |
| User     | `testuser`  | `userpass123` | user            |
| New User | `newuser`   | `newpass123`  | user (variable) |

### Key UI Selectors (Farsi text)

| Element             | Persian Text                                 | Selector    |
| ------------------- | -------------------------------------------- | ----------- |
| Login link          | `ورود`                                       | Link/Button |
| Register link       | `ثبت نام`                                    | Link/Button |
| Username label      | `نام کاربری`                                 | Label       |
| Password label      | `رمز عبور`                                   | Label       |
| Admin confirmation  | `شما به عنوان اولین کاربر، مدیر سیستم هستید` | Dialog text |
| Add user button     | `افزودن کاربر`                               | Button      |
| Delete confirmation | (varies)                                     | Dialog text |
| Error message       | `نام کاربری یا رمز عبور اشتباه است`          | Error text  |

---

## Implementation Tips

### Playwright Test Structure Example

```typescript
import { test, expect } from "@playwright/test";

test.describe("Auth Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Reset database before each test
  });

  test("First user becomes admin", async ({ page }) => {
    await page.goto("/register");
    // ... test steps
  });
});
```

### Database Reset in Tests

```typescript
import { execSync } from "child_process";

async function resetDatabase() {
  execSync("rm -f apps/server/prisma/dev.db", { cwd: "/path/to/project" });
  // Re-run migrations if needed
}
```

### Handling Persian Text in Selectors

```typescript
// Using text content
await page.getByText("ورود").click();

// Using test IDs (recommended)
await page.getByTestId("login-button").click();
```

### Auth Token Verification

```typescript
// Check localStorage
const token = await page.evaluate(() => localStorage.getItem("auth-token"));
expect(token).toBeTruthy();

// Check API requests
await expect(page.request).toHaveResponse(/api\/auth\/me/);
```
