# Backend Fix Required: Force Google Account Selection

## The Problem

When users logout and click "Login with Google" again, they're automatically logged back in **without seeing Google's account selection screen**. This happens because the backend is not passing the `prompt=select_account` parameter to Google.

## What's Happening

### Current Flow (Broken):
```
Frontend → Backend (/auth/google?prompt=select_account) 
          ↓
Backend → Google (WITHOUT prompt parameter) ❌
          ↓
Google sees user is logged in → Auto-login without asking
          ↓
User logged back in automatically (BAD UX)
```

### Expected Flow (Fixed):
```
Frontend → Backend (/auth/google?prompt=select_account) 
          ↓
Backend → Google (WITH prompt=select_account) ✅
          ↓
Google shows "Choose an account" screen
          ↓
User must click their account (GOOD UX)
```

## Backend Fix Required

You need to update your backend's Google OAuth Guard to read the `prompt` query parameter and pass it to Google.

### Location
Your backend file (likely): `google-sso.guard.ts` or `google.strategy.ts`

### Current Code (What You Probably Have)

```typescript
// In your GoogleAuthGuard or similar
getAuthenticateOptions(context: ExecutionContext) {
  const request = context.switchToHttp().getRequest();
  const { redirect, appId, appSecret } = request.query;
  
  const state = JSON.stringify({
    redirect: redirect || null,
    appId: appId || null,
    appSecret: appSecret || null,
  });
  
  return {
    state: Buffer.from(state).toString('base64'),
  };
}
```

### Updated Code (What You Need)

```typescript
// In your GoogleAuthGuard or similar
getAuthenticateOptions(context: ExecutionContext) {
  const request = context.switchToHttp().getRequest();
  const { redirect, appId, appSecret, prompt } = request.query; // Add prompt here
  
  const state = JSON.stringify({
    redirect: redirect || null,
    appId: appId || null,
    appSecret: appSecret || null,
  });
  
  return {
    state: Buffer.from(state).toString('base64'),
    prompt: prompt || 'select_account', // Force account selection
    // OR if you want to always force it regardless of query param:
    // prompt: 'select_account',
  };
}
```

## Alternative: Always Force Account Selection

If you want to ALWAYS show the account picker (recommended):

```typescript
getAuthenticateOptions(context: ExecutionContext) {
  const request = context.switchToHttp().getRequest();
  const { redirect, appId, appSecret } = request.query;
  
  const state = JSON.stringify({
    redirect: redirect || null,
    appId: appId || null,
    appSecret: appSecret || null,
  });
  
  return {
    state: Buffer.from(state).toString('base64'),
    prompt: 'select_account', // Always force account selection
    access_type: 'offline', // Optional: if you need refresh tokens
  };
}
```

## If Using Passport Strategy

If you're using `passport-google-oauth20`, update your strategy configuration:

### Current Configuration:
```typescript
// In google.strategy.ts
constructor() {
  super({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    scope: ['email', 'profile'],
  });
}
```

### Updated Configuration:
```typescript
// In google.strategy.ts
constructor() {
  super({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    scope: ['email', 'profile'],
    // Add this:
    prompt: 'select_account', // Force account selection
  });
}
```

## Testing After Fix

### 1. Update Backend Code
Apply the fix above to your backend.

### 2. Restart Backend Server
```bash
npm run start:dev
```

### 3. Test the Flow
```bash
1. Go to http://localhost:3039/sign-in
2. Login with Google (should work as before)
3. Click Logout button
4. Click "Login with Google" again
5. ✅ You SHOULD see "Choose an account" screen from Google
6. ✅ Click your account to continue
```

### 4. Check Browser Console
Look for these logs:
```
🔐 Initiating Google Login:
- Callback URL: http://localhost:3039/auth/google/callback
- Full Backend URL: http://localhost:3000/auth/google?redirect=...&prompt=select_account
- Prompt parameter: select_account
⚠️  Backend MUST forward "prompt=select_account" to Google OAuth!
```

### 5. Check Network Tab
In DevTools → Network tab:
1. Find the redirect to `accounts.google.com`
2. Check the URL parameters
3. ✅ Should see `prompt=select_account` in the Google URL

## Google Prompt Options

You can use different values for the `prompt` parameter:

| Value | Behavior |
|-------|----------|
| `select_account` | Always show account picker (RECOMMENDED) |
| `consent` | Always show consent screen |
| `none` | Don't show any prompt (auto-login if possible) |
| Not set | Google decides based on session state |

**Recommended:** Use `select_account` for the best user experience.

## Expected Behavior After Fix

### Logout → Login Flow:
```
1. User clicks "Logout"
   - JWT token cleared ✅
   - Redirected to login page ✅

2. User clicks "Login with Google"
   - Redirected to Google ✅
   - Google shows "Choose an account" screen ✅
   - User must click their account ✅
   
3. After selecting account:
   - If already logged into Google: No password needed ✅
   - If not logged into Google: Password required ✅
   - User is logged into your app ✅
```

## Troubleshooting

### Issue: Still auto-logging in without account picker

**Check 1:** Is the backend receiving the prompt parameter?
```typescript
// Add logging in your guard
console.log('Query params:', request.query);
// Should show: { redirect: '...', prompt: 'select_account' }
```

**Check 2:** Is the backend passing it to Google?
```typescript
// Add logging in your guard
const options = this.getAuthenticateOptions(context);
console.log('OAuth options:', options);
// Should show: { state: '...', prompt: 'select_account' }
```

**Check 3:** Check the actual Google redirect URL
- Open DevTools → Network tab
- Click "Login with Google"
- Find the redirect to `accounts.google.com`
- Check if URL contains `&prompt=select_account`

### Issue: "Invalid prompt parameter" error

If you see an error about invalid prompt, check that you're using one of these valid values:
- `select_account`
- `consent`
- `none`

### Issue: Backend doesn't support custom options

If your Guard doesn't support passing custom options, you might need to:

1. **Option A:** Modify the Guard class to accept custom options
2. **Option B:** Create a custom Guard that extends the base Guard
3. **Option C:** Hardcode `prompt: 'select_account'` in the strategy configuration

## Quick Backend Code Examples

### NestJS with Passport:

```typescript
// google.strategy.ts
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ['email', 'profile'],
      prompt: 'select_account', // ADD THIS LINE
    });
  }
  
  // ... rest of your code
}
```

### NestJS with Custom Guard:

```typescript
// google-auth.guard.ts
import { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const { redirect, appId, appSecret, prompt } = request.query;
    
    const state = JSON.stringify({
      redirect: redirect || null,
      appId: appId || null,
      appSecret: appSecret || null,
    });
    
    return {
      state: Buffer.from(state).toString('base64'),
      prompt: prompt || 'select_account', // ADD THIS LINE
    };
  }
}
```

## Summary

**Frontend:** ✅ Already sends `prompt=select_account`

**Backend:** ❌ Needs to forward this parameter to Google

**Fix:** Add `prompt` parameter to your backend Google OAuth configuration

After applying the backend fix, users will always see the account selection screen when logging in with Google, even if they're already logged into Google. This provides a better logout experience! 🚀
