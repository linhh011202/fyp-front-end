import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { authService } from 'src/services/auth.service';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function SignUpView() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Check if user is already logged in
  useEffect(() => {
    if (authService.isAuthenticated()) {
      router.push('/');
    }
  }, [router]);

  const handleSignUp = useCallback(async () => {
    // Clear previous messages
    setError('');
    setSuccess('');

    // Validate inputs
    if (!name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (name.length < 3) {
      setError('Name must be at least 3 characters long');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.register({
        name,
        email,
        password,
      });

      // Show success message
      setSuccess(response.message);

      // Clear form
      setName('');
      setEmail('');
      setPassword('');

      // If email verification is disabled, user can login immediately
      if (response.user.isVerified) {
        // Redirect to sign-in after 2 seconds
        setTimeout(() => {
          router.push('/sign-in');
        }, 2000);
      } else {
        // Show message about email verification
        // Redirect to sign-in after 3 seconds
        setTimeout(() => {
          router.push('/sign-in');
        }, 3000);
      }
    } catch (err: any) {
      // Handle error messages
      if (err.message) {
        if (Array.isArray(err.message)) {
          setError(err.message.join(', '));
        } else {
          setError(err.message);
        }
      } else {
        setError('An error occurred during registration');
      }
    } finally {
      setLoading(false);
    }
  }, [name, email, password, router]);

  const renderForm = (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-end',
        flexDirection: 'column',
      }}
    >
      {error && (
        <Alert severity="error" sx={{ width: '100%', mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ width: '100%', mb: 3 }}>
          {success}
        </Alert>
      )}

      <TextField
        fullWidth
        name="name"
        label="Full name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={loading}
        sx={{ mb: 3 }}
        slotProps={{
          inputLabel: { shrink: true },
        }}
      />

      <TextField
        fullWidth
        name="email"
        label="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
        type="email"
        sx={{ mb: 3 }}
        slotProps={{
          inputLabel: { shrink: true },
        }}
      />

      <TextField
        fullWidth
        name="password"
        label="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loading}
        type={showPassword ? 'text' : 'password'}
        slotProps={{
          inputLabel: { shrink: true },
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                  <Iconify icon={showPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
        sx={{ mb: 3 }}
      />

      <Button
        fullWidth
        size="large"
        type="submit"
        color="inherit"
        variant="contained"
        onClick={handleSignUp}
        disabled={loading}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign up'}
      </Button>
    </Box>
  );

  return (
    <>
      <Box
        sx={{
          gap: 1.5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mb: 5,
        }}
      >
        <Typography variant="h5">Sign up</Typography>
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
          }}
        >
          Already have an account?
          <Link component={RouterLink} href="/sign-in" variant="subtitle2" sx={{ ml: 0.5 }}>
            Sign in
          </Link>
        </Typography>
      </Box>
      {renderForm}
      <Divider sx={{ my: 3, '&::before, &::after': { borderTopStyle: 'dashed' } }}>
        <Typography
          variant="overline"
          sx={{ color: 'text.secondary', fontWeight: 'fontWeightMedium' }}
        >
          OR
        </Typography>
      </Divider>
      <Box
        sx={{
          gap: 1,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <IconButton color="inherit">
          <Iconify width={22} icon="socials:google" />
        </IconButton>
        <IconButton color="inherit">
          <Iconify width={22} icon="socials:github" />
        </IconButton>
        <IconButton color="inherit">
          <Iconify width={22} icon="socials:twitter" />
        </IconButton>
      </Box>
    </>
  );
}
