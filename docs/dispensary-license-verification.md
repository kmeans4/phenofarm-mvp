# Dispensary License Verification Flow

## Overview

Dispensaries must have a verified license to place orders on PhenoFarm. This document describes the license verification workflow.

## License Status States

```
pending_review → verified
              ↘ expired
              ↘ rejected
```

| Status | Description | Can Order |
|--------|-------------|-----------|
| `pending_review` | New registration, awaiting admin review | ❌ No |
| `verified` | License approved by admin | ✅ Yes |
| `expired` | License past expiry date | ❌ No |
| `rejected` | License review failed | ❌ No |

## Required Fields

All fields marked with * are required.

### Business Information

| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| Business Name* | String | 2-100 chars | Legal business name |
| License Number* | String | 3-50 chars | State dispensary license |
| License State* | String | VT only | Currently VT only |
| License Expiry* | Date | Future date | License expiration |
| Contact Name | String | Optional | Primary contact |
| Email* | String | Valid email | Business email |
| Phone | String | 10-11 digits | Business phone |

### Address

| Field | Type | Description |
|-------|------|-------------|
| Address | String | Delivery street address |
| City | String | City |
| State | String | State (VT default) |
| Zip | String | ZIP code |

## Verification Workflow

### 1. Dispensary Registration

```
User signs up → Role = DISPENSARY
              → Creates profile with license info
              → licenseStatus = 'pending_review'
```

### 2. Admin Review Queue

Admins access pending dispensaries at `/admin/dispensaries`.

**Queue shows:**
- Business name
- License number
- License expiry
- Submission date
- Contact info

### 3. Admin Actions

#### Approve License
```
POST /api/admin/dispensaries/[id]/license
Body: { "status": "verified", "notes": "Approved" }

→ licenseStatus = 'verified'
→ verifiedAt = now()
→ Dispensary can now place orders
```

#### Reject License
```
POST /api/admin/dispensaries/[id]/license
Body: { "status": "rejected", "notes": "Invalid license format" }

→ licenseStatus = 'rejected'
→ Dispensary notified, must resubmit
```

#### Mark as Expired
```
POST /api/admin/dispensaries/[id]/license
Body: { "status": "expired", "notes": "License expired" }

→ licenseStatus = 'expired'
→ Orders blocked until updated
```

### 4. Order Blocking

Unverified dispensaries cannot place orders:

```typescript
// /api/orders/route.ts (POST)
if (dispensary.licenseStatus !== 'verified') {
  return NextResponse.json(
    { error: 'License verification required' },
    { status: 403 }
  );
}
```

## API Endpoints

### GET /api/dispensary/settings
Returns dispensary profile with license status.

**Response:**
```json
{
  "businessName": "Green Leaf Dispensary",
  "licenseNumber": "VT-DISP-2024-001",
  "licenseExpiry": "2025-06-30",
  "licenseState": "VT",
  "licenseStatus": "verified",
  "verifiedAt": "2024-03-15T10:30:00Z",
  "contactName": "Jane Doe",
  "email": "jane@greenleaf.com",
  "phone": "(802) 555-5678",
  "address": "456 Main Street",
  "city": "Montpelier",
  "state": "VT",
  "zip": "05602"
}
```

### PUT /api/dispensary/settings
Updates dispensary profile.

**Validation Errors (400):**
- `Business name is required`
- `License number is required`
- `License expiry date is required`
- `License state is required`
- `License expiry must be a valid future date`

### GET /api/admin/dispensaries/[id]/license
Admin-only: Get dispensary license details.

### POST /api/admin/dispensaries/[id]/license
Admin-only: Update license status.

**Request:**
```json
{
  "status": "verified|expired|rejected|pending_review",
  "notes": "Optional review notes"
}
```

**Response:**
```json
{
  "success": true,
  "message": "License status updated to verified",
  "dispensary": {
    "id": "...",
    "businessName": "Green Leaf Dispensary",
    "licenseNumber": "VT-DISP-2024-001",
    "licenseStatus": "verified"
  }
}
```

## UI Components

### Dispensary Settings Form
- Shows license status badge
- Displays expiry warning (<30 days)
- Inline validation for all fields
- Disabled submit until valid

### Admin License Review Queue
- List of pending dispensaries
- Approve/Reject buttons
- Notes field for rejection reason
- Filter by status

### Order Flow Block
- Clear error message when unverified
- Link to update license info
- Contact support option

## Database Schema

```prisma
model Dispensary {
  licenseStatus     LicenseStatus  @default(pending_review)
  licenseExpiry     DateTime?
  licenseState      String?        @default("VT")
  licenseReviewNotes String?
  verifiedAt        DateTime?
}

enum LicenseStatus {
  pending_review
  verified
  expired
  rejected
}
```

## Security Considerations

1. **Server-side validation**: All license fields validated on API
2. **Role-based access**: Admin-only license verification
3. **Order blocking**: Unverified dispensaries cannot checkout
4. **Audit trail**: `verifiedAt` timestamp tracks approval
5. **Review notes**: Admin notes stored for rejected licenses
