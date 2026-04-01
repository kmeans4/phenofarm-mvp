# Grower Profile Fields

## Required Fields

All fields marked with * are required and validated both client-side and server-side.

### Business Information

| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| Business Name* | String | 2-100 chars, required | Legal business name |
| License Number* | String | 3-50 chars, required | State-issued cannabis business license |
| License Expiry* | Date | Future date, required | License expiration date |
| Contact Name | String | Optional | Primary contact person |
| Email* | String | Valid email, required | Business email address |
| Phone | String | 10-11 digits, optional | Business phone number |

### Address

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| Address | String | Optional | Street address |
| City | String | Optional | City |
| State | String | VT | State (currently VT only) |
| Zip | String | Optional | ZIP code |

### Online Presence

| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| Website | String | Valid URL, optional | Business website |
| Description | String | ≤2000 chars, optional | Business description |
| Logo | String | Base64, optional | Business logo |

## Validation Rules

### License Number
- Minimum 3 characters
- Maximum 50 characters
- Cannot be empty

### License Expiry
- Must be a valid date
- Must be in the future
- Required for profile completion

### Email
- Must match standard email regex
- Required for account communication

### Phone
- Optional field
- If provided, must be 10-11 digits
- Formatted as (XXX) XXX-XXXX in UI

## API Endpoints

### GET /api/grower/settings
Returns current grower profile data.

**Response:**
```json
{
  "businessName": "Green Valley Farms",
  "licenseNumber": "VT-GRW-2024-001",
  "licenseExpiry": "2025-12-31",
  "contactName": "John Smith",
  "email": "john@greenvalley.com",
  "phone": "(802) 555-1234",
  "address": "123 Farm Road",
  "city": "Burlington",
  "state": "VT",
  "zip": "05401",
  "website": "https://greenvalley.com",
  "description": "Premium organic cannabis",
  "logo": "data:image/png;base64,..."
}
```

### PUT /api/grower/settings
Updates grower profile.

**Validation Errors (400):**
- `Business name is required`
- `License number is required`
- `License expiry date is required`
- `License expiry must be a valid future date`
- `Please enter a valid email address`
- `Please enter a valid 10-digit phone number`

## UI States

### Form Validation
- Inline error messages appear on blur
- Submit button disabled until all required fields valid
- Visual feedback with red borders on invalid fields

### Success State
- Green success banner appears on save
- Auto-dismisses after 3 seconds
- Unsaved changes warning shown when form is dirty
