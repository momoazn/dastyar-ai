# Basic Authentication Implementation Plan

## Database Schema Changes

1. **Add User Model**

   - Create `User` model with: `id`, `username`, `passwordHash`, `role` (admin/user), `createdAt`, `updatedAt`
   - Add `userId` foreign key to all existing entities: `ChatThread`, `Message`, `Translation`, `Summary`, `ImageThread`, `GeneratedImage`, `CodeAssistSession`, `CodeGeneration`, `CodeReview`
   - Update all relations to include user ownership

2. **Add UserRole Enum**
   - `admin`, `user`

## Server-Side Implementation

3. **Install Dependencies**

   - Add `jsonwebtoken` and `@types/jsonwebtoken` for JWT handling
   - Add `bcryptjs` and `@types/bcryptjs` for password hashing

4. **Create Auth Procedures**

   - `auth.register` - username/password registration, return JWT
   - `auth.login` - username/password login, return JWT
   - `auth.me` - get current user info from JWT

5. **Authentication Middleware**

   - Create `authMiddleware` that validates JWT from Authorization header
   - Extract user from token and add to context
   - Create `protectedProcedure` that requires authentication

6. **Update Context**

   - Add user session to context when authenticated
   - Update all existing procedures to use `protectedProcedure` instead of `publicProcedure`

7. **Password Security**
   - Hash passwords with bcrypt before storing
   - Validate password strength on registration

## Client-Side Implementation

8. **Auth Components**

   - Login form component with username/password fields
   - Register form component
   - Auth layout wrapper that shows login/register when not authenticated

9. **Auth State Management**

   - Create auth context/store using Jotai
   - Store JWT token in localStorage
   - Auto-login on app start if token exists

10. **API Integration**

    - Update ORPC client to include Authorization header with JWT
    - Handle token expiration and logout
    - Show login form when 401 responses received

11. **Route Protection**
    - Wrap main app routes with auth guard
    - Redirect to login when not authenticated
    - Show loading state during auth check

## Migration Strategy

12. **Database Migration**

    - No need for migrations, we will reset database

13. **Update Existing Code**
    - Modify all repository functions to filter by userId
    - Update all queries to include user context
    - Add userId to all create operations

## Security Considerations

14. **JWT Configuration**

    - Set appropriate token expiration (e.g., 24 hours)
    - Use secure secret key from environment variables
    - Implement refresh token pattern if needed later

15. **Input Validation**
    - Validate username/password format
    - Sanitize inputs to prevent injection attacks

This plan keeps the implementation simple as requested, focusing only on username/password auth with JWT tokens and user-scoped data. All entities will be tied to users, and the client will manage tokens in localStorage with bearer token headers.
