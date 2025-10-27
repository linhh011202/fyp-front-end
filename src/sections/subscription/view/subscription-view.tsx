import type { ReactElement, SyntheticEvent } from 'react';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import { userService } from 'src/services/user.service';
import { DashboardContent } from 'src/layouts/dashboard';
import { stripeService } from 'src/services/stripe.service';
import { type Plan, plansService } from 'src/services/plans.service';

import { PlanCard } from '../plan-card';
import { JsonPlansEditorView } from '../../admin/json-plans-editor-view';

// ----------------------------------------------------------------------

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `admin-tab-${index}`,
    'aria-controls': `admin-tabpanel-${index}`,
  };
}

// ----------------------------------------------------------------------

export function SubscriptionView(): ReactElement {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingUser, setCheckingUser] = useState(true);
  const [tabValue, setTabValue] = useState(0);

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

  // Check if user is admin
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        setCheckingUser(true);
        const user = await userService.getCurrentUser();
        setIsAdmin(user.role === 'admin');
      } catch (err) {
        console.error('Error checking user role:', err);
        setIsAdmin(false);
      } finally {
        setCheckingUser(false);
      }
    };

    checkUserRole();
  }, []);

  const handleTabChange = (event: SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSubscribe = async (priceId: string) => {
    try {
      const data = await stripeService.createCheckoutSession(priceId);

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
  if (loading || checkingUser) {
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

  // If user is admin, show tabbed interface with JSON editor and subscription view
  if (isAdmin) {
    return (
      <DashboardContent maxWidth="xl">
        <Box sx={{ py: 4 }}>
          {/* Header */}
          <Box textAlign="center" mb={4}>
            <Typography variant="h2" fontWeight="bold" gutterBottom>
              Subscription Plans Management
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
              Create and manage subscription plans for your users
            </Typography>
          </Box>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
              aria-label="admin subscription tabs"
            >
              <Tab label="Plans JSON Editor" {...a11yProps(0)} />
              <Tab label="View Subscriptions" {...a11yProps(1)} />
            </Tabs>
          </Box>

          {/* Tab Panels */}
          <TabPanel value={tabValue} index={0}>
            <JsonPlansEditorView />
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            {/* Display subscription plans for admin */}
            {plans.length === 0 ? (
              <Box textAlign="center" sx={{ py: 8 }}>
                <Typography variant="h5" color="text.secondary" gutterBottom>
                  No subscription plans available at the moment
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Please check back later or contact support
                </Typography>
              </Box>
            ) : (
              <Box>
                <Box textAlign="center" mb={6}>
                  <Typography variant="h3" fontWeight="bold" gutterBottom>
                    Available Plans
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Preview of subscription plans (Subscribe button is disabled for admins)
                  </Typography>
                </Box>
                <Grid container spacing={4} justifyContent="center">
                  {plans.map((plan) => (
                    <Grid key={plan.id} size={{ xs: 12, sm: 6, md: 5 }}>
                      <PlanCard plan={plan} onSubscribe={handleSubscribe} disabled />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </TabPanel>
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
              <PlanCard plan={plan} onSubscribe={handleSubscribe} disabled={isAdmin} />
            </Grid>
          ))}
        </Grid>
      </Box>
    </DashboardContent>
  );
}
