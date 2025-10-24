import type { ReactElement } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import Button from '@mui/material/Button';
import ListItem from '@mui/material/ListItem';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type PlanType = {
  id: string;
  name: string;
  price: string;
  features: string[];
  priceId: string;
  recommended?: boolean;
};

const plans: PlanType[] = [
  {
    id: 'dqddqwdqwdwq',
    name: 'Basic',
    price: '$10',
    features: ['Basic support', 'Monthly payments', '10 GB Storage', 'Email support'],
    priceId: 'price_1SHpG27ulmHU5ctwMzG3Id2C',
  },
  {
    id: 'premdqwdqwdqdqwium',
    name: 'Premium',
    price: '$100',
    features: ['Premium support', 'Yearly payments', '100 GB Storage', 'Priority support'],
    priceId: 'price_1SHpGX7ulmHU5ctwyob0dYhg',
    recommended: true,
  },
];

// ----------------------------------------------------------------------

export function SubscriptionView(): ReactElement {
  const handleSubscribe = async (priceId: string) => {
    try {
      const res = await fetch(`${import.meta.env.BACKEND_API_URL}/stripe-checkout-session`, {
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
    } catch (error) {
      console.error('Subscription error', error);
      alert('An error occurred during checkout.');
    }
  };

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
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: (theme) => theme.shadows[20],
                  },
                  ...(plan.recommended && {
                    border: (theme) => `2px solid ${theme.palette.primary.main}`,
                  }),
                }}
              >
                {plan.recommended && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      px: 2,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                    }}
                  >
                    RECOMMENDED
                  </Box>
                )}

                <CardContent sx={{ flexGrow: 1, p: 4 }}>
                  <Typography variant="h4" fontWeight="semibold" gutterBottom>
                    {plan.name}
                  </Typography>

                  <Box sx={{ my: 3 }}>
                    <Typography variant="h3" fontWeight="extrabold" component="span">
                      {plan.price}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" component="span">
                      /month
                    </Typography>
                  </Box>

                  <List sx={{ mt: 3 }}>
                    {plan.features.map((feature) => (
                      <ListItem key={feature} disableGutters>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <Iconify
                            icon="eva:checkmark-fill"
                            width={24}
                            sx={{ color: 'success.main' }}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={feature}
                          primaryTypographyProps={{
                            variant: 'body1',
                            color: 'text.primary',
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>

                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={() => handleSubscribe(plan.priceId)}
                    sx={{
                      mt: 4,
                      py: 1.5,
                      fontWeight: 'bold',
                      boxShadow: (theme) => theme.shadows[8],
                      '&:hover': {
                        boxShadow: (theme) => theme.shadows[16],
                      },
                    }}
                  >
                    Subscribe Now
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </DashboardContent>
  );
}
