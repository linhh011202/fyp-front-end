# Understanding Authentication Sessions

## The Issue You're Experiencing

When you mentioned "I can close browser and open another inprivate browser, it automatically logs in," there are actually **two different session types** at play:

### 1. Your Application Session (JWT Token)
- **Stored in:** `localStorage`
- **Persists:** Until manually cleared or token expires
- **Scope:** Only within the same browser profile
- **Incognito/Private:** Each incognito window has its own separate `localStorage`

### 2. Google OAuth Session
- **Stored in:** Google's cookies (accounts.google.com domain)
- **Persists:** Until you sign out from Google
- **Scope:** All tabs in the same browser profile
- **Incognito/Private:** Separate from normal browsing, but shared across incognito tabs

## What's Actually Happening

### Scenario 1: Same Browser, Incognito Window
```
1. You log in normally → JWT token in localStorage
2. Close browser
3. Open incognito window → NEW localStorage (no token)
4. Go to your app → Should show login page
5. Click "Login with Google" → Google MAY auto-select account if you didn't sign out from Google
```

**Result:** You're NOT automatically logged into your app, but Google may skip the account selection screen.

### Scenario 2: Same Browser Profile
```
1. You log in → JWT token in localStorage
2. Close browser
3. Open browser again (same profile) → localStorage persists
4. Go to your app → Automatically logged in (because token is still there)
```

**Result:** You ARE automatically logged into your app because the JWT token persists in localStorage.

## How to Test Properly

### Test 1: True Incognito Test (No Auto-Login Should Occur)
```bash
1. Open incognito/private window
2. Go to http://localhost:3039/sign-in
3. You should see login page (NOT auto-logged in)
4. localStorage should be empty
5. Click Google login
6. Google MAY remember your account (this is Google's behavior, not your app's)
7. After OAuth, you'll be logged into YOUR app
```

### Test 2: Same Browser Profile (Auto-Login WILL Occur)
```bash
1. Log in normally
2. Close browser
3. Open browser again
4. Go to http://localhost:3039
5. You're automatically logged in (because JWT token persists)
```

### Test 3: Clear Everything
```bash
1. Open DevTools (F12)
2. Go to Application tab
3. Storage → localStorage → delete all items
4. Refresh page
5. You should be logged out
```

## Solutions

### Solution 1: Force Google Account Selection (Already Implemented)
The code now adds `prompt=select_account` to the OAuth URL, which forces Google to show the account selector every time, even if Google remembers you.

**Code:**
```typescript
url += '&prompt=select_account';
```

**Effect:**
- ✅ Google will ALWAYS show account selector
- ✅ Prevents silent auto-login via Google
- ✅ User must explicitly choose which account to use

### Solution 2: Add Logout Functionality
You need a logout button that clears the JWT token from localStorage.

**Where to add:** Navbar, user menu, or settings

**Implementation:** Already exists in your auth service:
```typescript
authService.clearAuthData(); // Clears localStorage
router.push('/sign-in'); // Redirect to login
```

### Solution 3: Use Session Storage Instead (Optional)
If you want tokens to be cleared when browser closes:

**Change:** Use `sessionStorage` instead of `localStorage`
- `sessionStorage` is cleared when the browser tab/window closes
- `localStorage` persists until manually cleared

**Note:** This would require users to log in again every time they open the app.

### Solution 4: Token Expiration (Backend)
Make sure your backend JWT tokens have an expiration time (e.g., 7 days, 30 days).

**Backend should set:**
```javascript
jwt.sign(payload, secret, { expiresIn: '7d' }); // Expires in 7 days
```

## Testing Scenarios

### ✅ Expected Behavior

| Scenario | Expected Result |
|----------|----------------|
| Incognito window (first time) | Show login page, no auto-login |
| Same browser profile after close | Auto-login (JWT persists) |
| After clicking logout | Show login page, must log in again |
| Token expired | Show login page, must log in again |
| Different browser | Show login page, no auto-login |
| Same browser, different profile | Show login page, no auto-login |

### ❌ Unexpected Behavior

| Scenario | If This Happens | Cause |
|----------|-----------------|-------|
| Incognito window auto-logs in | Check if localStorage has token | Bug in auth check |
| Google skips consent screen | Normal behavior | Google remembers account |
| Can't log out | Logout doesn't clear localStorage | Missing clearAuthData() call |

## How to Implement Proper Logout

### 1. Add Logout Button to Your App

**Example in Navbar:**
```tsx
import { useRouter } from 'src/routes/hooks';
import { authService } from 'src/services/auth.service';

function Navbar() {
  const router = useRouter();
  
  const handleLogout = async () => {
    try {
      // Optional: Call backend logout endpoint
      const token = authService.getAccessToken();
      if (token) {
        await authService.logout(token);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local data
      authService.clearAuthData();
      router.push('/sign-in');
    }
  };
  
  return (
    <button onClick={handleLogout}>
      Logout
    </button>
  );
}
```

### 2. Test Logout Flow
```bash
1. Log in with Google
2. Click logout button
3. Should redirect to /sign-in
4. localStorage should be empty
5. Clicking back button should NOT auto-log you back in
```

## Understanding Google's Behavior

### Why Google Remembers You
- Google stores its own session cookies
- These are separate from your app's JWT token
- Google may auto-select your account to improve UX
- This is NORMAL and EXPECTED OAuth behavior

### How to Force Google to Forget
```bash
1. Go to accounts.google.com
2. Sign out from Google
3. Or use different browser profile
4. Or clear all browser cookies
```

### Difference Between "App Login" and "Google Login"
- **App Login:** JWT token in localStorage - your app's session
- **Google Login:** Google cookies - Google's session
- **They are independent!**

## Quick Verification

### Is your app auto-logging in or is it just Google?

Run this test:
```bash
1. Open incognito window
2. Open DevTools (F12)
3. Go to Console tab
4. Type: localStorage.getItem('accessToken')
5. Press Enter
```

**Result:**
- If it returns `null` → Your app is NOT auto-logged in (correct!)
- If it returns a token → Bug! Incognito shouldn't have the token

Then:
```bash
6. Go to http://localhost:3039/sign-in
7. Does it show the login form or auto-redirect?
```

**Result:**
- Shows login form → Correct behavior ✅
- Auto-redirects to dashboard → Bug! Should not happen ❌

## Summary

**Your app's behavior is likely correct!** What you're experiencing is probably:
1. JWT token persisting in localStorage (normal for same browser profile)
2. Google remembering your account (normal OAuth behavior)

**Not auto-login issues!**

The `prompt=select_account` parameter I added will force Google to show account selection every time, preventing silent Google auto-login.

**To truly test in isolation:**
1. Use incognito window
2. Check localStorage is empty
3. Should see login page (not auto-logged in to YOUR app)
4. Google MAY still show your account (Google's behavior, not your app's)
