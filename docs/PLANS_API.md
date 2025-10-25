# Plans API Documentation

## Overview
The Plans API provides endpoints to manage subscription plans with versioning support. Plans are stored as JSON strings and tracked by version number. Only admin users can create new plan versions, while the latest version is publicly accessible.

## Base URL
```
/plans
```

## Authentication
The create endpoint requires:
- **JWT Bearer Token** in Authorization header
- **Admin Role**
- **Verified Email**

Format: `Authorization: Bearer <token>`

---

## Endpoints

### 1. Create Plans (Admin Only)

**POST** `/plans`

Creates a new version of plans. The entire plans array is stored as a JSON string with an auto-incrementing version number.

#### Request Headers
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "data": "string"  // Required - JSON string containing plans array
}
```

The `data` field should be a stringified JSON object with the following structure:
```json
{
  "plans": [
    {
      "id": "string",           // Unique plan identifier
      "name": "string",          // Plan name
      "price": "string",         // Display price (e.g., "$10")
      "features": ["string"],    // Array of feature descriptions
      "priceId": "string",       // Stripe price ID
      "recommended": boolean     // Optional - Mark as recommended
    }
  ]
}
```

#### Example Request
```bash
curl -X POST http://localhost:3000/plans \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "data": "{\"plans\":[{\"id\":\"basic-plan-001\",\"name\":\"Basic\",\"price\":\"$10\",\"features\":[\"Basic support\",\"Monthly payments\",\"10 GB Storage\",\"Email support\"],\"priceId\":\"price_1SHpG27ulmHU5ctwMzG3Id2C\"},{\"id\":\"premium-plan-001\",\"name\":\"Premium\",\"price\":\"$100\",\"features\":[\"Premium support\",\"Yearly payments\",\"100 GB Storage\",\"Priority support\"],\"priceId\":\"price_1SHpGX7ulmHU5ctwyob0dYhg\",\"recommended\":true}]}"
  }'
