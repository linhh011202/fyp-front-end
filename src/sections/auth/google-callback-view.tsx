import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';

import { useRouter } from 'src/routes/hooks';

import { authService } from 'src/services/auth.service';

import { GooglePasswordForm } from 'src/components/google-password-form';

// ----------------------------------------------------------------------

interface UserInfo {
  email: string;
  name: string;
}

export function GoogleCallbackView() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Check if user needs to set password (new user)
    if (params.get('requiresPassword') === 'true') {
      const email = params.get('email');
      const name = params.get('name');

      if (email && name) {
        setUserInfo({ email, name });
        setShowPasswordForm(true);
        setLoading(false);
      } else {
        setError('Missing user information');
        setLoading(false);
      }
    }
    // Check if we got an access token (existing user)
    else if (params.get('token')) {
      const token = params.get('token');
      const subscriptionEnd = params.get('subscriptionEnd');
      const isVerified = params.get('isVerified');

      if (token) {
        // Store authentication data
        authService.storeAuthData(
          token,
          subscriptionEnd ? parseInt(subscriptionEnd, 10) : 0,
          isVerified === 'true'
        );

        // Redirect to dashboard
        router.push('/');
      } else {
        setError('Authentication failed');
        setLoading(false);
      }
    }
    // Check for errors
    else if (params.get('error')) {
      setError(params.get('message') || 'Authentication failed');
      setLoading(false);
    } else {
      setError('Invalid callback parameters');
      setLoading(false);
    }
  }, [router]);

  const handlePasswordSubmit = async (password: string) => {
    if (!userInfo) {
      throw new Error('User information not available');
    }

    const response = await authService.googleRegister({
      email: userInfo.email,
      name: userInfo.name,
      password,
    });

    // Store authentication data
    authService.storeAuthData(
      response.accessToken,
      response.subscriptionEnd,
      response.isVerified
    );

    // Redirect to dashboard
    router.push('/');
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          p: 3,
        }}
      >
        <Alert
          severity="error"
          sx={{ maxWidth: 480 }}
          action={
            <Box sx={{ mt: 2 }}>
              <button
                type="button"
                onClick={() => router.push('/sign-in')}
                style={{
                  padding: '8px 16px',
                  background: '#d32f2f',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Back to Sign In
              </button>
            </Box>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  if (showPasswordForm && userInfo) {
    return <GooglePasswordForm email={userInfo.email} name={userInfo.name} onSubmit={handlePasswordSubmit} />;
  }

  return null;
}
