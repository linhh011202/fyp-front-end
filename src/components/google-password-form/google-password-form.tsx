import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CardContent from '@mui/material/CardContent';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

interface GooglePasswordFormProps {
  email: string;
  name: string;
  onSubmit: (password: string) => Promise<void>;
}

export function GooglePasswordForm({ email, name, onSubmit }: GooglePasswordFormProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await onSubmit(password);
    } catch (err: any) {
      if (err.message) {
        if (Array.isArray(err.message)) {
          setError(err.message.join(', '));
        } else {
          setError(err.message);
        }
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

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
      <Card sx={{ maxWidth: 480, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" sx={{ mb: 2 }}>
              Complete Your Registration
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 1 }}>
              Welcome, {name}!
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Set a password to complete your account setup
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.disabled', mt: 1 }}>
              {email}
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              inputProps={{ minLength: 8 }}
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

            <TextField
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
              inputProps={{ minLength: 8 }}
              slotProps={{
                inputLabel: { shrink: true },
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        <Iconify
                          icon={showConfirmPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                        />
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
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Complete Registration'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
