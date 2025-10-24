# Authentication Endpoints API Documentation

This document provides comprehensive documentation for all authentication endpoints in the API Gateway.

---

## Table of Contents

1. [POST /auth/register](#post-authregister)
2. [POST /auth/login](#post-authlogin)
3. [POST /auth/refresh-token](#post-authrefresh-token)
4. [POST /auth/verify-token](#post-authverify-token)
5. [POST /auth/logout](#post-authlogout)

---

## POST /auth/register

### Description
Public endpoint for registering a new user account. Email verification may be required depending on server configuration.

### Authentication
**Not required** - This is a public endpoint.

### Request

#### Headers
```
Content-Type: application/json
```

#### Body
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "appId": "optional-app-id",
  "appSecret": "optional-app-secret"
}
```

#### Body Parameters

| Parameter | Type | Required | Constraints | Description |
|-----------|------|----------|-------------|-------------|
| `name` | string | Yes | Min length: 3 | User's full name |
| `email` | string | Yes | Valid email, min length: 6 | User's email address |
| `password` | string | Yes | Min length: 6 | User's password |
| `appId` | string | No | - | Optional application ID for third-party registration |
| `appSecret` | string | No | - | Optional application secret for third-party registration |

---

### Responses

#### Success - Email Verification ENABLED (200 OK)

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Please check your email for verification email!",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "user",
    "createdAt": "2025-10-24T10:00:00.000Z"
  }
}
```

**Note:** The `isVerified` field is excluded when email verification is enabled.

#### Success - Email Verification DISABLED (200 OK)

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Account successfully created!",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "user",
    "isVerified": true,
    "createdAt": "2025-10-24T10:00:00.000Z"
  }
}
```

#### Validation Error (400 Bad Request)

```json
{
  "statusCode": 400,
  "message": [
    "name must be longer than or equal to 3 characters",
    "email must be an email",
    "password must be longer than or equal to 6 characters"
  ],
  "error": "Bad Request"
}
```

#### Application Not Found (404 Not Found)

```json
{
  "statusCode": 404,
  "success": false,
  "message": "Application not found"
}
```

**When:** `appId` and `appSecret` are provided but application doesn't exist or credentials are invalid.

#### Queue Not Found (404 Not Found)

```json
{
  "statusCode": 404,
  "success": false,
  "message": "Queue not found"
}
```

**When:** Application exists but its associated queue is not found.

#### Duplicate Email (422 Unprocessable Entity)

```json
{
  "statusCode": 422,
  "success": false,
  "message": "Duplicate record!"
}
```

**When:** Email address is already registered in the system.

#### Internal Server Error (500 Internal Server Error)

```json
{
  "statusCode": 500,
  "success": false,
  "message": "Internal Server Error"
}
```

---

## POST /auth/login

### Description
Endpoint for user authentication. Returns an access token upon successful login. All existing tokens for the user are revoked when logging in.

### Authentication
**Not required** - This is a public endpoint.

### Request

#### Headers
```
Content-Type: application/json
```

#### Body
```json
{
  "email": "user@example.com",
  "password": "password123",
  "appId": "optional-app-id",
  "appSecret": "optional-app-secret"
}
```

#### Body Parameters

| Parameter | Type | Required | Constraints | Description |
|-----------|------|----------|-------------|-------------|
| `email` | string | Yes | Valid email, min length: 6 | User's email address |
| `password` | string | Yes | Not empty, min length: 6 | User's password |
| `appId` | string | No | - | Optional application ID for third-party app tokens |
| `appSecret` | string | No | - | Optional application secret for third-party app tokens |

---

### Responses

#### Success - Login Successful (200 OK)

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "subscriptionEnd": 1735689600000,
  "isVerified": true
}
```

**Fields:**
- `accessToken`: JWT token to be used as Bearer Token for authenticated requests
- `subscriptionEnd`: Unix timestamp (milliseconds) when subscription expires
- `isVerified`: Boolean indicating if user's email is verified

**Note:** All existing tokens for this user are revoked upon successful login.

#### Validation Error (400 Bad Request)

```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password should not be empty",
    "password must be longer than or equal to 6 characters"
  ],
  "error": "Bad Request"
}
```

#### Invalid Credentials (401 Unauthorized)

```json
{
  "statusCode": 401,
  "success": false,
  "message": "Invalid credentials"
}
```

**When:** 
- Email doesn't exist in the system
- Password doesn't match the stored hash

**Security Note:** Same error message for invalid email or password to prevent user enumeration.

#### Invalid Application Credentials (401 Unauthorized)

```json
{
  "statusCode": 401,
  "success": false,
  "message": "Invalid application credentials"
}
```

**When:**
- `appId` and `appSecret` are provided but invalid
- Application doesn't exist or credentials don't match

#### Subscription Not Found (500 Internal Server Error)

```json
{
  "statusCode": 500,
  "success": false,
  "message": "User subscription not found"
}
```

**When:** User exists but has no subscription record (rare edge case).

#### Internal Server Error (500 Internal Server Error)

```json
{
  "statusCode": 500,
  "success": false,
  "message": "Internal Server Error"
}
```

---

## POST /auth/refresh-token

### Description
Endpoint to refresh an expired access token. Provides a new access token while blacklisting the old one. The old token must have a valid signature but can be expired.

### Authentication
**Not required** - This is a public endpoint, but requires a valid (though possibly expired) token.

### Request

#### Headers
```
Content-Type: application/json
```

#### Body
```json
{
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `token` | string | Yes | The expired or soon-to-expire access token to refresh |

---

### Responses

#### Success - Token Refreshed (200 OK)

```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "subscriptionEnd": 1735689600000,
  "isVerified": true
}
```

**Fields:**
- `accessToken`: New JWT token with renewed expiration time
- `subscriptionEnd`: Unix timestamp (milliseconds) when subscription expires
- `isVerified`: Boolean indicating if user's email is verified

**Note:** 
- Old token is blacklisted and cannot be used again
- New token preserves the same claims (user info, audience, etc.)
- If original token was for a third-party app, new token maintains the same audience

#### Invalid Token (401 Unauthorized)

```json
{
  "statusCode": 401,
  "message": "Invalid token"
}
```

**When:**
- Token cannot be decoded
- Token is malformed
- Token doesn't have a `sub` (subject) claim

#### Revoked Token Cannot Be Refreshed (401 Unauthorized)

```json
{
  "statusCode": 401,
  "message": "Cannot refresh a revoked token. Please login again."
}
```

**When:**
- Token has been blacklisted (user logged out)
- Token was previously refreshed
- Token was manually revoked

#### User Not Found (401 Unauthorized)

```json
{
  "statusCode": 401,
  "message": "User not found"
}
```

**When:** User specified in token's `sub` claim doesn't exist (may have been deleted).

#### Application Not Found (401 Unauthorized)

```json
{
  "statusCode": 401,
  "message": "Application not found"
}
```

**When:** Token has an `aud` (audience) claim but the application no longer exists.

#### Token Refresh Failed (401 Unauthorized)

```json
{
  "statusCode": 401,
  "message": "Token refresh failed: invalid signature"
}
```

**When:**
- Token signature is invalid (tampered token)
- Token was signed with a different key
- Other verification errors

**Other possible error messages:**
- `"Token refresh failed: jwt malformed"`
- `"Token refresh failed: invalid algorithm"`

---

## POST /auth/verify-token

### Description
Public endpoint to verify if an access token is valid. Returns detailed token information including validity status, expiration, and user details if valid. Does not require authentication.

### Authentication
**Not required** - This is a public endpoint.

### Request

#### Headers
```
Content-Type: application/json
```

#### Body
```json
{
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `token` | string | Yes | The access token to verify |

---

### Responses

#### Valid Token (200 OK)

```json
{
  "statusCode": 200,
  "valid": true,
  "expired": false,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "role": "user",
    "name": "John Doe",
    "type": "trial",
    "isVerified": true
  },
  "expiresAt": 1735689600000,
  "message": "Token is valid"
}
```

**When:**
- Token signature is valid
- Token has not expired
- Token is not blacklisted/revoked
- User exists in the database
- Application exists (if token has audience claim)

#### Invalid Token Format (400 Bad Request)

```json
{
  "statusCode": 400,
  "valid": false,
  "expired": false,
  "user": null,
  "expiresAt": null,
  "message": "Invalid token format"
}
```

**When:**
- Token cannot be decoded (malformed JWT)
- Token is not a valid JWT structure
- Token is empty or null

#### Token Verification Failed (400 Bad Request)

```json
{
  "statusCode": 400,
  "valid": false,
  "expired": false,
  "user": null,
  "expiresAt": null,
  "message": "invalid signature"
}
```

**When:**
- Token signature is invalid (tampered token)
- Token was signed with a different key

**Other possible error messages:**
- `"jwt malformed"`
- `"jwt signature is required"`
- `"invalid algorithm"`
- `"Token verification failed"`

#### Expired Token (401 Unauthorized)

```json
{
  "statusCode": 401,
  "valid": false,
  "expired": true,
  "user": null,
  "expiresAt": 1735689600000,
  "message": "Access token has expired"
}
```

**When:** Token's `exp` (expiration) claim is in the past.

#### Revoked/Blacklisted Token (401 Unauthorized)

```json
{
  "statusCode": 401,
  "valid": false,
  "expired": false,
  "user": null,
  "expiresAt": 1735689600000,
  "message": "Access token has been revoked"
}
```

**When:**
- Token has been blacklisted (user logged out)
- Token was revoked when user logged in (old tokens)
- Token was manually invalidated

#### User Not Found (404 Not Found)

```json
{
  "statusCode": 404,
  "valid": false,
  "expired": false,
  "user": null,
  "expiresAt": 1735689600000,
  "message": "User not found"
}
```

**When:** User specified in token's `sub` claim doesn't exist (may have been deleted).

#### Application Not Found (404 Not Found)

```json
{
  "statusCode": 404,
  "valid": false,
  "expired": false,
  "user": null,
  "expiresAt": 1735689600000,
  "message": "Application not found"
}
```

**When:** Token has an `aud` (audience) claim for a third-party app that no longer exists.

---

## POST /auth/logout

### Description
Endpoint for authenticated users to logout. Blacklists the current access token, making it invalid for future requests. The client should also delete the access token from local storage.

### Authentication
**Required** - Must provide a valid JWT token in the Authorization header.

### Request

#### Headers
```
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

#### Body
```json
{}
```

**Note:** No request body required. The token is extracted from the Authorization header.

---

### Responses

#### Logout Successful (200 OK)

```json
{
  "statusCode": 200,
  "message": "Logged out successfully. Your access token has been revoked."
}
```

**What happens:**
- Token is added to the blacklist database with expiration date
- Token is removed from the active user tokens collection
- Token can no longer be used for authentication
- Token remains blacklisted until its original expiration time

#### No Token Provided (401 Unauthorized)

```json
{
  "statusCode": 401,
  "message": "No token provided"
}
```

**When:**
- Authorization header is missing
- Authorization header doesn't contain "Bearer " prefix
- Authorization header token is empty

#### Unauthorized - Invalid Token (401 Unauthorized)

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**When (JwtAuthGuard validation fails):**
- Token signature is invalid
- Token has expired
- Token format is malformed
- Token's `sub` (subject) claim is missing
- User specified in token doesn't exist
- Application specified in token's `aud` claim doesn't exist

**Common JWT errors:**
- `"jwt expired"`
- `"invalid signature"`
- `"jwt malformed"`
- `"invalid token"`

#### Invalid Token - Cannot Decode (401 Unauthorized)

```json
{
  "statusCode": 401,
  "message": "Invalid token"
}
```

**When:**
- Token passes JwtAuthGuard but cannot be decoded in logout method
- Token doesn't have an `exp` (expiration) claim
- Token structure is corrupted

#### Failed to Logout (422 Unprocessable Entity)

```json
{
  "statusCode": 422,
  "message": "Failed to logout"
}
```

**When:**
- Database error when adding token to blacklist
- Database error when removing token from active tokens
- Unexpected error during logout process

---

## Common Response Fields

### Success Response Structure
All successful responses follow a consistent structure:

```typescript
{
  statusCode: number,      // HTTP status code
  success: boolean,        // Indicates success (true) or failure (false)
  message: string,         // Human-readable message
  // ... additional fields specific to endpoint
}
```

### Error Response Structure
Error responses maintain consistency:

```typescript
{
  statusCode: number,      // HTTP status code
  message: string | string[],  // Error message(s)
  error?: string          // Error type (for validation errors)
}
```

---

## HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful request |
| 400 | Bad Request | Validation errors or malformed input |
| 401 | Unauthorized | Authentication failed or invalid credentials |
| 404 | Not Found | Resource (user, app, queue) not found |
| 422 | Unprocessable Entity | Duplicate data or business logic error |
| 500 | Internal Server Error | Unexpected server error |

---

## Security Notes

### Token Management
- **Tokens are blacklisted** on logout and cannot be reused
- **All tokens are revoked** when a user logs in (security feature)
- **Tokens are tracked** with metadata (userAgent, IP address) for auditing
- **Blacklisted tokens** are automatically cleaned after expiration

### Password Security
- **Passwords are hashed** using bcrypt
- **Passwords are never returned** in any response
- **Same error message** for invalid email/password (prevents user enumeration)

### Email Verification
- **Configurable** - Can be enabled or disabled server-side
- **Verification tokens** expire after configured time
- **Unverified users** can still login but may have limited access

### Third-Party Apps
- **App-specific tokens** - Can be signed with application-specific keys
- **Audience claim** - Tokens include `aud` claim for third-party apps
- **Key management** - Each app has its own public/private key pair

---

## Common Error Scenarios

### Network Issues
If the client cannot reach the server:
- Client should handle network timeouts
- Client should display user-friendly error messages
- Client should implement retry logic for transient failures

### Token Expiration
When a token expires:
1. Client receives 401 with `"expired": true` from `/auth/verify-token`
2. Client should call `/auth/refresh-token` to get a new token
3. If refresh fails, client should redirect to login page
4. Client should delete stored token

### Logout Failures
If logout fails:
- Client should still delete the token from local storage
- Token will eventually expire naturally
- User can still login again (old tokens are revoked on login)

---

## Best Practices

### Client Implementation
1. **Store tokens securely** - Use secure storage mechanisms
2. **Include token in requests** - Add `Authorization: Bearer <token>` header
3. **Handle 401 responses** - Implement automatic token refresh or redirect to login
4. **Verify token before use** - Call `/auth/verify-token` to check validity
5. **Clean up on logout** - Delete stored tokens even if logout request fails

### Token Refresh Strategy
1. **Proactive refresh** - Refresh token before it expires
2. **Check expiration** - Use `/auth/verify-token` to get expiration time
3. **Fallback to login** - If refresh fails, redirect user to login
4. **Handle refresh errors** - Show appropriate messages for different error types

### Error Handling
1. **Parse error responses** - Check `statusCode` and `message` fields
2. **Display user-friendly messages** - Don't show raw error messages to users
3. **Log errors** - Log errors for debugging and monitoring
4. **Implement retry logic** - Retry failed requests with exponential backoff

---

## API Version

**Current Version:** 1.0.0  
**Last Updated:** October 24, 2025  
**Base URL:** `/auth`

---

## Support

For issues, questions, or contributions:
- **Repository:** ntuspeechlab/api-gateway
- **Branch:** feat/sso-and-subscription

---

*This documentation is auto-generated and reflects the current state of the authentication endpoints.*
