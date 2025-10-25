# Subscription Plans Page

## Overview
The subscription plans page dynamically fetches and displays subscription plans from the backend API. It provides a clean, responsive interface for users to view and subscribe to different plans.

## Features

### 🎯 Dynamic Plan Loading
- Fetches the latest plans from the `/plans/latest` API endpoint
- No hardcoded plans data - all content is driven by the API
- Automatic refresh on component mount

### 🎨 Enhanced UI/UX
- **Loading State**: Skeleton loaders while fetching data
- **Error State**: User-friendly error messages with retry functionality
- **Empty State**: Informative message when no plans are available
- **Hover Effects**: Cards animate on hover for better interactivity
- **Recommended Badge**: Highlights recommended plans with a special badge

### 📱 Responsive Design
- Mobile-first approach
- Grid layout adapts to screen sizes:
  - Mobile: 1 column
  - Tablet: 2 columns
  - Desktop: 2 columns (centered)

### ✅ Features per Plan Card
- Plan name and pricing
- Feature list with checkmark icons
- Stripe integration for subscriptions
- Visual distinction for recommended plans

## Files Structure

```
src/
├── services/
│   └── plans.service.ts          # API service for fetching plans
├── sections/
│   └── subscription/
│       ├── index.ts              # Barrel export
│       ├── plan-card.tsx         # Individual plan card component
│       └── view/
│           ├── index.ts          # Barrel export
│           └── subscription-view.tsx  # Main subscription page
└── pages/
    └── subscription.tsx          # Route page component
```

## API Integration

### Plans Service (`plans.service.ts`)

The plans service provides two main methods:

#### `getLatestPlans()`
Fetches the latest version of plans from the backend.

```typescript
const plans = await plansService.getLatestPlans();
// Returns: Plan[]
```

**Response handling:**
- Returns an empty array if no plans exist (version 0)
- Parses the JSON string from the API response
- Handles errors gracefully by returning empty array

#### `createPlans()` (Admin only)
Creates a new version of plans (requires admin token).

```typescript
await plansService.createPlans(plans, adminToken);
```

### Plan Type Definition

```typescript
interface Plan {
  id: string;           // Unique plan identifier
  name: string;         // Plan name (e.g., "Basic", "Premium")
  price: string;        // Display price (e.g., "$10", "$100")
  features: string[];   // Array of feature descriptions
  priceId: string;      // Stripe price ID for checkout
  recommended?: boolean; // Optional recommended flag
}
```

## Components

### SubscriptionView

Main component that orchestrates the entire subscription page.

**State Management:**
- `plans`: Array of Plan objects
- `loading`: Boolean for loading state
- `error`: String for error messages

**Lifecycle:**
1. Mount → Fetch plans from API
2. Loading → Show skeleton loaders
3. Success → Display plan cards
4. Error → Show error message with retry
5. Empty → Show "no plans" message

**Subscribe Flow:**
1. User clicks "Subscribe Now" button
2. Sends POST request to `/stripe-checkout-session` with priceId
3. Receives Stripe checkout URL
4. Redirects user to Stripe checkout page

### PlanCard

Reusable component for displaying individual plan cards.

**Props:**
```typescript
interface PlanCardProps {
  plan: Plan;
  onSubscribe: (priceId: string) => void;
}
```

**Features:**
- Recommended badge (conditional)
- Hover animations
- Feature list with checkmarks
- Subscribe button with Stripe integration

## Usage

### Basic Usage

The subscription page is already set up and can be accessed via the route defined in your routing configuration.

```typescript
import { SubscriptionView } from 'src/sections/subscription/view';

export default function Page() {
  return <SubscriptionView />;
}
```

### Customizing the Subscribe Flow

To modify the subscription behavior, update the `handleSubscribe` function in `subscription-view.tsx`:

```typescript
const handleSubscribe = async (priceId: string) => {
  // Custom logic here
  // Current: Redirects to Stripe checkout
  // Can be modified to include authentication, validation, etc.
};
```

## Environment Variables

