// Stripe Service
// Handles all Stripe-related API calls

import { postWithAuth } from 'src/utils/fetch-with-auth';

const API_URL = import.meta.env.VITE_BACKEND_API_URL;

// Types
export interface CreateCheckoutSessionRequest {
  priceId: string;
}

export interface CreateCheckoutSessionResponse {
  url: string;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
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

// Stripe Service
export const stripeService = {
  /**
   * Create a Stripe checkout session
   * POST /stripe/stripe-checkout-session
   * Requires authentication
   */
  async createCheckoutSession(
    priceId: string
  ): Promise<CreateCheckoutSessionResponse> {
    try {
      const response = await postWithAuth(
        `${API_URL}/stripe/stripe-checkout-session`,
        { priceId }
      );

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
