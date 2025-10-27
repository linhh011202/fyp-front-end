import type { ReactElement } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { alpha } from '@mui/material/styles';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function SuccessView(): ReactElement {
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
          `linear-gradient(135deg, ${alpha(theme.palette.success.light, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`,
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
        {/* Success Icon */}
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: (theme) => alpha(theme.palette.success.main, 0.12),
            mx: 'auto',
            mb: 3,
          }}
        >
          <Iconify
            icon="solar:check-circle-bold"
            width={48}
            sx={{ color: 'success.main' }}
          />
        </Box>

        {/* Title */}
        <Typography variant="h3" fontWeight="bold" gutterBottom>
          Payment Successful!
        </Typography>

        {/* Description */}
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Thank you for your subscription. Your payment has been processed successfully.
        </Typography>

        {/* Return Button */}
        <Button
          component={RouterLink}
          href="/"
          size="large"
          variant="contained"
          color="success"
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
      </Box>
    </Container>
  );
}
