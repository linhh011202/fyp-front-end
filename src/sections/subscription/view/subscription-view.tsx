import type { ReactElement } from 'react';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';
import { type Plan, plansService } from 'src/services/plans.service';

import { PlanCard } from '../plan-card';

// ----------------------------------------------------------------------

export function SubscriptionView(): ReactElement {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch plans on component mount
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await plansService.getLatestPlans();
        setPlans(result.plans);
      } catch (err) {
        console.error('Error loading plans:', err);
        setError('Failed to load subscription plans. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handleSubscribe = async (priceId: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/stripe-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      });

      const data = await res.json();

      if (data?.url) {
        window.location.href = data.url;
      } else {
        alert('Failed to redirect. Please try again.');
      }
    } catch (err) {
      console.error('Subscription error', err);
      alert('An error occurred during checkout.');
    }
  };

  // Loading state
  if (loading) {
    return (
      <DashboardContent>
        <Box sx={{ py: 4 }}>
          <Box textAlign="center" mb={8}>
            <Typography variant="h2" fontWeight="bold" gutterBottom>
              Choose Your Plan
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
              Select the perfect plan for your needs
            </Typography>
          </Box>

          <Grid container spacing={4} justifyContent="center">
            {[1, 2].map((index) => (
              <Grid key={index} size={{ xs: 12, sm: 6, md: 5 }}>
                <Card sx={{ p: 4 }}>
                  <Skeleton variant="text" width="60%" height={40} />
                  <Skeleton variant="text" width="40%" height={60} sx={{ my: 2 }} />
                  <Skeleton variant="rectangular" height={200} />
                  <Skeleton variant="rectangular" height={48} sx={{ mt: 3 }} />
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </DashboardContent>
    );
  }

  // Error state
  if (error) {
    return (
      <DashboardContent>
        <Box sx={{ py: 4 }}>
          <Box textAlign="center" mb={8}>
            <Typography variant="h2" fontWeight="bold" gutterBottom>
              Choose Your Plan
            </Typography>
          </Box>
          <Box sx={{ maxWidth: 600, mx: 'auto' }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
            <Button
              fullWidth
              variant="contained"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </Box>
        </Box>
      </DashboardContent>
    );
  }

  // Empty state
  if (plans.length === 0) {
    return (
      <DashboardContent>
        <Box sx={{ py: 4 }}>
          <Box textAlign="center" mb={8}>
            <Typography variant="h2" fontWeight="bold" gutterBottom>
              Choose Your Plan
            </Typography>
          </Box>
          <Box textAlign="center" sx={{ py: 8 }}>
            <Typography variant="h5" color="text.secondary" gutterBottom>
              No subscription plans available at the moment
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Please check back later or contact support
            </Typography>
          </Box>
        </Box>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box textAlign="center" mb={8}>
          <Typography variant="h2" fontWeight="bold" gutterBottom>
            Choose Your Plan
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            Select the perfect plan for your needs
          </Typography>
        </Box>

        {/* Plans Grid */}
        <Grid container spacing={4} justifyContent="center">
          {plans.map((plan) => (
            <Grid key={plan.id} size={{ xs: 12, sm: 6, md: 5 }}>
              <PlanCard plan={plan} onSubscribe={handleSubscribe} />
            </Grid>
          ))}
        </Grid>
      </Box>
    </DashboardContent>
  );
}
