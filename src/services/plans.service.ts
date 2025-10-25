// Plans Service
// Handles all plans-related API calls

const API_URL = import.meta.env.VITE_BACKEND_API_URL;

// Types
export interface Plan {
  id: string;
  name: string;
  price: string;
  features: string[];
  priceId: string;
  recommended?: boolean;
}

export interface PlansData {
  plans: Plan[];
}

export interface PlansResponse {
  statusCode: number;
  message: string;
  data: {
    plans: string; // JSON string containing plans data
    version: number;
  } | null;
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

// Plans Service
export const plansService = {
  /**
   * Get the latest version of plans
   * GET /plans/latest
   * No authentication required
   */
  async getLatestPlans(): Promise<{ plans: Plan[]; version: number }> {
    try {
      const response = await fetch(`${API_URL}/plans/latest`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('API returned non-JSON response. Backend might not be running or endpoint does not exist.');
        return { plans: [], version: 0 };
      }

      const result: PlansResponse = await response.json();

      if (!response.ok) {
        console.error('API error:', result);
        return { plans: [], version: 0 };
      }

      // Check if there are plans available
      if (!result.data || result.data.version === 0) {
        return { plans: [], version: 0 };
      }

      // Parse the JSON string
      const plansData: PlansData = JSON.parse(result.data.plans);
      return { plans: plansData.plans || [], version: result.data.version };
    } catch (error) {
      // If it's a parsing error or API error, return empty array
      console.error('Error fetching plans:', error);
      return { plans: [], version: 0 };
    }
  },

  /**
   * Create new plans (Admin only)
   * POST /plans
   * Requires admin authentication
   */
  async createPlans(plans: Plan[], token: string): Promise<PlansResponse> {
    try {
      const plansData: PlansData = { plans };
      const dataString = JSON.stringify(plansData);

      const response = await fetch(`${API_URL}/plans`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: dataString }),
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
