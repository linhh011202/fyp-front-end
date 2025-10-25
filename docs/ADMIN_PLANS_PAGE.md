# Admin Plans Management Page

## Overview
The Admin Plans Management page provides a user interface for administrators to create, edit, and publish subscription plans to the backend API. This page is protected and should only be accessible to users with admin privileges.

## Access

**Route**: `/admin/plans`

**Requirements**:
- User must be logged in
- User must have an admin role
- User must have a valid access token

## Features

### 🎨 Plan Builder Interface
- **Visual Plan Cards**: Preview plans as they will appear to users
- **Drag-and-Drop Style**: Easy-to-use form builder
- **Real-time Preview**: See changes immediately

### ✏️ Plan Management
- **Create Plans**: Add unlimited subscription plans
- **Edit Plans**: Modify existing plans before publishing
- **Delete Plans**: Remove unwanted plans from the list
- **Reorder**: Plans can be arranged in any order

### 📝 Plan Properties

Each plan includes the following fields:

1. **Plan ID** (required)
   - Unique identifier for the plan
   - Cannot be changed after creation
   - Example: `basic-plan-001`, `premium-2025`

2. **Plan Name** (required)
   - Display name shown to users
   - Example: `Basic`, `Premium`, `Enterprise`

3. **Price** (required)
   - Display price string
   - Example: `$10`, `$100/month`, `$999/year`

4. **Stripe Price ID** (required)
   - The actual Stripe price ID for checkout
   - Found in your Stripe dashboard
   - Example: `price_1SHpG27ulmHU5ctwMzG3Id2C`

5. **Features** (required, at least one)
   - Array of feature descriptions
   - Displayed as bullet points with checkmarks
   - Example: `"10 GB Storage"`, `"24/7 Support"`

6. **Recommended** (optional)
   - Boolean flag to highlight a plan
   - Only one plan should be marked as recommended
   - Adds a badge and border highlight

### 🚀 Publishing Workflow

1. **Add Plans**: Click "Add Plan" button
2. **Fill Details**: Complete the plan form
3. **Add Features**: Enter features one by one
4. **Save Plan**: Add to the list
5. **Review**: Check all plans in the grid
6. **Edit/Delete**: Make any necessary changes
7. **Publish**: Click "Publish Plans" to send to API

The publish action creates a new version in the backend with all plans.

## File Structure

```
src/
├── sections/
│   └── admin/
│       ├── index.ts                  # Barrel export
│       └── create-plans-view.tsx     # Main admin component
├── pages/
│   └── admin-plans.tsx               # Route page component
└── routes/
    └── sections.tsx                  # Route configuration (updated)
```

## Component Architecture

### CreatePlansView

Main component that handles the entire plans management interface.

**State Management**:
```typescript
const [plans, setPlans] = useState<PlanFormData[]>([]);          // List of plans
const [currentPlan, setCurrentPlan] = useState<PlanFormData>(); // Plan being edited
const [featureInput, setFeatureInput] = useState('');            // Feature input field
const [dialogOpen, setDialogOpen] = useState(false);             // Dialog visibility
const [editIndex, setEditIndex] = useState<number | null>(null); // Editing index
const [loading, setLoading] = useState(false);                   // API loading state
const [error, setError] = useState<string | null>(null);         // Error messages
const [success, setSuccess] = useState<string | null>(null);     // Success messages
```

**Key Functions**:

#### `handleAddPlan()`
Opens the dialog to create a new plan.

#### `handleEditPlan(index)`
Opens the dialog with the selected plan's data for editing.

#### `handleDeletePlan(index)`
Removes a plan from the list.

#### `handleSavePlan()`
Validates and saves the current plan (add or update).

**Validation includes**:
- Plan ID uniqueness
- Required fields (ID, name, price, priceId)
- At least one feature

#### `handleAddFeature()`
Adds a new feature to the current plan's feature list.

#### `handleRemoveFeature(index)`
Removes a feature from the current plan.

#### `handleSubmitPlans()`
Publishes all plans to the backend API.

**Process**:
1. Validates there's at least one plan
2. Gets the access token
3. Converts plans to API format
4. Calls `plansService.createPlans()`
5. Shows success/error message
6. Clears plans on success

## UI Components

### Plan Cards Grid
- Displays all created plans
- Shows plan details: name, price, ID, features
- Recommended badge for highlighted plans
- Edit and Delete buttons

### Add/Edit Dialog
- Modal dialog for plan creation/editing
- Form fields for all plan properties
- Feature management with chips
- Validation feedback

### Empty State
- Shown when no plans exist
- Encourages user to add first plan
- Clean, centered design

### Loading State
- Circular progress indicator
- Disabled form elements
- "Publishing..." button text

### Alert Messages
- **Success**: Green alert for successful operations
- **Error**: Red alert for failures
- Dismissible with close button

## API Integration

### Service Used
`plansService.createPlans(plans: Plan[], token: string)`

### Request Format
```typescript
{
  data: string  // JSON stringified plans object
}
```

### Error Handling

The component handles various error scenarios:

1. **403 Forbidden**: User doesn't have admin privileges
2. **401 Unauthorized**: Token expired or invalid
3. **400 Bad Request**: Invalid data structure
4. **Network Error**: Connection issues

All errors are displayed in user-friendly alert messages.

## Usage Example

### Creating Plans

1. Navigate to `/admin/plans`
2. Click "Add Plan"
3. Fill in plan details:
   ```
   Plan ID: basic-plan-2025
   Plan Name: Basic
   Price: $10/month
   Stripe Price ID: price_1SHpG27ulmHU5ctwMzG3Id2C
   ```
