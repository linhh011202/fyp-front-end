# Google SSO Authentication Flow

## Overview

This document describes the two-step Google SSO authentication flow where new users must set a password before their account is created.

The implementation uses OAuth2's `state` parameter to preserve query parameters (redirect URL, appId, appSecret) through the entire OAuth flow, ensuring users are properly redirected to the frontend after authentication.

## Flow Diagram

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       │ 1. Click "Login with Google"
       ▼
┌─────────────────────────────────────┐
│  GET /auth/google                   │
│  ?redirect=URL&appId=X&appSecret=Y  │
└──────────┬──────────────────────────┘
           │
           │ 2. Guard encodes query params into OAuth state parameter
           │    state = base64({ redirect, appId, appSecret })
           │
           │ 3. Redirect to Google with state
           ▼
┌─────────────────────────────────────┐
│  Google OAuth Consent Screen        │
│  (Google preserves state parameter) │
└──────────┬──────────────────────────┘
           │
           │ 4. User grants permission
           ▼
┌─────────────────────────────────────┐
│  GET /auth/google/callback          │
│  ?code=...&state=BASE64_DATA        │
│  - Decode state to get redirect URL │
│  - Check if user exists             │
└──────────┬──────────────────────────┘
           │
           ├─── User EXISTS ────────────┐
           │                            │
           │                            ▼
           │              ┌──────────────────────────────────┐
           │              │ Redirect to Frontend with Token  │
           │              │ redirect?token=JWT&...           │
           │              └──────────────────────────────────┘
           │
           └─── User DOES NOT EXIST ───┐
                                        │
                                        ▼
                          ┌──────────────────────────────────┐
                          │ Redirect to Frontend             │
                          │ redirect?requiresPassword=true&  │
                          │         email=X&name=Y           │
                          └──────────┬───────────────────────┘
                                     │
                                     │ 5. Frontend shows password form
                                     ▼
                          ┌──────────────────────────┐
                          │ POST /auth/google-register│
                          │ Body:                    │
                          │ - email                  │
                          │ - name                   │
                          │ - password               │
                          └──────────┬───────────────┘
                                     │
                                     │ 6. Create account & return token
                                     ▼
                          ┌──────────────────────────┐
                          │ Return Access Token      │
                          │ - accessToken            │
                          │ - subscriptionEnd        │
                          │ - isVerified             │
                          └──────────────────────────┘
```

## API Endpoints

### 1. Initiate Google Login
```http
GET /auth/google?redirect=https://yourdomain.com/dashboard&appId=your-app-id&appSecret=your-app-secret&prompt=select_account
```

**Query Parameters:**
- `redirect` (optional): Frontend URL to redirect after authentication
- `appId` (optional): Application ID
- `appSecret` (optional): Application secret
- `prompt` (optional): Google OAuth prompt behavior. Defaults to `select_account`
  - `select_account` - Always show account selection screen (recommended for logout flow)
  - `consent` - Always show consent screen
  - `none` - Don't show any prompt (auto-login if possible)

**How it works:**
1. The `GoogleAuthGuard` intercepts the request
2. Encodes `redirect`, `appId`, and `appSecret` into a base64-encoded OAuth `state` parameter
3. Extracts the `prompt` parameter (defaults to `select_account` if not provided)
4. Redirects to Google with the `state` and `prompt` parameters
5. Google preserves the `state` and includes it in the callback
6. The `prompt` parameter controls whether users see the account selection screen

### 2. Google Callback
```http
GET /auth/google/callback?code=...&state=BASE64_ENCODED_DATA
```

The callback receives:
- `code` - Authorization code from Google
- `state` - Base64-encoded JSON with original query parameters: `{ redirect, appId, appSecret }`

**Processing:**
1. Controller decodes the `state` parameter to retrieve original query params
2. Validates Google authentication
3. Checks if user exists in database
4. Returns appropriate response based on user status

#### Response for Existing User (with redirect):
```
Redirect to: https://yourdomain.com/dashboard?token=JWT_TOKEN&subscriptionEnd=1234567890&isVerified=true
```

#### Response for Existing User (without redirect - JSON):
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "subscriptionEnd": 1234567890,
  "isVerified": true
}
```

#### Response for New User (with redirect):
```
Redirect to: https://yourdomain.com/dashboard?requiresPassword=true&email=user@gmail.com&name=John+Doe
```

#### Response for New User (without redirect - JSON):
```json
{
  "statusCode": 200,
  "success": true,
  "message": "New user detected. Password required.",
  "requiresPassword": true,
  "email": "user@gmail.com",
  "name": "John Doe"
}
```

#### Response for New User (without redirect - JSON):
```json
{
  "statusCode": 200,
  "success": true,
  "message": "New user detected. Password required.",
  "requiresPassword": true,
  "email": "user@gmail.com",
  "name": "John Doe"
}
```

