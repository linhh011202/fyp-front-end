/**
 * Example component demonstrating how to make authenticated API requests
 * This file serves as a reference for developers
 */

import { useState, useEffect } from 'react';

import { useAuth } from 'src/hooks/use-auth';

import { getWithAuth, postWithAuth, fetchWithAuth } from 'src/utils/fetch-with-auth';

export function AuthenticatedRequestExample() {
  const { isAuthenticated, accessToken, subscriptionEnd, isVerified } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Example 1: Simple GET request
  const handleGetRequest = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await getWithAuth(`${import.meta.env.VITE_API_URL}/api/user/profile`);
      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Example 2: POST request with body
  const handlePostRequest = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await postWithAuth(
        `${import.meta.env.VITE_API_URL}/api/data`,
        {
          name: 'Example Item',
          description: 'This is an example',
        }
      );

      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to create data');
    } finally {
      setLoading(false);
    }
  };

  // Example 3: Custom fetch with auto-refresh
  const handleCustomRequest = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetchWithAuth(
        `${import.meta.env.VITE_API_URL}/api/custom-endpoint`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ key: 'value' }),
          // Auto-refresh is enabled by default
          autoRefresh: true,
        }
      );

      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  // Example 4: Request without auto-refresh
  const handleRequestWithoutAutoRefresh = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetchWithAuth(
        `${import.meta.env.VITE_API_URL}/api/endpoint`,
        {
          method: 'GET',
          autoRefresh: false, // Disable auto-refresh for this request
        }
      );

      if (response.status === 401) {
        // Handle unauthorized manually
        setError('Unauthorized. Please login again.');
        return;
      }

      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Authenticated Request Examples</h2>

      {/* Display authentication status */}
      <div>
        <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
        <p>Token: {accessToken ? '***' + accessToken.slice(-10) : 'None'}</p>
        <p>Subscription End: {subscriptionEnd ? new Date(subscriptionEnd).toLocaleDateString() : 'N/A'}</p>
        <p>Email Verified: {isVerified ? 'Yes' : 'No'}</p>
      </div>

      {/* Example buttons */}
      <div>
        <button onClick={handleGetRequest} disabled={loading}>
          GET Request Example
        </button>
        <button onClick={handlePostRequest} disabled={loading}>
          POST Request Example
        </button>
        <button onClick={handleCustomRequest} disabled={loading}>
          Custom Request Example
        </button>
        <button onClick={handleRequestWithoutAutoRefresh} disabled={loading}>
          Request Without Auto-Refresh
        </button>
      </div>

      {/* Display results */}
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {data && (
        <pre>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

// Example: Using in a React component with useEffect
export function DataFetchExample() {
  const [userData, setUserData] = useState<any>(null);

  // Fetch data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await getWithAuth(`${import.meta.env.VITE_API_URL}/api/user/profile`);
        const data = await response.json();
        setUserData(data);
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };

    fetchUserData();
  }, []);

  return (
    <div>
      {userData ? (
        <div>
          <h3>User Profile</h3>
          <p>Name: {userData.name}</p>
          <p>Email: {userData.email}</p>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}

// Example: Form submission with authenticated POST
export function CreateItemForm() {
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await postWithAuth(
        `${import.meta.env.VITE_API_URL}/api/items`,
        formData
      );

      if (response.ok) {
        const result = await response.json();
        console.log('Item created:', result);
        // Reset form
        setFormData({ name: '', description: '' });
      } else {
        const error = await response.json();
        console.error('Failed to create item:', error);
      }
    } catch (error) {
      console.error('Request failed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Name"
        required
      />
      <textarea
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        placeholder="Description"
      />
      <button type="submit" disabled={submitting}>
        {submitting ? 'Creating...' : 'Create Item'}
      </button>
    </form>
  );
}