```

#### Success Response (201)
```json
{
  "statusCode": 201,
  "message": "Plans created successfully",
  "data": {
    "plans": "{\"plans\":[{\"id\":\"basic-plan-001\",\"name\":\"Basic\",\"price\":\"$10\",\"features\":[\"Basic support\",\"Monthly payments\",\"10 GB Storage\",\"Email support\"],\"priceId\":\"price_1SHpG27ulmHU5ctwMzG3Id2C\"},{\"id\":\"premium-plan-001\",\"name\":\"Premium\",\"price\":\"$100\",\"features\":[\"Premium support\",\"Yearly payments\",\"100 GB Storage\",\"Priority support\"],\"priceId\":\"price_1SHpGX7ulmHU5ctwyob0dYhg\",\"recommended\":true}]}",
    "version": 1
  }
}
```

#### Error Responses
- **400 Bad Request** - Invalid request body, malformed JSON string, or invalid data structure
- **401 Unauthorized** - Missing or invalid token
- **403 Forbidden** - Not admin user or email not verified

#### Validation

The API validates that the `data` field contains a properly structured JSON string. The validation checks:

1. **Valid JSON**: The `data` field must be a valid JSON string
2. **Required Structure**: Must contain a `plans` array
3. **Plan Properties**: Each plan must have:
   - `id` (string, required)
   - `name` (string, required)
   - `price` (string, required)
   - `features` (array of strings, required)
   - `priceId` (string, required)
   - `recommended` (boolean, optional)

If validation fails, you'll receive a detailed error response indicating what's wrong.

---

### 2. Get Latest Plan Version (Public)

**GET** `/plans/latest`

Retrieves the latest version of plans. No authentication required.

#### Example Request
```bash
curl -X GET http://localhost:3000/plans/latest
```

#### Success Response (200)
```json
{
  "statusCode": 200,
  "message": "Latest plans retrieved successfully",
  "data": {
    "plans": "{\"plans\":[{\"id\":\"basic-plan-001\",\"name\":\"Basic\",\"price\":\"$10\",\"features\":[\"Basic support\",\"Monthly payments\",\"10 GB Storage\",\"Email support\"],\"priceId\":\"price_1SHpG27ulmHU5ctwMzG3Id2C\"},{\"id\":\"premium-plan-001\",\"name\":\"Premium\",\"price\":\"$100\",\"features\":[\"Premium support\",\"Yearly payments\",\"100 GB Storage\",\"Priority support\"],\"priceId\":\"price_1SHpGX7ulmHU5ctwyob0dYhg\",\"recommended\":true}]}",
    "version": 1
  }
}
```

#### Empty Response (200 - No plans created yet)
```json
{
  "statusCode": 200,
  "message": "Latest plans retrieved successfully",
  "data": {
    "plans": "{}",
    "version": 0
  }
}
```

---

## Data Models

### Database Schema

| Field | Type | Required | Unique | Description |
|-------|------|----------|--------|-------------|
| id | string | Yes | Yes | Random 32-character hex string (auto-generated) |
| plans | string | Yes | No | JSON string containing all plans data |
| version | number | Yes | Yes | Auto-incrementing version number |
| createdAt | Date | Auto-generated | No | Timestamp when plan version was created |

### Plans JSON Structure

The `plans` field contains a JSON string with this structure:

```typescript
{
  "plans": [
    {
      "id": string,          // Unique identifier for the plan
      "name": string,        // Display name of the plan
      "price": string,       // Price display string (e.g., "$10/month")
      "features": string[],  // Array of feature descriptions
      "priceId": string,     // Stripe price ID for subscription
      "recommended"?: boolean // Optional flag for recommended plans
    }
  ]
}
```

---

## Response Format

All endpoints return a standardized response format:

```json
{
  "statusCode": number,      // HTTP status code
  "message": string,         // Descriptive message
  "data": {
    "plans": string,         // JSON string containing plans
    "version": number        // Version number
  } | null
}
```

---

## Common Error Responses

### 400 Bad Request - Missing Field
```json
{
  "statusCode": 400,
  "message": ["data must be a string", "data should not be empty"],
  "error": "Bad Request"
}
```

### 400 Bad Request - Invalid JSON Format
```json
{
  "statusCode": 400,
  "message": "Invalid JSON format in data field",
  "error": "Unexpected token ] in JSON at position 15"
}
```

### 400 Bad Request - Invalid Structure
```json
{
  "statusCode": 400,
  "message": "Invalid plans data structure",
  "errors": [
    "plans must be an array"
  ]
}
```

### 400 Bad Request - Invalid Plan Item
```json
{
  "statusCode": 400,
  "message": "Invalid plan structure at index 0",
  "errors": [
    "id must be a string",
    "priceId must be a string",
    "features must be an array"
  ]
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

---

## Usage Examples

### Complete Workflow Example

#### 1. Create the first version of plans (Admin)

First, prepare your plans data as a JavaScript object:

```javascript
const plansData = {
  plans: [
    {
      id: "basic-plan-001",
      name: "Basic",
      price: "$10",
      features: [
        "Basic support",
        "Monthly payments",
        "10 GB Storage",
        "Email support"
      ],
      priceId: "price_1SHpG27ulmHU5ctwMzG3Id2C"
    },
    {
      id: "premium-plan-001",
      name: "Premium",
      price: "$100",
      features: [
        "Premium support",
        "Yearly payments",
        "100 GB Storage",
        "Priority support"
      ],
      priceId: "price_1SHpGX7ulmHU5ctwyob0dYhg",
      recommended: true
    }
  ]
};

// Stringify it
const dataString = JSON.stringify(plansData);

// Send the request
fetch('http://localhost:3000/plans', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <admin_token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ data: dataString })
});
```

Response:
```json
{
  "statusCode": 201,
  "message": "Plans created successfully",
  "data": {
    "plans": "{\"plans\":[...]}",
    "version": 1
  }
}
```

#### 2. Public users retrieve the latest plans

```bash
curl -X GET http://localhost:3000/plans/latest
```

Response:
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

#### 3. Client-side parsing

```javascript
// Fetch latest plans
const response = await fetch('http://localhost:3000/plans/latest');
const result = await response.json();

// Parse the JSON string
if (result.data) {
  // Check if there are plans (version > 0)
  if (result.data.version === 0) {
    console.log('No plans available yet');
  } else {
    const plansData = JSON.parse(result.data.plans);
    console.log('Version:', result.data.version);
    console.log('Plans:', plansData.plans);
    
    // Display plans
    plansData.plans.forEach(plan => {
      console.log(`${plan.name}: ${plan.price}`);
      console.log('Features:', plan.features);
      if (plan.recommended) {
        console.log('⭐ Recommended');
      }
    });
  }
}
```

#### 4. Create a new version with updated plans (Admin)

```javascript
const updatedPlansData = {
  plans: [
    {
      id: "basic-plan-001",
      name: "Basic",
      price: "$15",  // Price updated
      features: [
        "Basic support",
        "Monthly payments",
        "15 GB Storage",  // Storage increased
        "Email support"
      ],
      priceId: "price_1SHpG27ulmHU5ctwMzG3Id2D"  // New price ID
    },
    {
      id: "premium-plan-001",
      name: "Premium",
      price: "$100",
      features: [
        "Premium support",
        "Yearly payments",
        "100 GB Storage",
        "Priority support",
        "Phone support"  // New feature added
      ],
      priceId: "price_1SHpGX7ulmHU5ctwyob0dYhg",
      recommended: true
    },
    {
      id: "enterprise-plan-001",
      name: "Enterprise",  // New plan added
      price: "$500",
      features: [
        "24/7 Premium support",
        "Unlimited storage",
        "Dedicated account manager",
        "Custom integrations"
      ],
      priceId: "price_1SHpGX7ulmHU5ctwyob0dYhj"
    }
  ]
};

const dataString = JSON.stringify(updatedPlansData);

fetch('http://localhost:3000/plans', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <admin_token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ data: dataString })
});
```

Response:
```json
{
  "statusCode": 201,
  "message": "Plans created successfully",
  "data": {
    "plans": "{\"plans\":[...]}",
    "version": 2
  }
}
```

---

## Versioning

### How Versioning Works

1. **Auto-Increment**: Each time you create a new plan version via `POST /plans`, the version number automatically increments (1, 2, 3, etc.)

2. **Immutable History**: Previous versions remain in the database but are not accessible via the API (only the latest version is returned)

3. **Version Tracking**: The `version` field in the response indicates which version of plans is currently active

4. **Atomic Updates**: Each `POST` creates a completely new version. There's no partial update mechanism.

### Best Practices

- **Always create complete plans**: When creating a new version, include all plans, not just the ones that changed
- **Maintain plan IDs**: Keep consistent plan IDs across versions for tracking purposes
- **Test before deploying**: Validate your JSON string is properly formatted before sending
- **Version control**: Keep your plans data in version control alongside your code

---

## Testing

### Using cURL

**Create plans:**
```bash
# Prepare your data
DATA='{"plans":[{"id":"test-1","name":"Test Plan","price":"$10","features":["Feature 1"],"priceId":"price_test123"}]}'

# Create the request
curl -X POST http://localhost:3000/plans \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"data\":\"$(echo $DATA | sed 's/"/\\"/g')\"}"
```

**Get latest plans:**
```bash
curl -X GET http://localhost:3000/plans/latest
```

### Using Postman

1. **Import endpoint**: `POST http://localhost:3000/plans`
2. **Set Authorization**: Bearer Token with admin JWT
3. **Set Body** (raw JSON):
   ```json
   {
     "data": "{\"plans\":[{\"id\":\"test-1\",\"name\":\"Test Plan\",\"price\":\"$10\",\"features\":[\"Feature 1\"],\"priceId\":\"price_test123\"}]}"
   }
   ```

### Using the Swagger UI

The API is documented with Swagger. Access the interactive documentation at:
```
http://localhost:3000/api
```

---

## Integration Examples

### React Integration

```typescript
// services/plansService.ts
export interface Plan {
  id: string;
  name: string;
  price: string;
  features: string[];
  priceId: string;
  recommended?: boolean;
}

export interface PlansResponse {
  statusCode: number;
  message: string;
  data: {
    plans: string;
    version: number;
  } | null;
}

export const plansService = {
  async getLatestPlans(): Promise<Plan[]> {
    const response = await fetch('/api/plans/latest');
    const result: PlansResponse = await response.json();
    
    if (result.data && result.data.version > 0) {
      const parsed = JSON.parse(result.data.plans);
      return parsed.plans;
    }
    
    return [];
  }
};

// components/PricingTable.tsx
import { useEffect, useState } from 'react';
import { plansService, Plan } from '../services/plansService';

export const PricingTable = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    plansService.getLatestPlans()
      .then(setPlans)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="pricing-grid">
      {plans.map(plan => (
        <div key={plan.id} className={plan.recommended ? 'recommended' : ''}>
          <h3>{plan.name}</h3>
          <p className="price">{plan.price}</p>
          <ul>
            {plan.features.map((feature, i) => (
              <li key={i}>{feature}</li>
            ))}
          </ul>
          <button data-price-id={plan.priceId}>
            Subscribe
          </button>
        </div>
      ))}
    </div>
  );
};
```

### Node.js Admin Tool

```javascript
// adminTools/createPlans.js
const fetch = require('node-fetch');

async function createPlans(adminToken, plansData) {
  const dataString = JSON.stringify(plansData);
  
  const response = await fetch('http://localhost:3000/plans', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ data: dataString })
  });
  
  const result = await response.json();
  console.log('Plans created:', result);
  return result;
}

// Usage
const plansData = {
  plans: [
    {
      id: "starter-2025",
      name: "Starter",
      price: "$9.99/mo",
      features: ["5 GB Storage", "Email Support"],
      priceId: "price_starter_monthly"
    }
  ]
};

createPlans(process.env.ADMIN_TOKEN, plansData);
```

---

## Migration Guide

If you're migrating from the old Plans API:

### Old Structure (Deprecated)
```json
POST /plans
{
  "name": "Premium",
  "price": "$100",
  "features": [...],
  "priceId": "...",
  "recommended": true
}
```

### New Structure
```json
POST /plans
{
  "data": "{\"plans\":[{\"id\":\"premium-001\",\"name\":\"Premium\",\"price\":\"$100\",\"features\":[...],\"priceId\":\"...\",\"recommended\":true}]}"
}
```

### Key Changes
1. **All plans in one request**: Submit all plans together, not individually
2. **JSON string format**: Plans must be stringified JSON
3. **Versioning**: Each submission creates a new version
4. **No individual plan CRUD**: Cannot update/delete individual plans
5. **Simplified endpoints**: Only 2 endpoints instead of 6
6. **Response format**: Standardized with statusCode, message, and data fields

---

## Notes

- **JSON String Format**: The `data` field must be a valid JSON string. Ensure proper escaping of quotes.
- **Structure Validation**: The API automatically validates that your data follows the correct structure before saving.
- **Required Fields**: Each plan must include: `id`, `name`, `price`, `features` (array), and `priceId`.
- **Optional Fields**: `recommended` is optional and must be a boolean if provided.
- **Version History**: All versions are stored but only the latest is accessible via API.
- **No Partial Updates**: To change any plan, you must create a new version with all plans.
- **Plan IDs**: Use consistent IDs across versions to track plan evolution.
- **Public Access**: The `/plans/latest` endpoint requires no authentication.
- **Admin Only Creation**: Only admins can create new plan versions.
- **Empty State**: When no plans exist, the API returns `version: 0` with an empty object `"{}"` instead of an error.

---

## Troubleshooting

### Common Issues

**Issue**: 400 Bad Request - "data must be a string"
- **Solution**: Ensure you're stringifying your plans object: `JSON.stringify({ plans: [...] })`

**Issue**: 400 Bad Request - "Invalid JSON format in data field"
- **Solution**: Check that your JSON string is properly formatted and all quotes are escaped correctly

**Issue**: 400 Bad Request - "Invalid plans data structure"
- **Solution**: Ensure your data has a root `plans` property that is an array: `{ "plans": [...] }`

**Issue**: 400 Bad Request - "Invalid plan structure at index X"
- **Solution**: Check that the plan at the specified index has all required fields (id, name, price, features, priceId) and correct types
  - `id`, `name`, `price`, `priceId` must be strings
  - `features` must be an array of strings
  - `recommended` (if present) must be a boolean

**Issue**: Plans not showing up for public users
- **Solution**: Verify a plan version was created successfully by checking the response

**Issue**: Version not incrementing
- **Solution**: Check database for duplicate version numbers or constraint violations

**Issue**: JSON parsing errors on client
- **Solution**: Ensure the JSON string is valid and properly escaped

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2025-10-25 | Complete API redesign with versioning support, JSON string storage, and simplified endpoints |
| 1.0.0 | 2025-10-24 | Initial release (deprecated) |