4. Add features:
   - Type "10 GB Storage" and press Enter
   - Type "Email Support" and press Enter
   - Type "Monthly Billing" and press Enter
5. Click "Add"
6. Repeat for other plans
7. Click "Publish Plans"

### Editing Plans

1. Find the plan card you want to edit
2. Click the "Edit" button
3. Modify any field except Plan ID
4. Add or remove features
5. Click "Update"
6. Click "Publish Plans" to apply changes

### Recommended Plan

Only mark one plan as recommended:
1. When creating/editing a plan
2. Check "Mark as recommended"
3. Uncheck this for other plans
4. The recommended plan will have:
   - Blue border
   - "RECOMMENDED" badge
   - Higher visual prominence

## Security Considerations

### Authentication Required
The page fetches the access token from localStorage:
```typescript
const token = authService.getAccessToken();
```

### Admin Authorization
The backend validates:
- Token is valid
- User has admin role
- User's email is verified

### Token Refresh
If the token expires during the session, the user needs to:
1. Log out
2. Log back in with admin credentials
3. Retry the operation

## Best Practices

### Plan IDs
- Use consistent naming: `{tier}-plan-{version}`
- Examples: `basic-plan-001`, `premium-plan-2025`
- Helps track plan evolution across versions

### Pricing Display
- Include billing period: `$10/month`, `$100/year`
- Be clear about currency
- Use consistent formatting

### Features
- Be specific and measurable
- Start with most important features
- Use 3-7 features per plan
- Keep descriptions concise

### Stripe Price IDs
- Create prices in Stripe first
- Use test mode price IDs for testing
- Use production price IDs for live plans
- Double-check before publishing

## Validation Rules

### Plan ID
- Required
- Must be unique in the current list
- Cannot be changed after saving to list
- Alphanumeric with hyphens/underscores

### Plan Name
- Required
- Display name for users
- Should be short and memorable

### Price
- Required
- String format (allows flexible formatting)
- Include currency and period

### Stripe Price ID
- Required
- Must match format: `price_*`
- Must exist in your Stripe account

### Features
- At least one required
- Each feature is a string
- Displayed with checkmark icons

### Recommended
- Optional boolean
- Best practice: Only one plan recommended

## Troubleshooting

### "Access denied. You must be an admin to create plans."
**Solution**: Verify your account has admin role in the backend database.

### "Unauthorized. Please log in again."
**Solution**: Your token has expired. Log out and log back in.

### "Plan ID already exists"
**Solution**: Choose a different unique ID for the plan.

### "At least one feature is required"
**Solution**: Add at least one feature to the plan before saving.

### Plans not appearing after publish
**Solution**: 
1. Check browser console for errors
2. Verify the API response in Network tab
3. Navigate to `/subscription` to see if plans appear

### Stripe checkout not working
**Solution**: 
1. Verify Stripe Price IDs are correct
2. Check Stripe dashboard for price status
3. Ensure prices are active, not archived

## Testing

### Manual Testing Checklist

- [ ] Create a plan with all required fields
- [ ] Create a plan with recommended flag
- [ ] Edit an existing plan
- [ ] Delete a plan
- [ ] Add multiple features
- [ ] Remove features
- [ ] Try to save without required fields (should show error)
- [ ] Try to create duplicate Plan ID (should show error)
- [ ] Publish plans successfully
- [ ] Verify plans appear on `/subscription` page
- [ ] Test with non-admin account (should fail)
- [ ] Test with expired token (should prompt login)

### Testing with Different Scenarios

1. **Empty Start**: Begin with no plans, add first one
2. **Multiple Plans**: Create 3-5 plans with various features
3. **Recommended Plan**: Mark one plan as recommended
4. **Edit After Create**: Create, then immediately edit
5. **Delete and Recreate**: Delete a plan and add it back
6. **Long Feature Lists**: Add 10+ features to one plan
7. **Special Characters**: Use special characters in price/name
8. **Very Long Names**: Test UI with long plan names

## Accessibility

- All form fields have proper labels
- Dialog can be closed with Escape key
- Feature input supports Enter key to add
- Success/error messages are screen-reader friendly
- Buttons have descriptive text
- Color is not the only indicator (uses text too)

## Future Enhancements

Potential improvements:

1. **Bulk Import**: Import plans from JSON/CSV file
2. **Plan Templates**: Predefined plan templates
3. **Preview Mode**: Preview how plans look to users
4. **Draft Saving**: Save drafts without publishing
5. **Version History**: View previous plan versions
6. **Plan Comparison**: Compare current vs. new version
7. **Validation Rules**: Custom validation rules
8. **Rich Text Features**: Markdown support for features
9. **Plan Ordering**: Drag-and-drop to reorder
10. **Copy Plan**: Duplicate existing plan
11. **Plan Scheduling**: Schedule plan changes
12. **Analytics**: Track which plans are popular

## Related Documentation

- [Plans API Documentation](./PLANS_API.md)
- [Subscription Page Documentation](./SUBSCRIPTION_PAGE.md)
- [Authentication Guide](./AUTHENTICATION_GUIDE.md)

## Changelog

### Version 1.0.0 (2025-10-25)
- ✨ Initial implementation
- ✨ Create, edit, delete plans
- ✨ Feature management
- ✨ Recommended plan support
- ✨ Real-time validation
- ✨ Success/error handling
- ✨ Responsive design
- ✨ Admin authentication
- ✨ API integration with Plans service