**Response for New User (Redirect):**
```
https://yourdomain.com/dashboard?requiresPassword=true&email=user@gmail.com&name=John+Doe
```

### 3. Complete Registration with Password
```http
POST /auth/google-register
Content-Type: application/json

{
  "email": "user@gmail.com",
  "name": "John Doe",
  "password": "SecurePassword123!",
  "appId": "optional",
  "appSecret": "optional"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "subscriptionEnd": 1234567890,
  "isVerified": true
}
```

## Frontend Implementation Examples

### Understanding the Prompt Parameter

The `prompt` parameter controls Google's OAuth behavior:

| Prompt Value | Behavior | Use Case |
|--------------|----------|----------|
| `select_account` | Always shows account picker | **Recommended**: Best UX for logout → login flow |
| `consent` | Always shows consent screen | Re-authentication or permission changes |
| `none` | No prompts if possible | Silent authentication (may fail if interaction needed) |
| Not specified | Backend defaults to `select_account` | Good default for most cases |

**Why `select_account` is Important:**
- Without it, users who logout are immediately re-logged in without confirmation
- Provides clear visual feedback that they need to choose an account
- Better security: prevents accidental automatic re-login
- Improves user experience by giving them control

### React/Next.js with Redirect

```javascript
// Step 1: Initiate Google Login
const handleGoogleLogin = () => {
  const redirectUrl = encodeURIComponent(window.location.origin + '/auth/callback');
  const appId = 'your-app-id'; // Optional
  const appSecret = 'your-app-secret'; // Optional
  
  // Always use select_account for better logout UX
  let url = `${API_URL}/auth/google?redirect=${redirectUrl}&prompt=select_account`;
  if (appId && appSecret) {
    url += `&appId=${appId}&appSecret=${appSecret}`;
  }
  
  console.log('🔐 Initiating Google Login:', {
    redirectUrl: window.location.origin + '/auth/callback',
    fullUrl: url,
    prompt: 'select_account'
  });
  
  window.location.href = url;
};

// Step 2: Handle Callback in your /auth/callback page
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  
  // Check if user needs to set password
  if (params.get('requiresPassword') === 'true') {
    const email = params.get('email');
    const name = params.get('name');
    
    // Store in state or localStorage
    setUserInfo({ email, name });
    setShowPasswordForm(true);
  }
  
  // Check if we got an access token (existing user)
  else if (params.get('token')) {
    const token = params.get('token');
    const subscriptionEnd = params.get('subscriptionEnd');
    const isVerified = params.get('isVerified');
    
    // Store token
    localStorage.setItem('accessToken', token);
    
    // Redirect to dashboard
    router.push('/dashboard');
  }
  
  // Check for errors
  else if (params.get('error')) {
    const error = params.get('message');
    setError(error);
  }
}, []);

// Step 3: Submit password form
const handlePasswordSubmit = async (password) => {
  try {
    const response = await fetch(`${API_URL}/auth/google-register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userInfo.email,
        name: userInfo.name,
        password: password,
      }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Store token
      localStorage.setItem('accessToken', data.accessToken);
      
      // Redirect to dashboard
      router.push('/dashboard');
    } else {
      setError(data.message);
    }
  } catch (error) {
    setError('Registration failed');
  }
};
```

### React Password Form Component

```jsx
import { useState } from 'react';

