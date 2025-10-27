// User Service
// Handles all user-related API calls

import { getWithAuth } from 'src/utils/fetch-with-auth';

const API_URL = import.meta.env.VITE_BACKEND_API_URL;

// Types
export interface User {
  _id: string;
  name: string;
  email: string;
  type: string;
  role: 'admin' | 'user';
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface GetCurrentUserResponse {
  _id: string;
  name: string;
  email: string;
  type: string;
  role: 'admin' | 'user';
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
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
    throw error.response;
  } else if (error.message) {
    throw {
      statusCode: 0,
      message: error.message,
      error: 'NetworkError',
    };
  } else {
    throw {
      statusCode: 0,
      message: 'An unexpected error occurred',
      error: 'UnknownError',
    };
  }
}

// User Service
export const userService = {
  /**
   * Get current authenticated user
   * GET /users/current
   */
  async getCurrentUser(): Promise<GetCurrentUserResponse> {
    try {
      const response = await getWithAuth(`${API_URL}/users/current`);

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
   * Check if user is admin
   */
  async isAdmin(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return user.role === 'admin';
    } catch {
      return false;
    }
  },
};