Required environment variable:

```env
VITE_BACKEND_API_URL=http://localhost:3000
```

This should point to your backend API server.

## API Endpoints Used

### GET /plans/latest
- **Method**: GET
- **Auth**: None (public)
- **Description**: Fetches the latest version of subscription plans
- **Response**: 
  ```json
  {
    "statusCode": 200,
    "message": "Latest plans retrieved successfully",
    "data": {
      "plans": "{\"plans\":[...]}",
      "version": 1
    }
  }
  ```

### POST /stripe-checkout-session
- **Method**: POST
- **Auth**: Optional
- **Body**: `{ "priceId": "price_xxx" }`
- **Description**: Creates a Stripe checkout session
- **Response**: 
  ```json
  {
    "url": "https://checkout.stripe.com/..."
  }
  ```

## Error Handling

The page handles three types of errors:

1. **Network Errors**: Connection issues with the backend
2. **API Errors**: Backend returns error response
3. **Empty State**: No plans available (version 0)

All errors are user-friendly and provide actionable feedback.

## Styling

Uses Material-UI (MUI) components with custom styling:

- **Theme Integration**: Respects the app's theme settings
- **Shadow Effects**: Elevation changes on hover
- **Color Scheme**: Primary color for accents, success color for checkmarks
- **Typography**: Consistent font weights and sizes

## Testing Considerations

### Testing the Loading State
```typescript
// Mock delayed API response
jest.mock('src/services/plans.service', () => ({
  plansService: {
    getLatestPlans: () => new Promise(resolve => 
      setTimeout(() => resolve([...]), 2000)
    )
  }
}));
```

### Testing the Error State
```typescript
// Mock API failure
jest.mock('src/services/plans.service', () => ({
  plansService: {
    getLatestPlans: () => Promise.reject(new Error('API Error'))
  }
}));
```

### Testing the Empty State
```typescript
// Mock empty plans
jest.mock('src/services/plans.service', () => ({
  plansService: {
    getLatestPlans: () => Promise.resolve([])
  }
}));
```

## Future Enhancements

Potential improvements for the subscription page:

1. **Plan Comparison**: Side-by-side feature comparison
2. **Toggle Period**: Switch between monthly/yearly pricing
3. **Current Plan Indicator**: Show user's active plan
4. **Plan History**: Display user's subscription history
5. **Promo Codes**: Apply discount codes during checkout
6. **FAQ Section**: Common questions about plans
7. **Free Trial**: Option to start with a trial period
8. **Currency Selector**: Multi-currency support
9. **Plan Upgrades**: Direct upgrade from current plan
10. **Testimonials**: Customer reviews for each plan

## Troubleshooting

### Plans Not Loading
1. Check if `VITE_BACKEND_API_URL` is set correctly
2. Verify backend server is running
3. Check network tab for API errors
4. Ensure `/plans/latest` endpoint is accessible

### Stripe Checkout Not Working
1. Verify priceId format in the plans data
2. Check Stripe API keys in backend
3. Ensure `/stripe-checkout-session` endpoint is configured
4. Verify CORS settings allow the frontend domain

### Styling Issues
1. Ensure Material-UI is properly installed
2. Check theme configuration
3. Verify Grid component imports (MUI v6 uses different syntax)
4. Clear browser cache

## Dependencies

Required packages:
- `@mui/material`: UI components
- `@mui/system`: Styling utilities
- `react`: Core framework

## Related Documentation

- [Plans API Documentation](../../docs/PLANS_API.md)
- [Authentication Guide](../../docs/AUTHENTICATION_GUIDE.md)
- [Stripe Integration](../../docs/STRIPE_INTEGRATION.md) (if exists)

## Changelog

### Version 1.0.0 (2025-10-25)
- ✨ Initial implementation
- ✨ Dynamic plan loading from API
- ✨ Loading, error, and empty states
- ✨ Reusable PlanCard component
- ✨ Stripe checkout integration
- ✨ Responsive design
- ✨ Hover animations and effects
- ✨ Recommended plan badge