function GooglePasswordForm({ email, name, onSubmit }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate passwords
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    
    try {
      await onSubmit(password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Complete Your Registration</h2>
        <p className="text-gray-600 mt-2">
          Welcome, {name}! Set a password to complete your account setup.
        </p>
        <p className="text-sm text-gray-500 mt-1">{email}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Enter password"
            required
            minLength={8}
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">
            Confirm Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Confirm password"
            required
            minLength={8}
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Creating Account...' : 'Complete Registration'}
        </button>
      </form>
    </div>
  );
}

export default GooglePasswordForm;
```

### Complete Page Example

```jsx
// pages/auth/callback.jsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import GooglePasswordForm from '@/components/GooglePasswordForm';

export default function AuthCallback() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    if (params.get('requiresPassword') === 'true') {
      setUserInfo({
        email: params.get('email'),
        name: params.get('name'),
      });
      setShowPasswordForm(true);
    } else if (params.get('token')) {
      localStorage.setItem('accessToken', params.get('token'));
      router.push('/dashboard');
    } else if (params.get('error')) {
      setError(params.get('message'));
    }
  }, [router]);

  const handlePasswordSubmit = async (password) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/google-register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userInfo.email,
        name: userInfo.name,
        password: password,
      }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem('accessToken', data.accessToken);
      router.push('/dashboard');
    } else {
      throw new Error(data.message);
    }
  };

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (showPasswordForm) {
    return (
      <GooglePasswordForm
        email={userInfo.email}
        name={userInfo.name}
        onSubmit={handlePasswordSubmit}
      />
    );
  }

  return <div>Loading...</div>;
}
```

## Security Considerations

1. **OAuth State Parameter**: The implementation uses OAuth's `state` parameter to securely preserve query parameters through the authentication flow, preventing parameter injection attacks
2. **Password Validation**: Enforce strong password requirements (minimum length, complexity)
3. **Email Verification**: The account is created but may require email verification based on your settings
4. **Rate Limiting**: Implement rate limiting on the `/auth/google-register` endpoint
5. **CSRF Protection**: The `state` parameter provides CSRF protection for the OAuth flow
6. **HTTPS**: Always use HTTPS in production
7. **Token Storage**: Store JWT tokens securely (httpOnly cookies or secure localStorage)
8. **URL Validation**: The redirect URL should be validated against a whitelist to prevent open redirects

## Error Handling

### Possible Error Responses

**User Already Exists (409)**
```json
{
  "statusCode": 409,
  "success": false,
  "message": "User already exists"
}
```

**Invalid Password (422)**
```json
{
  "statusCode": 422,
  "success": false,
  "message": "Password validation failed"
}
```

**Server Error (500)**
```json
{
  "statusCode": 500,
  "success": false,
  "message": "Google registration completion failed"
}
```

## Testing

### Test New User Flow
```bash
# 1. Open browser and navigate to:
http://localhost:3000/auth/google?redirect=http://localhost:3000/callback&appId=your-app-id&appSecret=your-app-secret&prompt=select_account

# 2. Complete Google OAuth
# 3. You should see Google's "Choose an account" screen
# 4. After selecting account, you'll be redirected to your frontend with requiresPassword=true
# Example: http://localhost:3000/callback?requiresPassword=true&email=newuser@gmail.com&name=New+User

# 5. Submit password via API:
curl -X POST http://localhost:3000/auth/google-register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@gmail.com",
    "name": "New User",
    "password": "SecurePassword123!",
    "appId": "your-app-id",
    "appSecret": "your-app-secret"
  }'
```

### Test Existing User Flow
```bash
# 1. Open browser and navigate to:
http://localhost:3000/auth/google?redirect=http://localhost:3000/callback&appId=your-app-id&appSecret=your-app-secret&prompt=select_account

# 2. You should see Google's "Choose an account" screen
# 3. Select your account
# 4. You should be redirected to your frontend with token in URL
# Example: http://localhost:3000/callback?token=JWT_TOKEN&subscriptionEnd=1234567890&isVerified=true
```

### Test Logout → Login Flow (Important!)
```bash
# This tests that the prompt parameter works correctly

# 1. Login with Google
http://localhost:3000/auth/google?redirect=http://localhost:3000/callback&prompt=select_account

# 2. Complete login and verify you're logged in

# 3. Click your app's Logout button
# - Your app should clear JWT token
# - Redirect to login page

# 4. Click "Login with Google" again
http://localhost:3000/auth/google?redirect=http://localhost:3000/callback&prompt=select_account

# 5. ✅ EXPECTED: You should see "Choose an account" screen
# 6. ❌ WITHOUT prompt: You would be auto-logged in immediately (bad UX)

# 7. Select your account
# 8. You're logged back in

# This proves the prompt parameter is working correctly!
```

## Technical Implementation Details

### OAuth State Parameter Flow

The implementation uses OAuth2's `state` parameter to preserve custom query parameters:

1. **GoogleAuthGuard** (`google-sso.guard.ts`):
   ```typescript
   getAuthenticateOptions(context: ExecutionContext) {
     const request = context.switchToHttp().getRequest()
     const { redirect, appId, appSecret, prompt } = request.query
     
     const state = JSON.stringify({
       redirect: redirect || null,
       appId: appId || null,
       appSecret: appSecret || null,
     })
     
     return {
       state: Buffer.from(state).toString('base64'),
       prompt: prompt || 'select_account', // Force account selection
       access_type: 'offline', // Optional: for refresh tokens
     }
   }
   ```

2. **Controller** (`google-sso.controller.ts`):
   ```typescript
   // Decode state parameter to get original query params
   if (state) {
     const decoded = JSON.parse(Buffer.from(state, 'base64').toString())
     redirectUrl = decoded.redirect || redirect
     decodedAppId = decoded.appId || appId
     decodedAppSecret = decoded.appSecret || appSecret
   }
   ```

This ensures that your custom query parameters (redirect URL, appId, appSecret) are preserved throughout the entire OAuth flow, even though Google doesn't natively support custom parameters.

### Prompt Parameter Implementation

The `prompt` parameter is handled separately from the state because:

1. **Google OAuth Standard**: `prompt` is a standard OAuth2 parameter that Google recognizes
2. **Not Preserved in State**: It doesn't need to be encoded in state because it's consumed by Google during the OAuth flow
3. **Default Behavior**: The backend defaults to `select_account` if not provided, ensuring good UX

**Why Default to `select_account`?**

```typescript
prompt: prompt || 'select_account'
```

This ensures that even if the frontend forgets to send the `prompt` parameter, users will still see the account selection screen after logout, preventing the confusing auto-login behavior.

### Complete OAuth Flow with Prompt

```
1. Frontend initiates login:
   GET /auth/google?redirect=URL&prompt=select_account

