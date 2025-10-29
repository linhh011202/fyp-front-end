# Google Login Testing Guide

## Quick Start Checklist

### ✅ Prerequisites

- [ ] Backend is running on `http://localhost:3000`
- [ ] Frontend is running on `http://localhost:3039`
- [ ] Backend has Google OAuth credentials configured in `.env`:
  ```env
  GOOGLE_CLIENT_ID=your_google_client_id
  GOOGLE_CLIENT_SECRET=your_google_client_secret
  GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
  ```
- [ ] Frontend has backend URL configured in `.env`:
  ```env
  VITE_BACKEND_API_URL=http://localhost:3000
  ```
- [ ] Google Cloud Console has `http://localhost:3000/auth/google/callback` registered as authorized redirect URI

### 🧪 Test Steps

#### Test 1: Existing User Login

1. **Open browser** and navigate to: `http://localhost:3039/sign-in`
   - ⚠️ Make sure you're on port **3039**, not 3000!

2. **Open DevTools Console** (F12 → Console tab)

3. **Click the Google icon** (the one with Google's logo)

4. **Check console logs**, you should see:
   ```
   Initiating Google Login:
   - Callback URL: http://localhost:3039/auth/google/callback
   - Backend URL: http://localhost:3000/auth/google?redirect=...
   - Current Origin: http://localhost:3039
   ```

5. **Sign in with Google** using an account that's already registered in your system

6. **Expected result:**
   - Redirected to: `http://localhost:3039/auth/google/callback?token=JWT_TOKEN&subscriptionEnd=...&isVerified=true`
   - Automatically logged in and redirected to dashboard (`/`)

#### Test 2: New User Registration

1. **Repeat steps 1-4** from Test 1

2. **Sign in with Google** using a NEW account (not registered in your system)

3. **Expected result:**
   - Redirected to: `http://localhost:3039/auth/google/callback?requiresPassword=true&email=...&name=...`
   - See a password form with your email and name pre-filled
   - Title: "Complete Your Registration"

4. **Enter a password:**
   - Password must be at least 8 characters
   - Confirm password must match
   - Click "Complete Registration"

5. **Expected result:**
   - Account created successfully
   - Automatically logged in and redirected to dashboard (`/`)

### 🐛 Troubleshooting

#### Issue: Still redirected to port 3000
**Symptoms:** URL shows `http://localhost:3000/auth/google/callback?code=...`

**Cause:** You accessed the backend directly instead of the frontend

**Solution:** 
- Always start at `http://localhost:3039/sign-in` (port 3039, NOT 3000)
- Clear browser cache and cookies
- Try in an incognito/private window

#### Issue: "Redirect URI mismatch" error from Google
**Symptoms:** Google shows error page saying redirect URI doesn't match

**Cause:** Backend callback URL not registered in Google Cloud Console

**Solution:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to: APIs & Services → Credentials
3. Click on your OAuth 2.0 Client ID
4. Add `http://localhost:3000/auth/google/callback` to "Authorized redirect URIs"
5. Save and try again

#### Issue: "Loading..." forever on callback page
**Symptoms:** Stuck on loading screen after Google redirect

**Cause:** Missing or invalid URL parameters

**Solution:**
1. Check browser URL - does it have `?token=...` or `?requiresPassword=true...`?
2. Open DevTools Console - check for errors
3. Check Network tab - see if any requests failed
4. Verify backend is running and accessible

#### Issue: "Invalid callback parameters" error
**Symptoms:** Error message shown on callback page

**Cause:** Backend didn't return expected parameters

**Solution:**
1. Check backend logs for errors
2. Verify Google OAuth credentials are correct
3. Make sure backend's `state` parameter handling is working
4. Check if backend successfully decoded the state parameter

#### Issue: Password form shows but registration fails
**Symptoms:** Can enter password but get error on submit

**Possible causes:**
- Password doesn't meet requirements (min 8 characters)
- Passwords don't match
- Backend validation error
- Network error

**Solution:**
1. Check browser console for error messages
2. Verify password meets requirements
3. Check backend logs for validation errors
4. Verify `/auth/google-register` endpoint is accessible

### 📊 Expected Console Logs

**When clicking Google icon:**
```
Initiating Google Login:
- Callback URL: http://localhost:3039/auth/google/callback
- Backend URL: http://localhost:3000/auth/google?redirect=http%3A%2F%2Flocalhost%3A3039%2Fauth%2Fgoogle%2Fcallback
- Current Origin: http://localhost:3039
```

**On callback page (existing user):**
```
(No errors, automatic redirect to dashboard)
```

**On callback page (new user):**
```
(Password form appears, no console errors)
```

### 🔍 Backend State Parameter Verification

The backend uses OAuth's `state` parameter to preserve your redirect URL. Here's how to verify it's working:

1. **Before Google redirect:** Check the URL sent to Google
   - Look at Network tab in DevTools
   - Find the redirect to `accounts.google.com`
   - Check if URL includes `&state=` parameter
   - The state should be a base64-encoded string

2. **On callback:** Check what backend received
   - Backend logs should show: "Decoded state from OAuth callback"
   - Should see your original redirect URL being used

### ✅ Success Indicators

**Existing User:**
- ✅ Redirected to dashboard immediately after Google login
- ✅ User info appears in the app (check navbar/header)
- ✅ Token stored in localStorage (`localStorage.getItem('accessToken')`)

**New User:**
- ✅ Password form appears with correct email and name
- ✅ Can set password (min 8 chars, matching confirmation)
- ✅ Redirected to dashboard after setting password
- ✅ Token stored in localStorage
- ✅ New account visible in backend database

### 🎯 Common Mistakes to Avoid

1. ❌ Accessing `http://localhost:3000` (backend) instead of `http://localhost:3039` (frontend)
2. ❌ Not having Google OAuth callback registered in Google Cloud Console
3. ❌ Using wrong environment variables in backend or frontend
4. ❌ Not running both backend and frontend servers
5. ❌ Using browser extension that blocks OAuth redirects
6. ❌ Having old cached data - always test in incognito mode first

### 🎉 Checklist for Successful Test

- [ ] Console logs show correct URLs (port 3039 for frontend)
- [ ] Google OAuth consent screen appears
- [ ] After granting permission, redirected back to frontend (port 3039)
- [ ] Either automatically logged in OR see password form
- [ ] Can access protected routes after login
- [ ] Token is stored in localStorage
- [ ] No console errors

### 📝 Notes

- The entire OAuth flow takes 3-5 seconds normally
- First time users will need to grant Google permissions
- Password form only appears for NEW users not in your database
- The `state` parameter ensures redirect URL is preserved through OAuth flow
- All redirects go through backend first, then to frontend
