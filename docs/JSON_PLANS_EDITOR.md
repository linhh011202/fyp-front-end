# JSON Plans Editor - Quick Reference

## Overview
A simplified admin interface for managing subscription plans through direct JSON editing. Perfect for developers who prefer working with JSON directly.

## Access
**URL**: `http://localhost:3040/admin/plans`

**Requirements**: Admin authentication

## Features

### 📝 Direct JSON Editing
- Large text area with monospace font
- Real-time validation
- Syntax error detection
- Auto-formatting

### 🔍 Diff Comparison
- Compare your changes with the latest published version
- Visual indicators for:
  - ✅ **Added** plans (green)
  - ❌ **Removed** plans (red)
  - ✏️ **Modified** plans (yellow)
  - ⚪ **Unchanged** plans (gray)
- Detailed change descriptions

### 🚀 Quick Actions
- **Load Latest**: Fetch current plans into editor
- **Format JSON**: Auto-format and prettify JSON
- **Check Diff**: Compare with published version
- **Publish Plans**: Submit to API

## JSON Structure

```json
{
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
}
```

## Workflow

### 1️⃣ Edit Plans
- Type or paste JSON directly
- Or click "Load Latest" to start with current plans
- Edit as needed

### 2️⃣ Check Changes
- Click "Check Diff" to see what will change
- Review added, removed, and modified plans
- Verify all changes are intentional

### 3️⃣ Publish
- Click "Publish Plans" (or in diff dialog)
- Plans are immediately published
- New version created in backend

## Validation

The editor validates:
- ✅ Valid JSON syntax
- ✅ Required `plans` array
- ✅ Each plan has: `id`, `name`, `price`, `priceId`, `features`
- ✅ Features is a non-empty array
- ✅ `recommended` is boolean (if present)

## Diff Dialog

Shows changes in a clear format:

**Added Plans**: New plans being added
**Removed Plans**: Plans being deleted from current version
**Modified Plans**: Changes to existing plans with details like:
- Name changes
- Price changes
- Stripe ID changes
- Feature list changes
- Recommended status changes

**Unchanged Plans**: Plans with no changes (shown in gray)

## Tips

### Quick Edit
1. Click "Load Latest"
2. Edit the JSON
3. Click "Publish Plans"

### Copy from Stripe
1. Create prices in Stripe dashboard
2. Copy price IDs
3. Paste into JSON
4. Add plan details

### Backup Before Changes
1. Click "Load Latest"
2. Copy JSON to file
3. Make changes
4. Can restore if needed

## Keyboard Shortcuts

- **Ctrl/Cmd + A**: Select all JSON
- **Ctrl/Cmd + C**: Copy JSON
- **Ctrl/Cmd + V**: Paste JSON

## Error Messages

- **"JSON must contain a 'plans' array"**: Add `{"plans": [...]}`
- **"Plans array cannot be empty"**: Add at least one plan
- **"Invalid JSON"**: Check syntax (missing commas, quotes, brackets)
- **"Plan at index X"**: Fix the specific plan's properties

## Comparison with Form-Based Editor

| Feature | JSON Editor | Form Editor |
|---------|-------------|-------------|
| Speed | ⚡ Fast | 🐢 Slower |
| Bulk Edit | ✅ Easy | ❌ One by one |
| Copy/Paste | ✅ Yes | ❌ Limited |
| Learning Curve | 📈 Higher | 📉 Lower |
| Error Prone | ⚠️ More | ✅ Less |
| Flexibility | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

## Best Practices

1. **Always Check Diff**: Don't publish blind
2. **Format JSON**: Keep it readable
3. **Test Price IDs**: Verify in Stripe first
4. **One Recommended**: Mark only one plan
5. **Consistent IDs**: Use clear naming scheme

## Troubleshooting

**Plans not loading?**
- Check backend is running
- Verify API endpoint
- Check browser console

**Can't publish?**
- Verify admin permissions
- Check access token
- Look for validation errors

**Diff not showing?**
- Fix JSON validation errors first
- Ensure JSON is valid
- Check console for errors

## Example: Adding a New Plan

```json
{
  "plans": [
    // ... existing plans ...
    {
      "id": "enterprise-plan-001",
      "name": "Enterprise",
      "price": "$500/year",
      "features": [
        "24/7 Premium support",
        "Unlimited storage",
        "Dedicated account manager",
        "Custom integrations"
      ],
      "priceId": "price_NEW_STRIPE_ID_HERE"
    }
  ]
}
```

## Related Files

- **Component**: `src/sections/admin/json-plans-editor-view.tsx`
- **Page**: `src/pages/admin-plans.tsx`
- **Service**: `src/services/plans.service.ts`
- **API Docs**: `docs/PLANS_API.md`