2. GoogleAuthGuard processes request:
   - Extracts: redirect, appId, appSecret, prompt
   - Encodes first three into state
   - Passes prompt directly to Google
   
3. Backend redirects to Google:
   https://accounts.google.com/o/oauth2/v2/auth?
     client_id=...
     &redirect_uri=...
     &scope=email+profile
     &state=BASE64_ENCODED_DATA
     &prompt=select_account  ← Forces account picker
     
4. Google shows account selection screen
   User must click their account (cannot auto-login)
   
5. Google redirects back:
   GET /auth/google/callback?code=...&state=BASE64_DATA
   
6. Controller decodes state:
   - Retrieves original redirect URL
   - Processes authentication
   - Redirects user to frontend with result
```

## Environment Variables

Make sure these are configured:
```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

## Common Issues and Troubleshooting

### Issue: User is Auto-Logged In After Logout

**Symptom:** When users click logout and then "Login with Google" again, they're immediately logged back in without seeing the account selection screen.

**Cause:** The `prompt` parameter is not being sent or not being forwarded to Google.

**Solution:**
1. **Check Frontend:** Make sure your login button includes `&prompt=select_account`
   ```javascript
   const url = `${API_URL}/auth/google?redirect=${redirectUrl}&prompt=select_account`;
   ```

2. **Check Backend:** Verify the `GoogleAuthGuard` is forwarding the prompt parameter
   ```typescript
   // In google-sso.guard.ts
   return {
     state: Buffer.from(state).toString('base64'),
     prompt: prompt || 'select_account', // This line is required
   }
   ```

3. **Verify in Browser:** 
   - Open DevTools → Network tab
   - Click "Login with Google"
   - Find the redirect to `accounts.google.com`
   - Check the URL contains `&prompt=select_account`

### Issue: "Invalid Prompt Parameter" Error

**Cause:** Using an unsupported value for the `prompt` parameter.

**Solution:** Only use these valid values:
- `select_account` (recommended)
- `consent`
- `none`

### Issue: Prompt Parameter Ignored

**Symptom:** Backend receives the prompt parameter but it's not being passed to Google.

**Debug Steps:**
1. Add logging in `google-sso.guard.ts`:
   ```typescript
   getAuthenticateOptions(context: ExecutionContext) {
     const request = context.switchToHttp().getRequest()
     const { redirect, appId, appSecret, prompt } = request.query
     
     console.log('🔍 OAuth Options:', { redirect, appId, prompt });
     
     // ... rest of code
     const options = {
       state: Buffer.from(state).toString('base64'),
       prompt: prompt || 'select_account',
     };
     
     console.log('📤 Sending to Google:', options);
     return options;
   }
   ```

2. Check the logs when initiating login
3. Verify the prompt value is being included in the returned options

### Issue: State Parameter Too Large

**Symptom:** OAuth fails with "state parameter too large" error.

**Cause:** Encoding very long URLs or data in the state parameter.

**Solution:** 
- Keep redirect URLs reasonably short
- Consider using a session-based approach for very long data
- Maximum state size is typically 2048 characters

### Best Practices

1. **Always Use `select_account` for Login Buttons**
   ```javascript
   // Good
   `/auth/google?redirect=${url}&prompt=select_account`
   
   // Bad - user might be auto-logged in
   `/auth/google?redirect=${url}`
   ```

2. **Use `consent` Only When Needed**
   ```javascript
   // Only when you need to re-request permissions
   `/auth/google?redirect=${url}&prompt=consent`
   ```

3. **Frontend Logout Should Clear Everything**
   ```javascript
   const handleLogout = () => {
     // Clear JWT token
     localStorage.removeItem('accessToken');
     sessionStorage.clear();
     
     // Redirect to login
     router.push('/login');
     
     // Note: This doesn't log user out of Google itself
     // That's why prompt=select_account is important!
   };
   ```

4. **Backend Should Default to Safe Behavior**
   ```typescript
   // Always default to select_account
   prompt: prompt || 'select_account'
   ```

5. **Document Your API**
   - Make it clear that `prompt` parameter is available
   - Explain the different values and their use cases
   - Provide examples in your API documentation
