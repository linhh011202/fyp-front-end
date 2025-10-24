# Authentication Integration Guide

This project is fully integrated with the authentication API. All endpoints from the API documentation are implemented and ready to use.

## 🔐 Implemented Features

### 1. **User Registration** (`/auth/register`)
- Full name, email, and password registration
- Email validation (min 6 characters)
- Password validation (min 6 characters)
- Name validation (min 3 characters)
- Success/error message handling
- Email verification support
- Auto-redirect to sign-in after successful registration

### 2. **User Login** (`/auth/login`)
- Email and password authentication
- Access token storage
- Subscription data storage
- Email verification status tracking
- Redirect to dashboard on success
- Error handling for invalid credentials

### 3. **Token Refresh** (`/auth/refresh-token`)
- Automatic token refresh when expired
- Seamless user experience (no manual refresh needed)
- Integrated with all authenticated requests
- Background token verification every 5 minutes

### 4. **Token Verification** (`/auth/verify-token`)
- Automatic token validation
- Expired token detection
- Revoked token detection
- User existence validation

### 5. **User Logout** (`/auth/logout`)
- Server-side token revocation
- Local storage cleanup
- Redirect to sign-in page
- Graceful error handling

## 📁 Project Structure

```
src/
├── services/
│   └── auth.service.ts          # Authentication API service
├── hooks/
│   └── use-auth.ts              # Authentication hooks
├── utils/
│   └── fetch-with-auth.ts       # Authenticated fetch utility
├── routes/
│   └── components/
│       └── protected-route.tsx  # Route protection component
├── sections/
│   └── auth/
│       ├── sign-in-view.tsx     # Login page
│       └── sign-up-view.tsx     # Registration page
└── layouts/
    └── components/
        └── account-popover.tsx  # Logout functionality
```

## 🚀 Usage Examples

### Using the Auth Service

```typescript
import { authService } from 'src/services/auth.service';

// Register a new user
const response = await authService.register({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'password123',
});

// Login
const loginResponse = await authService.login({
  email: 'john@example.com',
  password: 'password123',
});

// Store authentication data
authService.storeAuthData(
  loginResponse.accessToken,
  loginResponse.subscriptionEnd,
  loginResponse.isVerified
);

// Check if user is authenticated
if (authService.isAuthenticated()) {
  // User is logged in
}

// Get access token
const token = authService.getAccessToken();

// Logout
await authService.logout(token);
authService.clearAuthData();
```

### Using Authentication Hooks

```typescript
import { useAuth, useAuthToken } from 'src/hooks/use-auth';

function MyComponent() {
  // Get authentication state
  const { isAuthenticated, accessToken, subscriptionEnd, isVerified, logout } = useAuth();

  // Auto-verify and refresh token (use in protected routes)
  useAuthToken();

  return (
    <div>
      {isAuthenticated ? (
        <button onClick={logout}>Logout</button>
      ) : (
        <a href="/sign-in">Login</a>
      )}
    </div>
  );
}
```

### Making Authenticated API Requests

```typescript
import { fetchWithAuth, postWithAuth, getWithAuth } from 'src/utils/fetch-with-auth';

// GET request with authentication
const response = await getWithAuth('http://localhost:3000/api/user/profile');
const data = await response.json();

// POST request with authentication
const response = await postWithAuth('http://localhost:3000/api/data', {
  name: 'Example',
  value: 123,
});

// Automatic token refresh if expired
const response = await fetchWithAuth('http://localhost:3000/api/protected', {
  method: 'GET',
  autoRefresh: true, // Default is true
});
```

## 🔒 Protected Routes

All dashboard routes are automatically protected. Users must be authenticated to access:
- `/` - Dashboard home
- `/user` - User management
- `/products` - Products page
- `/blog` - Blog page

