import type { ChangeEvent, ReactElement } from 'react';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';

import { authService } from 'src/services/auth.service';
import { DashboardContent } from 'src/layouts/dashboard';
import { type Plan, plansService } from 'src/services/plans.service';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

interface PlanFormData {
  id: string;
  name: string;
  price: string;
  features: string[];
  priceId: string;
  recommended: boolean;
}

const initialPlanForm: PlanFormData = {
  id: '',
  name: '',
  price: '',
  features: [],
  priceId: '',
  recommended: false,
};

// ----------------------------------------------------------------------

export function CreatePlansView(): ReactElement {
  const [plans, setPlans] = useState<PlanFormData[]>([]);
  const [currentPlan, setCurrentPlan] = useState<PlanFormData>(initialPlanForm);
  const [featureInput, setFeatureInput] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Add or update plan
  const handleSavePlan = () => {
    // Validation
    if (!currentPlan.id.trim()) {
      setError('Plan ID is required');
      return;
    }
    if (!currentPlan.name.trim()) {
      setError('Plan name is required');
      return;
    }
    if (!currentPlan.price.trim()) {
      setError('Plan price is required');
      return;
    }
    if (!currentPlan.priceId.trim()) {
      setError('Stripe Price ID is required');
      return;
    }
    if (currentPlan.features.length === 0) {
      setError('At least one feature is required');
      return;
    }

    // Check for duplicate ID
    if (editIndex === null && plans.some((p) => p.id === currentPlan.id)) {
      setError('Plan ID already exists');
      return;
    }

    setError(null);

    if (editIndex !== null) {
      // Update existing plan
      const updatedPlans = [...plans];
      updatedPlans[editIndex] = currentPlan;
      setPlans(updatedPlans);
    } else {
      // Add new plan
      setPlans([...plans, currentPlan]);
    }

    // Reset form
    setCurrentPlan(initialPlanForm);
    setDialogOpen(false);
    setEditIndex(null);
    setSuccess(editIndex !== null ? 'Plan updated successfully' : 'Plan added successfully');
  };

  // Open dialog for new plan
  const handleAddPlan = () => {
    setCurrentPlan(initialPlanForm);
    setEditIndex(null);
    setDialogOpen(true);
    setError(null);
  };

  // Open dialog for editing plan
  const handleEditPlan = (index: number) => {
    setCurrentPlan({ ...plans[index] });
    setEditIndex(index);
    setDialogOpen(true);
    setError(null);
  };

  // Delete plan
  const handleDeletePlan = (index: number) => {
    setPlans(plans.filter((_, i) => i !== index));
    setSuccess('Plan deleted successfully');
  };

  // Add feature to current plan
  const handleAddFeature = () => {
    if (featureInput.trim()) {
      setCurrentPlan({
        ...currentPlan,
        features: [...currentPlan.features, featureInput.trim()],
      });
      setFeatureInput('');
    }
  };

  // Remove feature from current plan
  const handleRemoveFeature = (index: number) => {
    setCurrentPlan({
      ...currentPlan,
      features: currentPlan.features.filter((_, i) => i !== index),
    });
  };

  // Submit all plans to API
  const handleSubmitPlans = async () => {
    if (plans.length === 0) {
      setError('Please add at least one plan before submitting');
      return;
    }

    const token = authService.getAccessToken();
    if (!token) {
      setError('You must be logged in to create plans');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Convert PlanFormData to Plan format
      const plansToSubmit: Plan[] = plans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        price: plan.price,
        features: plan.features,
        priceId: plan.priceId,
        ...(plan.recommended && { recommended: true }),
      }));

      const result = await plansService.createPlans(plansToSubmit, token);

      setSuccess(
        `Plans created successfully! Version: ${result.data?.version || 'unknown'}`
      );
      setPlans([]); // Clear plans after successful submission
    } catch (err: any) {
      console.error('Error creating plans:', err);
      if (err.statusCode === 403) {
        setError('Access denied. You must be an admin to create plans.');
      } else if (err.statusCode === 401) {
        setError('Unauthorized. Please log in again.');
      } else if (err.message) {
        const errorMessage = Array.isArray(err.message) 
          ? err.message.join(', ') 
          : err.message;
        setError(`Failed to create plans: ${errorMessage}`);
      } else {
        setError('Failed to create plans. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Close dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentPlan(initialPlanForm);
    setEditIndex(null);
    setFeatureInput('');
    setError(null);
  };

  return (
    <DashboardContent maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              Create Subscription Plans
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Design and publish new subscription plans for your users
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="large"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={handleAddPlan}
            disabled={loading}
          >
            Add Plan
          </Button>
        </Box>

        {/* Alert Messages */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Plans Grid */}
        {plans.length > 0 ? (
          <>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {plans.map((plan, index) => (
                <Grid key={plan.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card
                    sx={{
                      height: '100%',
                      position: 'relative',
                      ...(plan.recommended && {
                        border: (theme) => `2px solid ${theme.palette.primary.main}`,
                      }),
                    }}
                  >
                    {plan.recommended && (
                      <Chip
                        label="RECOMMENDED"
                        color="primary"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          fontWeight: 'bold',
                        }}
                      />
                    )}

                    <CardContent>
                      <Typography variant="h5" fontWeight="semibold" gutterBottom>
                        {plan.name}
                      </Typography>

                      <Typography variant="h4" fontWeight="bold" color="primary" sx={{ my: 2 }}>
                        {plan.price}
                      </Typography>

                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                        ID: {plan.id}
                      </Typography>

                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                        Stripe ID: {plan.priceId}
                      </Typography>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Features:
                        </Typography>
                        {plan.features.map((feature, idx) => (
                          <Typography
                            key={idx}
                            variant="body2"
                            color="text.secondary"
                            sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}
                          >
                            <Iconify
                              icon="eva:checkmark-fill"
                              width={16}
                              sx={{ mr: 1, color: 'success.main' }}
                            />
                            {feature}
                          </Typography>
                        ))}
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                        <Button
                          fullWidth
                          variant="outlined"
                          size="small"
                          onClick={() => handleEditPlan(index)}
                          disabled={loading}
                        >
                          Edit
                        </Button>
                        <Button
                          fullWidth
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => handleDeletePlan(index)}
                          disabled={loading}
                        >
                          Delete
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Submit Button */}
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                size="large"
                color="primary"
                onClick={handleSubmitPlans}
                disabled={loading}
                sx={{ minWidth: 200, py: 1.5 }}
                startIcon={loading ? <CircularProgress size={20} /> : <Iconify icon="solar:restart-bold" />}
              >
                {loading ? 'Publishing...' : 'Publish Plans'}
              </Button>
            </Box>
          </>
        ) : (
          <Card sx={{ py: 8 }}>
            <Box textAlign="center">
              <Iconify
                icon="solar:cart-3-bold"
                width={64}
                sx={{ color: 'text.disabled', mb: 2 }}
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No plans added yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Click &quot;Add Plan&quot; to create your first subscription plan
              </Typography>
            </Box>
          </Card>
        )}

        {/* Add/Edit Plan Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editIndex !== null ? 'Edit Plan' : 'Add New Plan'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Plan ID"
                value={currentPlan.id}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setCurrentPlan({ ...currentPlan, id: e.target.value })
                }
                disabled={editIndex !== null}
                helperText="Unique identifier (e.g., basic-plan-001)"
              />

              <TextField
                fullWidth
                label="Plan Name"
                value={currentPlan.name}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setCurrentPlan({ ...currentPlan, name: e.target.value })
                }
                helperText="Display name (e.g., Basic, Premium)"
              />

              <TextField
                fullWidth
                label="Price"
                value={currentPlan.price}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setCurrentPlan({ ...currentPlan, price: e.target.value })
                }
                helperText="Display price (e.g., $10, $100/month)"
              />

              <TextField
                fullWidth
                label="Stripe Price ID"
                value={currentPlan.priceId}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setCurrentPlan({ ...currentPlan, priceId: e.target.value })
                }
                helperText="Stripe price ID from your Stripe dashboard"
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={currentPlan.recommended}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setCurrentPlan({ ...currentPlan, recommended: e.target.checked })
                    }
                  />
                }
                label="Mark as recommended"
              />

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Features
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Add a feature"
                    value={featureInput}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setFeatureInput(e.target.value)
                    }
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                  />
                  <IconButton onClick={handleAddFeature} color="primary">
                    <Iconify icon="mingcute:add-line" />
                  </IconButton>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {currentPlan.features.map((feature, index) => (
                    <Chip
                      key={index}
                      label={feature}
                      onDelete={() => handleRemoveFeature(index)}
                      size="small"
                    />
                  ))}
                </Box>

                {currentPlan.features.length === 0 && (
                  <Typography variant="caption" color="text.secondary">
                    No features added yet
                  </Typography>
                )}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSavePlan} variant="contained">
              {editIndex !== null ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardContent>
  );
}
