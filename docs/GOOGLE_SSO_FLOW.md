# Google SSO Authentication Flow

## Overview

This document describes the two-step Google SSO authentication flow where new users must set a password before their account is created.

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
│  (with optional ?redirect=URL)      │
└──────────┬──────────────────────────┘
           │
           │ 2. Redirect to Google
           ▼
┌─────────────────────────────────────┐
│  Google OAuth Consent Screen        │
└──────────┬──────────────────────────┘
           │
           │ 3. User grants permission
           ▼
┌─────────────────────────────────────┐
│  GET /auth/google/callback          │
│  Check if user exists               │
└──────────┬──────────────────────────┘
           │
           ├─── User EXISTS ────────────┐
           │                            │
           │                            ▼
           │              ┌──────────────────────────┐
           │              │ Return Access Token      │
           │              │ - accessToken            │
           │              │ - subscriptionEnd        │
           │              │ - isVerified             │
           │              └──────────────────────────┘
           │
           └─── User DOES NOT EXIST ───┐
                                        │
                                        ▼
                          ┌──────────────────────────┐
                          │ Return requiresPassword  │
                          │ - email                  │
                          │ - name                   │
                          └──────────┬───────────────┘
                                     │
                                     │ 4. Frontend shows password form
                                     ▼
                          ┌──────────────────────────┐
                          │ POST /auth/google-register│
                          │ Body:                    │
                          │ - email                  │
                          │ - name                   │
                          │ - password               │
                          └──────────┬───────────────┘
                                     │
                                     │ 5. Create account
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
GET /auth/google?redirect=https://yourdomain.com/dashboard&appId=your-app-id&appSecret=your-app-secret
```

**Query Parameters:**
- `redirect` (optional): Frontend URL to redirect after authentication
- `appId` (optional): Application ID
- `appSecret` (optional): Application secret

### 2. Google Callback - Existing User
```http
GET /auth/google/callback
```

**Response for Existing User (JSON):**
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

**Response for Existing User (Redirect):**
```
https://yourdomain.com/dashboard?token=JWT_TOKEN&subscriptionEnd=1234567890&isVerified=true
```

### 3. Google Callback - New User
```http
GET /auth/google/callback
```

**Response for New User (JSON):**
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

### 4. Complete Registration with Password
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

### React/Next.js with Redirect

```javascript
// Step 1: Initiate Google Login
const handleGoogleLogin = () => {
  const redirectUrl = encodeURIComponent(window.location.origin + '/auth/callback');
  const appId = 'your-app-id'; // Optional
  const appSecret = 'your-app-secret'; // Optional
  
  let url = `${API_URL}/auth/google?redirect=${redirectUrl}`;
  if (appId && appSecret) {
    url += `&appId=${appId}&appSecret=${appSecret}`;
  }
  
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

1. **Password Validation**: Enforce strong password requirements (minimum length, complexity)
2. **Email Verification**: The account is created but may require email verification based on your settings
3. **Rate Limiting**: Implement rate limiting on the `/auth/google-register` endpoint
4. **CSRF Protection**: Use proper CSRF tokens if not using API-only approach
5. **HTTPS**: Always use HTTPS in production
6. **Token Storage**: Store JWT tokens securely (httpOnly cookies or secure localStorage)

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
http://localhost:3000/auth/google?redirect=http://localhost:3000/callback&appId=your-app-id&appSecret=your-app-secret

# 2. Complete Google OAuth
# 3. You should be redirected with requiresPassword=true

# 4. Submit password via API:
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
http://localhost:3000/auth/google?redirect=http://localhost:3000/callback&appId=your-app-id&appSecret=your-app-secret

# 2. Complete Google OAuth
# 3. You should be redirected with token in URL
```

## Environment Variables

Make sure these are configured:
```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```
