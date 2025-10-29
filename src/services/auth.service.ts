// Authentication Service
// Handles all authentication-related API calls

const API_URL = import.meta.env.VITE_BACKEND_API_URL;

// Types
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  appId?: string;
  appSecret?: string;
}

export interface RegisterResponse {
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

export interface LoginRequest {
  email: string;
  password: string;
  appId?: string;
  appSecret?: string;
}

export interface LoginResponse {
  statusCode: number;
  success: boolean;
  message: string;
  accessToken: string;
  subscriptionEnd: number;
  isVerified: boolean;
}

export interface RefreshTokenRequest {
  token: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  subscriptionEnd: number;
  isVerified: boolean;
}

export interface VerifyTokenRequest {
  token: string;
}

export interface VerifyTokenResponse {
  statusCode: number;
  valid: boolean;
  expired: boolean;
  user: {
    id: string;
    email: string;
    role: string;
    name: string;
    type: string;
    isVerified: boolean;
  } | null;
  expiresAt: number | null;
  message: string;
}

export interface LogoutResponse {
  statusCode: number;
  message: string;
}

export interface GoogleRegisterRequest {
  email: string;
  name: string;
  password: string;
  appId?: string;
  appSecret?: string;
}

export interface GoogleRegisterResponse {
  statusCode: number;
  success: boolean;
  message: string;
  accessToken: string;
  subscriptionEnd: number;
  isVerified: boolean;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
  success?: boolean;
}

// Helper function to handle API errors
function handleApiError(error: any): never {
  if (error.response) {
    // Server responded with error
    throw error.response;
  } else if (error.request) {
    // Request made but no response
    throw {
      statusCode: 0,
      message: 'Network error. Please check your connection.',
      error: 'NetworkError',
    };
  } else {
    // Something else happened
    throw {
      statusCode: 0,
      message: error.message || 'An unexpected error occurred',
      error: 'UnknownError',
    };
  }
}

// Auth Service
export const authService = {
  /**
   * Register a new user account
   * POST /auth/register
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw { response: result };
      }

      return result;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Login with email and password
   * POST /auth/login
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw { response: result };
      }

      return result;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Refresh an expired access token
   * POST /auth/refresh-token
   */
  async refreshToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw { response: result };
      }

      return result;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Verify if an access token is valid
   * POST /auth/verify-token
   */
  async verifyToken(data: VerifyTokenRequest): Promise<VerifyTokenResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/verify-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      // Note: verify-token may return non-2xx status codes with valid data
      return result;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Logout and revoke current access token
   * POST /auth/logout
   */
  async logout(token: string): Promise<LogoutResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw { response: result };
      }

      return result;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Store authentication data in localStorage
   */
  storeAuthData(accessToken: string, subscriptionEnd: number, isVerified: boolean): void {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('subscriptionEnd', subscriptionEnd.toString());
    localStorage.setItem('isVerified', isVerified.toString());
  },

  /**
   * Get stored access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  },

  /**
   * Get stored subscription end date
   */
  getSubscriptionEnd(): number | null {
    const value = localStorage.getItem('subscriptionEnd');
    return value ? parseInt(value, 10) : null;
  },

  /**
   * Get stored isVerified flag
   */
  getIsVerified(): boolean {
    return localStorage.getItem('isVerified') === 'true';
  },

  /**
   * Clear all authentication data from localStorage
   */
  clearAuthData(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('subscriptionEnd');
    localStorage.removeItem('isVerified');
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  },

  /**
   * Initiate Google OAuth login
   * Redirects to backend Google auth endpoint
   * 
   * The backend will forward the 'prompt' parameter to Google OAuth,
   * forcing the account selection screen to appear every time.
   * This provides better UX for logout → login flow.
   */
  initiateGoogleLogin(redirectUrl?: string, appId?: string, appSecret?: string): void {
    const callbackUrl = redirectUrl || `${window.location.origin}/auth/google/callback`;
    
    // Build URL with all necessary parameters
    const params = new URLSearchParams({
      redirect: callbackUrl,
      prompt: 'select_account', // Forces Google to show account picker (prevents auto-login after logout)
    });
    
    if (appId) params.append('appId', appId);
    if (appSecret) params.append('appSecret', appSecret);
    
    const url = `${API_URL}/auth/google?${params.toString()}`;
    
    console.log('🔐 Initiating Google Login:');
    console.log('- Callback URL:', callbackUrl);
    console.log('- Backend URL:', url);
    console.log('- Prompt:', params.get('prompt'), '(forces account selection)');
    
    window.location.href = url;
  },

  /**
   * Complete Google registration with password
   * POST /auth/google-register
   */
  async googleRegister(data: GoogleRegisterRequest): Promise<GoogleRegisterResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/google-register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw { response: result };
      }

      return result;
    } catch (error) {
      return handleApiError(error);
    }
  },
};
