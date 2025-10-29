# Google Login Implementation

## Overview
This document describes the Google SSO integration implemented in the frontend application.

## Files Created/Modified

### New Files:
1. **`src/components/google-password-form/google-password-form.tsx`** - Password form component for new Google users
2. **`src/components/google-password-form/index.ts`** - Export file for the component
3. **`src/sections/auth/google-callback-view.tsx`** - View component that handles Google OAuth callback
4. **`src/pages/google-callback.tsx`** - Page component for the callback route

### Modified Files:
1. **`src/services/auth.service.ts`** - Added Google-related methods:
   - `initiateGoogleLogin()` - Redirects to backend Google OAuth endpoint
   - `googleRegister()` - Completes registration for new Google users with password
   - Added `GoogleRegisterRequest` and `GoogleRegisterResponse` types

2. **`src/sections/auth/sign-in-view.tsx`** - Added Google login button handler

3. **`src/routes/sections.tsx`** - Added route for Google callback (`/auth/google/callback`)

## How It Works

### Flow for Existing Users:
1. User clicks Google icon on sign-in page
2. Frontend redirects to backend: `GET /auth/google?redirect=<callback-url>`
3. Backend redirects to Google OAuth consent screen
4. User grants permission
5. Backend processes callback and redirects to: `<callback-url>?token=<jwt>&subscriptionEnd=<timestamp>&isVerified=<bool>`
6. Frontend stores auth data and redirects to dashboard

### Flow for New Users:
1. User clicks Google icon on sign-in page
2. Frontend redirects to backend: `GET /auth/google?redirect=<callback-url>`
3. Backend redirects to Google OAuth consent screen
4. User grants permission
5. Backend detects new user and redirects to: `<callback-url>?requiresPassword=true&email=<email>&name=<name>`
6. Frontend shows password form (`GooglePasswordForm` component)
7. User sets password
8. Frontend calls: `POST /auth/google-register` with email, name, and password
9. Backend creates account and returns JWT token
10. Frontend stores auth data and redirects to dashboard

## Environment Variables Required

Make sure your backend has these configured:
```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
VITE_BACKEND_API_URL=http://localhost:3000
```

## Usage

### Sign In Page
The Google login button is automatically integrated in the sign-in page. Click the Google icon to initiate the flow.

### Custom Integration
You can also trigger Google login programmatically:

```typescript
import { authService } from 'src/services/auth.service';

// Basic usage
authService.initiateGoogleLogin();

// With custom redirect
authService.initiateGoogleLogin('https://yourdomain.com/custom-callback');

// With app credentials
authService.initiateGoogleLogin(
  'https://yourdomain.com/custom-callback',
  'your-app-id',
  'your-app-secret'
);
```

## Testing

### Test Existing User:
1. Navigate to `/sign-in`
2. Click the Google icon
3. Sign in with a Google account that's already registered
4. Should redirect to dashboard with authentication

### Test New User:
1. Navigate to `/sign-in`
2. Click the Google icon
3. Sign in with a new Google account
4. Should show password form
5. Enter and confirm password
6. Should create account and redirect to dashboard

## Security Features

1. **Password Validation**: Minimum 8 characters required
2. **Password Confirmation**: Must match to prevent typos
3. **Error Handling**: Comprehensive error messages for all failure cases
4. **Loading States**: Prevents multiple submissions
5. **Secure Token Storage**: JWT tokens stored in localStorage

## Error Handling

The implementation handles various error scenarios:
- Missing callback parameters
- Invalid tokens
- Password validation failures
- Network errors
- Backend errors

All errors are displayed to users with helpful messages.

## Component Architecture

```
SignInView
  └─> handleGoogleLogin() → authService.initiateGoogleLogin()
                              ↓
                         Backend OAuth Flow
                              ↓
                      GoogleCallbackView
                              ├─> Existing User: Store token & redirect
                              └─> New User: Show GooglePasswordForm
                                      └─> handlePasswordSubmit()
                                          └─> authService.googleRegister()
                                              └─> Store token & redirect
```

## Notes

- The callback URL is automatically set to `<origin>/auth/google/callback`
- All authentication data is stored in localStorage
- The implementation follows the two-step flow as described in GOOGLE_SSO_FLOW.md
- Error states include a "Back to Sign In" button for easy recovery
