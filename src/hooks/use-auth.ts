import { useEffect, useCallback } from 'react';

import { useRouter } from 'src/routes/hooks';

import { authService } from 'src/services/auth.service';

/**
 * Custom hook to manage token verification and auto-refresh
 * Checks token validity on mount and periodically
 */
export function useAuthToken() {
  const router = useRouter();

  const verifyAndRefreshToken = useCallback(async () => {
    const token = authService.getAccessToken();

    if (!token) {
      return;
    }

    try {
      // Verify token
      const result = await authService.verifyToken({ token });

      if (!result.valid) {
        if (result.expired) {
          // Token expired, try to refresh
          try {
            const refreshResult = await authService.refreshToken({ token });
            
            // Store new token
            authService.storeAuthData(
              refreshResult.accessToken,
              refreshResult.subscriptionEnd,
              refreshResult.isVerified
            );
            
            console.log('Token refreshed successfully');
          } catch (refreshError: any) {
            // Refresh failed, logout user
            console.error('Token refresh failed:', refreshError);
            authService.clearAuthData();
            router.push('/sign-in');
          }
        } else {
          // Token invalid or revoked, logout user
          console.error('Token is invalid:', result.message);
          authService.clearAuthData();
          router.push('/sign-in');
        }
      }
    } catch (error) {
      console.error('Token verification error:', error);
    }
  }, [router]);

  useEffect(() => {
    // Check token on mount
    verifyAndRefreshToken();

    // Check token every 5 minutes
    const interval = setInterval(() => {
      verifyAndRefreshToken();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [verifyAndRefreshToken]);

  return { verifyAndRefreshToken };
}

/**
 * Custom hook to get authentication status and user info
 */
export function useAuth() {
  const isAuthenticated = authService.isAuthenticated();
  const accessToken = authService.getAccessToken();
  const subscriptionEnd = authService.getSubscriptionEnd();
  const isVerified = authService.getIsVerified();

  const logout = useCallback(async () => {
    try {
      const token = authService.getAccessToken();
      if (token) {
        await authService.logout(token);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      authService.clearAuthData();
    }
  }, []);

  return {
    isAuthenticated,
    accessToken,
    subscriptionEnd,
    isVerified,
    logout,
  };
}