Public routes (no authentication required):
- `/sign-in` - Login page
- `/sign-up` - Registration page
- `/404` - Not found page

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:3000
```

### Token Management

Tokens are automatically:
- ✅ Stored in localStorage on login
- ✅ Verified every 5 minutes
- ✅ Refreshed automatically when expired
- ✅ Revoked on logout
- ✅ Included in authenticated requests

### Auto-Refresh Strategy

The system implements a proactive token refresh strategy:
1. Token is verified every 5 minutes
2. If token is expired, automatic refresh is attempted
3. If refresh succeeds, new token is stored
4. If refresh fails, user is logged out and redirected to sign-in

## 🛡️ Security Features

### Token Storage
- Tokens stored in localStorage
- Subscription end date tracked
- Email verification status tracked

### Protected Routes
- Automatic redirect to sign-in if not authenticated
- Token verification on route access
- Automatic token refresh for expired tokens

### Logout Security
- Server-side token revocation
- Complete local storage cleanup
- Redirect to sign-in page

### Error Handling
- Network error handling
- Invalid credentials handling
- Token expiration handling
- Server error handling

## 📝 API Response Types

All API responses are fully typed in `auth.service.ts`:

```typescript
// Login Response
interface LoginResponse {
  statusCode: number;
  success: boolean;
  message: string;
  accessToken: string;
  subscriptionEnd: number;
  isVerified: boolean;
}

// Register Response
interface RegisterResponse {
  statusCode: number;
  success: boolean;
  message: string;
  user: {
    _id: string;
    email: string;
    name: string;
    role: string;
    isVerified?: boolean;
    createdAt: string;
  };
}

// Error Response
interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
  success?: boolean;
}
```

## 🐛 Error Handling

### Common Error Scenarios

1. **Invalid Credentials (401)**
   ```typescript
   {
     statusCode: 401,
     message: "Invalid credentials"
   }
   ```

2. **Validation Errors (400)**
   ```typescript
   {
     statusCode: 400,
     message: [
       "email must be an email",
       "password must be longer than or equal to 6 characters"
     ],
     error: "Bad Request"
   }
   ```

3. **Token Expired (401)**
   ```typescript
   {
     statusCode: 401,
     valid: false,
     expired: true,
     message: "Access token has expired"
   }
   ```

4. **Network Error**
   ```typescript
   {
     statusCode: 0,
     message: "Network error. Please check your connection.",
     error: "NetworkError"
   }
   ```

## 🧪 Testing

### Test User Credentials (from documentation)

```
Email: yinlin@example.com
Password: Password123!
```

### Testing Registration

1. Navigate to `/sign-up`
2. Fill in name (min 3 chars), email, and password (min 6 chars)
3. Click "Sign up"
4. Check for success message
5. Auto-redirect to sign-in page

### Testing Login

1. Navigate to `/sign-in`
2. Enter email and password
3. Click "Sign in"
4. Check localStorage for tokens
5. Verify redirect to dashboard

### Testing Token Refresh

1. Login to get a token
2. Wait for token to expire (or manually expire it)
3. Make an authenticated request
4. Token should automatically refresh
5. Request should succeed with new token

### Testing Logout

1. Login and navigate to dashboard
2. Click user avatar
3. Click "Logout" button
4. Verify localStorage is cleared
5. Verify redirect to sign-in page

## 📚 Additional Resources

- **API Documentation**: See `AUTH_ENDPOINTS_API_DOCUMENTATION.md`
- **Environment Setup**: See `.env.example`
- **TypeScript Types**: See `src/services/auth.service.ts`

## 🔄 Token Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                     Token Lifecycle                         │
└─────────────────────────────────────────────────────────────┘

1. User Login
   └──> POST /auth/login
        └──> Receive accessToken
             └──> Store in localStorage

2. Protected Route Access
   └──> Check token exists
        └──> Verify token every 5 minutes
             ├──> Valid: Continue
             └──> Expired: Refresh token
                  ├──> Success: Store new token
                  └──> Failure: Logout & redirect

3. API Request
   └──> Include Authorization: Bearer <token>
        └──> 401 Response?
             └──> Auto-refresh token
                  ├──> Success: Retry request
                  └──> Failure: Logout & redirect

4. User Logout
   └──> POST /auth/logout (with token)
        └──> Clear localStorage
             └──> Redirect to /sign-in
```

## ⚡ Performance Optimizations

- **Lazy Loading**: Auth views loaded on demand
- **Token Caching**: Tokens cached in memory during session
- **Minimal Re-renders**: Hooks optimized with useCallback
- **Background Verification**: Token verified without blocking UI

## 🎯 Best Practices Implemented

✅ Centralized authentication service
✅ TypeScript for type safety
✅ Error handling at every level
✅ Automatic token refresh
✅ Protected routes
✅ Secure token storage
✅ Clean code organization
✅ Reusable hooks and utilities
✅ Consistent error messages
✅ Loading states for better UX

---

**Ready to use!** All authentication endpoints are integrated and working. Just start your backend server at `http://localhost:3000` and the frontend will handle the rest.
