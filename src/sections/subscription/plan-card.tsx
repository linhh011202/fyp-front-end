import type { ReactElement } from 'react';
import type { Plan } from 'src/services/plans.service';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import List from '@mui/material/List';
import Button from '@mui/material/Button';
import ListItem from '@mui/material/ListItem';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

interface PlanCardProps {
  plan: Plan;
  onSubscribe: (priceId: string) => void;
}

export function PlanCard({ plan, onSubscribe }: PlanCardProps): ReactElement {
  return (
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
          {plan.features.map((feature, index) => (
            <ListItem key={`${plan.id}-feature-${index}`} disableGutters>
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
          onClick={() => onSubscribe(plan.priceId)}
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
  );
}
