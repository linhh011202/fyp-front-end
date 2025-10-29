# Google Login Setup Guide

## Overview

Your backend now uses OAuth's `state` parameter to preserve the redirect URL through the entire OAuth flow. This means the backend will correctly redirect back to your frontend after authentication.

## Current Setup

- **Frontend URL:** `http://localhost:3039` (or `http://20.196.72.17:3039`)
- **Backend URL:** `http://localhost:3000`
- **OAuth Flow:** Backend uses `state` parameter to preserve and use the frontend redirect URL

## Solution

### Step 1: Access Your App via the Correct URL

Make sure you access your application via the **frontend** URL:

❌ **Wrong:** `http://localhost:3000/sign-in` (this is your backend)
✅ **Correct:** `http://localhost:3039/sign-in` (this is your frontend)

Or if accessing remotely:
✅ **Correct:** `http://20.196.72.17:3039/sign-in`
✅ **Correct:** `http://dinh.koreacentral.cloudapp.azure.com:3039/sign-in`

### Step 2: Backend Environment Configuration

Your backend needs to know about your frontend URL. Make sure your backend has:

```env
# Backend .env file
FRONTEND_URL=http://localhost:3039
# Or for production/remote access:
# FRONTEND_URL=http://20.196.72.17:3039
# FRONTEND_URL=http://dinh.koreacentral.cloudapp.azure.com:3039

# Backend API URL (where backend is running)
BACKEND_URL=http://localhost:3000

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

### Step 3: Frontend Environment Configuration

Your frontend should have:

```env
# Frontend .env file
VITE_BACKEND_API_URL=http://localhost:3000
# Or for production/remote access:
# VITE_BACKEND_API_URL=http://20.196.72.17:3000
```

### Step 4: Update Google Cloud Console

In your Google Cloud Console OAuth settings, add these authorized redirect URIs:

1. `http://localhost:3000/auth/google/callback` (backend callback)
2. `http://20.196.72.17:3000/auth/google/callback` (if using remote backend)

## How the Flow Works (Updated with State Parameter)

```
User at http://localhost:3039/sign-in
              ↓
    Clicks Google Login Button
              ↓
Frontend sends to: http://localhost:3000/auth/google?redirect=http://localhost:3039/auth/google/callback
              ↓
Backend's GoogleAuthGuard encodes redirect into OAuth state:
  state = base64({ redirect: "http://localhost:3039/auth/google/callback" })
              ↓
Backend redirects to: Google OAuth (with state parameter)
              ↓
User grants permission on Google
              ↓
Google redirects to: http://localhost:3000/auth/google/callback?code=xxx&state=BASE64_DATA
              ↓
Backend decodes state to get original redirect URL
Backend processes authentication
              ↓
Backend redirects to: http://localhost:3039/auth/google/callback?token=xxx (or ?requiresPassword=true&...)
              ↓
Frontend React app handles the route
              ↓
User is signed in or sees password form
```

## Testing Steps

1. **Open your frontend** at `http://localhost:3039/sign-in`
2. **Open browser console** (F12) to see debug logs
3. **Click the Google icon**
4. Check the console logs for:
   ```
   Initiating Google Login:
   - Callback URL: http://localhost:3039/auth/google/callback
   - Backend URL: http://localhost:3000/auth/google?redirect=...
   - Current Origin: http://localhost:3039
   ```
5. After Google OAuth, you should be redirected to one of:
   - `http://localhost:3039/auth/google/callback?token=...` (existing user)
   - `http://localhost:3039/auth/google/callback?requiresPassword=true&email=...` (new user)

## Troubleshooting

### Issue: Redirected to port 3000 instead of 3039
**Cause:** You're accessing the backend directly instead of the frontend.
**Solution:** Always access `http://localhost:3039`, not `http://localhost:3000`.

### Issue: Backend doesn't redirect to frontend
**Cause:** Backend doesn't use the `redirect` query parameter.
**Solution:** Update your backend Google OAuth callback handler to use the `redirect` parameter from the initial request.

### Issue: "Redirect URI mismatch" error from Google
**Cause:** The redirect URI isn't registered in Google Cloud Console.
**Solution:** Add `http://localhost:3000/auth/google/callback` to authorized redirect URIs in Google Cloud Console.

### Issue: CORS errors
**Cause:** Backend doesn't allow requests from frontend origin.
**Solution:** Add CORS configuration to your backend:
```javascript
// Backend CORS config
app.use(cors({
  origin: ['http://localhost:3039', 'http://20.196.72.17:3039'],
  credentials: true
}));
```

## Production Deployment

For production, update all URLs to your production domain:

**Frontend:**
```env
VITE_BACKEND_API_URL=https://api.yourdomain.com
```

**Backend:**
```env
FRONTEND_URL=https://yourdomain.com
GOOGLE_CALLBACK_URL=https://api.yourdomain.com/auth/google/callback
```

**Google Cloud Console:**
- Add `https://api.yourdomain.com/auth/google/callback` to authorized redirect URIs
