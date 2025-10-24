import { authService } from 'src/services/auth.service';

/**
 * Utility to make authenticated API requests
 * Automatically includes Authorization header and handles token refresh
 */

export interface FetchOptions extends RequestInit {
  requiresAuth?: boolean;
  autoRefresh?: boolean;
}

export async function fetchWithAuth(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { requiresAuth = true, autoRefresh = true, headers = {}, ...restOptions } = options;

  const token = authService.getAccessToken();

  // If authentication is required but no token, throw error
  if (requiresAuth && !token) {
    throw new Error('No authentication token available');
  }

  // Add Authorization header if token exists
  const requestHeaders: HeadersInit = {
    ...headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // Make the request
  let response = await fetch(url, {
    ...restOptions,
    headers: requestHeaders,
  });

  // If unauthorized and auto-refresh is enabled, try to refresh token
  if (response.status === 401 && autoRefresh && token) {
    try {
      // Try to refresh the token
      const refreshResult = await authService.refreshToken({ token });

      // Store new token
      authService.storeAuthData(
        refreshResult.accessToken,
        refreshResult.subscriptionEnd,
        refreshResult.isVerified
      );

      // Retry the original request with new token
      response = await fetch(url, {
        ...restOptions,
        headers: {
          ...headers,
          Authorization: `Bearer ${refreshResult.accessToken}`,
        },
      });
    } catch {
      // Refresh failed, clear auth data
      authService.clearAuthData();
      throw new Error('Session expired. Please login again.');
    }
  }

  return response;
}

/**
 * Helper function to make authenticated GET request
 */
export async function getWithAuth(url: string, options: FetchOptions = {}) {
  return fetchWithAuth(url, { ...options, method: 'GET' });
}

/**
 * Helper function to make authenticated POST request
 */
export async function postWithAuth(
  url: string,
  body?: any,
  options: FetchOptions = {}
) {
  return fetchWithAuth(url, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Helper function to make authenticated PUT request
 */
export async function putWithAuth(
  url: string,
  body?: any,
  options: FetchOptions = {}
) {
  return fetchWithAuth(url, {
    ...options,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Helper function to make authenticated DELETE request
 */
export async function deleteWithAuth(url: string, options: FetchOptions = {}) {
  return fetchWithAuth(url, { ...options, method: 'DELETE' });
}

/**
 * Helper function to make authenticated PATCH request
 */
export async function patchWithAuth(
  url: string,
  body?: any,
  options: FetchOptions = {}
) {
  return fetchWithAuth(url, {
    ...options,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}
