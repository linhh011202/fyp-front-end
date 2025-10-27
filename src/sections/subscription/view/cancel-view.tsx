import type { ReactElement } from 'react';

import { useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { alpha } from '@mui/material/styles';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function CancelView(): ReactElement {
  const navigate = useNavigate();

  const handleTryAgain = () => {
    navigate(-1);
  };

  return (
    <Container
      sx={{
        py: 10,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
        justifyContent: 'center',
        background: (theme) =>
          `linear-gradient(135deg, ${alpha(theme.palette.error.light, 0.1)} 0%, ${alpha(theme.palette.error.main, 0.05)} 100%)`,
      }}
    >
      <Box
        sx={{
          maxWidth: 480,
          textAlign: 'center',
          bgcolor: 'background.paper',
          borderRadius: 3,
          boxShadow: (theme) => theme.shadows[20],
          p: 5,
          transition: 'transform 0.3s ease-in-out',
          '&:hover': {
            transform: 'scale(1.02)',
          },
        }}
      >
        {/* Cancel Icon */}
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: (theme) => alpha(theme.palette.error.main, 0.12),
            mx: 'auto',
            mb: 3,
          }}
        >
          <Iconify
            icon="mingcute:close-line"
            width={48}
            sx={{ color: 'error.main' }}
          />
        </Box>

        {/* Title */}
        <Typography variant="h3" fontWeight="bold" gutterBottom>
          Payment Cancelled
        </Typography>

        {/* Description */}
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Your payment process was cancelled. No charges were made to your account.
        </Typography>

        {/* Action Buttons */}
        <Stack spacing={2}>
          <Button
            component={RouterLink}
            href="/"
            size="large"
            variant="contained"
            color="error"
            fullWidth
            sx={{
              boxShadow: (theme) => theme.shadows[8],
              '&:hover': {
                boxShadow: (theme) => theme.shadows[12],
              },
            }}
          >
            Return to Home
          </Button>

          <Button
            onClick={handleTryAgain}
            size="large"
            variant="outlined"
            color="inherit"
            fullWidth
          >
            Try Again
          </Button>
        </Stack>
      </Box>
    </Container>
  );
}
