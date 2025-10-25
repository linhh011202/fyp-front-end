import type { ChangeEvent, ReactElement } from 'react';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { authService } from 'src/services/auth.service';
import { DashboardContent } from 'src/layouts/dashboard';
import { type Plan, plansService } from 'src/services/plans.service';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const exampleJSON = `{
  "plans": [
    {
      "id": "basic-plan-001",
      "name": "Basic",
      "price": "$10/month",
      "features": [
        "Basic support",
        "Monthly payments",
        "10 GB Storage",
        "Email support"
      ],
      "priceId": "price_1SHpG27ulmHU5ctwMzG3Id2C"
    },
    {
      "id": "premium-plan-001",
      "name": "Premium",
      "price": "$100/year",
      "features": [
        "Premium support",
        "Yearly payments",
        "100 GB Storage",
        "Priority support"
      ],
      "priceId": "price_1SHpGX7ulmHU5ctwyob0dYhg",
      "recommended": true
    }
  ]
}`;

interface DiffItem {
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  planId: string;
  planName: string;
  details?: string;
}

// ----------------------------------------------------------------------

export function JsonPlansEditorView(): ReactElement {
  const [jsonInput, setJsonInput] = useState(exampleJSON);
  const [latestPlans, setLatestPlans] = useState<Plan[]>([]);
  const [latestVersion, setLatestVersion] = useState<number>(0);
  const [loadingLatest, setLoadingLatest] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [diffDialogOpen, setDiffDialogOpen] = useState(false);
  const [diff, setDiff] = useState<DiffItem[]>([]);
  const [backendError, setBackendError] = useState(false);

  // Fetch latest plans on mount
  useEffect(() => {
    fetchLatestPlans();
  }, []);

  const fetchLatestPlans = async () => {
    setLoadingLatest(true);
    setBackendError(false);
    try {
      const result = await plansService.getLatestPlans();
      setLatestPlans(result.plans);
      setLatestVersion(result.version);
      
      // Check if we got empty results - might indicate backend issue
      if (result.plans.length === 0) {
        // This is normal - could just be no plans yet
        // Don't set error unless we know it's a backend issue
      }
    } catch (err) {
      console.error('Error fetching latest plans:', err);
      setBackendError(true);
    } finally {
      setLoadingLatest(false);
    }
  };

  // Validate JSON
  const validateJSON = (): { valid: boolean; plans?: Plan[] } => {
    try {
      const parsed = JSON.parse(jsonInput);

      if (!parsed.plans || !Array.isArray(parsed.plans)) {
        setValidationError('JSON must contain a "plans" array');
        return { valid: false };
      }

      if (parsed.plans.length === 0) {
        setValidationError('Plans array cannot be empty');
        return { valid: false };
      }

      // Validate each plan
      for (let i = 0; i < parsed.plans.length; i += 1) {
        const plan = parsed.plans[i];
        const errors: string[] = [];

        if (!plan.id || typeof plan.id !== 'string') {
          errors.push('id must be a string');
        }
        if (!plan.name || typeof plan.name !== 'string') {
          errors.push('name must be a string');
        }
        if (!plan.price || typeof plan.price !== 'string') {
          errors.push('price must be a string');
        }
        if (!plan.priceId || typeof plan.priceId !== 'string') {
          errors.push('priceId must be a string');
        }
        if (!plan.features || !Array.isArray(plan.features)) {
          errors.push('features must be an array');
        } else if (plan.features.length === 0) {
          errors.push('features array cannot be empty');
        }
        if (plan.recommended !== undefined && typeof plan.recommended !== 'boolean') {
          errors.push('recommended must be a boolean');
        }

        if (errors.length > 0) {
          setValidationError(`Plan at index ${i} (${plan.name || 'unnamed'}): ${errors.join(', ')}`);
          return { valid: false };
        }
      }

      setValidationError(null);
      return { valid: true, plans: parsed.plans };
    } catch (err) {
      setValidationError(`Invalid JSON: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return { valid: false };
    }
  };

  // Compare with latest plans
  const handleCheckDiff = () => {
    const validation = validateJSON();
    if (!validation.valid || !validation.plans) {
      return;
    }

    const newPlans = validation.plans;
    const differences: DiffItem[] = [];

    // Create maps for easier comparison
    const latestMap = new Map(latestPlans.map((p) => [p.id, p]));
    const newMap = new Map(newPlans.map((p) => [p.id, p]));

    // Check for removed plans
    latestPlans.forEach((plan) => {
      if (!newMap.has(plan.id)) {
        differences.push({
          type: 'removed',
          planId: plan.id,
          planName: plan.name,
          details: `Price: ${plan.price}`,
        });
      }
    });

    // Check for added and modified plans
    newPlans.forEach((plan) => {
      const existing = latestMap.get(plan.id);
      if (!existing) {
        differences.push({
          type: 'added',
          planId: plan.id,
          planName: plan.name,
          details: `Price: ${plan.price}, Features: ${plan.features.length}`,
        });
      } else {
        // Check for modifications
        const changes: string[] = [];
        if (existing.name !== plan.name) {
          changes.push(`Name: "${existing.name}" → "${plan.name}"`);
        }
        if (existing.price !== plan.price) {
          changes.push(`Price: "${existing.price}" → "${plan.price}"`);
        }
        if (existing.priceId !== plan.priceId) {
          changes.push(`Stripe ID: "${existing.priceId}" → "${plan.priceId}"`);
        }
        if (existing.recommended !== plan.recommended) {
          changes.push(
            `Recommended: ${existing.recommended ? 'Yes' : 'No'} → ${plan.recommended ? 'Yes' : 'No'}`
          );
        }
        if (JSON.stringify(existing.features) !== JSON.stringify(plan.features)) {
          changes.push(
            `Features: ${existing.features.length} items → ${plan.features.length} items`
          );
        }

        if (changes.length > 0) {
          differences.push({
            type: 'modified',
            planId: plan.id,
            planName: plan.name,
            details: changes.join(', '),
          });
        } else {
          differences.push({
            type: 'unchanged',
            planId: plan.id,
            planName: plan.name,
          });
        }
      }
    });

    setDiff(differences);
    setDiffDialogOpen(true);
  };

  // Submit plans
  const handleSubmit = async () => {
    const validation = validateJSON();
    if (!validation.valid || !validation.plans) {
      setError('Please fix validation errors before submitting');
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
      const result = await plansService.createPlans(validation.plans, token);
      setSuccess(
        `Plans published successfully! Version: ${result.data?.version || 'unknown'}`
      );
      // Refresh latest plans
      await fetchLatestPlans();
    } catch (err: any) {
      console.error('Error creating plans:', err);
      if (err.statusCode === 403) {
        setError('Access denied. You must be an admin to create plans.');
      } else if (err.statusCode === 401) {
        setError('Unauthorized. Please log in again.');
      } else if (err.message) {
        const errorMessage = Array.isArray(err.message) ? err.message.join(', ') : err.message;
        setError(`Failed to create plans: ${errorMessage}`);
      } else {
        setError('Failed to create plans. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Load latest plans into editor
  const handleLoadLatest = () => {
    if (latestPlans.length === 0) {
      setError('No latest plans available to load');
      return;
    }

    const plansObject = { plans: latestPlans };
    setJsonInput(JSON.stringify(plansObject, null, 2));
    setValidationError(null);
    setSuccess('Latest plans loaded into editor');
  };

  // Format JSON
  const handleFormatJSON = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonInput(JSON.stringify(parsed, null, 2));
      setValidationError(null);
    } catch (err) {
      setValidationError(`Cannot format: Invalid JSON - ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const getDiffColor = (type: DiffItem['type']) => {
    switch (type) {
      case 'added':
        return 'success.main';
      case 'removed':
        return 'error.main';
      case 'modified':
        return 'warning.main';
      default:
        return 'text.secondary';
    }
  };

  const getDiffIcon = (type: DiffItem['type']) => {
    switch (type) {
      case 'added':
        return 'mingcute:add-line';
      case 'removed':
        return 'mingcute:close-line';
      case 'modified':
        return 'solar:pen-bold';
      default:
        return 'eva:checkmark-fill';
    }
  };

  return (
    <DashboardContent maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            Plans JSON Editor
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Edit plans as JSON, compare with the latest version, and publish
          </Typography>
        </Box>

        {/* Alert Messages */}
        {backendError && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Backend API Not Available
            </Typography>
            <Typography variant="body2">
              Unable to connect to the Plans API at <code>{import.meta.env.VITE_BACKEND_API_URL}/plans/latest</code>
              <br />
              Please ensure:
            </Typography>
            <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
              <li>Backend server is running</li>
              <li>VITE_BACKEND_API_URL is correctly configured</li>
              <li>/plans/latest endpoint exists</li>
            </Box>
            <Typography variant="body2" sx={{ mt: 1 }}>
              You can still create plans using the editor, but diff comparison won&apos;t work.
            </Typography>
          </Alert>
        )}

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

        {validationError && (
          <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setValidationError(null)}>
            {validationError}
          </Alert>
        )}

        {/* Main Content */}
        <Card>
          <Box sx={{ p: 3 }}>
            {/* Toolbar */}
            <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                size="small"
                onClick={handleLoadLatest}
                disabled={loadingLatest || latestPlans.length === 0}
                startIcon={
                  loadingLatest ? <CircularProgress size={16} /> : <Iconify icon="solar:restart-bold" />
                }
              >
                Load Latest
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={handleFormatJSON}
                startIcon={<Iconify icon="solar:pen-bold" />}
              >
                Format JSON
              </Button>
              <Box sx={{ flexGrow: 1 }} />
              <Button
                variant="outlined"
                size="small"
                onClick={handleCheckDiff}
                startIcon={<Iconify icon="solar:eye-bold" />}
              >
                Check Diff
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={handleSubmit}
                disabled={loading}
                startIcon={
                  loading ? <CircularProgress size={16} /> : <Iconify icon="solar:check-circle-bold" />
                }
              >
                {loading ? 'Publishing...' : 'Publish Plans'}
              </Button>
            </Box>

            {/* JSON Editor */}
            <Box 
              sx={{ 
                borderRadius: 1, 
                border: (theme) => `1px solid ${theme.palette.divider}`,
                backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5',
              }}
            >
              <TextField
                fullWidth
                multiline
                minRows={20}
                maxRows={30}
                value={jsonInput}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setJsonInput(e.target.value);
                  setValidationError(null);
                }}
                placeholder="Enter plans JSON here..."
                sx={{
                  '& .MuiInputBase-root': {
                    padding: 0,
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none',
                  },
                  '& .MuiInputBase-input': {
                    fontFamily: '"Fira Code", "Consolas", "Monaco", monospace',
                    fontSize: '0.875rem',
                    lineHeight: 1.6,
                    padding: 2,
                    color: (theme) => theme.palette.text.primary,
                    backgroundColor: 'transparent',
                    maxHeight: '600px',
                    overflow: 'auto !important',
                    '&::selection': {
                      backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(38, 79, 120, 0.8)' : 'rgba(173, 214, 255, 0.8)',
                    },
                    // JSON syntax-like styling with CSS
                    '&::-webkit-scrollbar': {
                      width: '10px',
                      height: '10px',
                    },
                    '&::-webkit-scrollbar-track': {
                      backgroundColor: 'transparent',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                      borderRadius: '5px',
                      '&:hover': {
                        backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                      },
                    },
                  },
                }}
              />
            </Box>

            {/* Info Box */}
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.neutral', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                <strong>Latest Version:</strong>{' '}
                {loadingLatest 
                  ? 'Loading...' 
                  : latestVersion > 0 
                    ? `v${latestVersion} (${latestPlans.length} plans)` 
                    : 'No plans published yet'}
              </Typography>
            </Box>
          </Box>
        </Card>

        {/* Diff Dialog */}
        <Dialog open={diffDialogOpen} onClose={() => setDiffDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            Changes Comparison
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Comparing with the current published version
            </Typography>
          </DialogTitle>
          <DialogContent>
            {diff.length === 0 ? (
              <Typography color="text.secondary">No changes detected</Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {diff.map((item, index) => (
                  <Card
                    key={index}
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderLeft: 3,
                      borderColor: getDiffColor(item.type),
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Iconify
                        icon={getDiffIcon(item.type)}
                        width={20}
                        sx={{ color: getDiffColor(item.type) }}
                      />
                      <Typography variant="subtitle2" sx={{ color: getDiffColor(item.type) }}>
                        {item.type.toUpperCase()}
                      </Typography>
                      <Typography variant="subtitle1" fontWeight="semibold" sx={{ ml: 1 }}>
                        {item.planName}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      ID: {item.planId}
                    </Typography>
                    {item.details && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {item.details}
                      </Typography>
                    )}
                  </Card>
                ))}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDiffDialogOpen(false)}>Close</Button>
            <Button variant="contained" onClick={handleSubmit} disabled={loading}>
              Publish Changes
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardContent>
  );
}
