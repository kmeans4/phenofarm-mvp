import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth-helpers';
import bcrypt from 'bcryptjs';

/**
 * Customers API Endpoint
 * 
 * Base path: /api/customers
 * Authentication: Required (GROWER role)
 * 
 * This endpoint manages dispensary customers for growers. "Customers" in this context
 * refers to dispensaries that purchase products from growers. The endpoint handles
 * both listing existing dispensaries and creating new customer accounts.
 */

/**
 * GET /api/customers
 * 
 * Retrieves all dispensaries (customers) in the system.
 * Only accessible by users with GROWER role.
 * 
 * Query Parameters: None
 * 
 * Response includes:
 * - All dispensary records with associated user details (email, name)
 * - Full dispensary profile information
 * 
 * Response: 200 OK - Array of dispensary objects with user relation
 * Response: 401 Unauthorized - No valid session
 * Response: 403 Forbidden - User is not a GROWER
 * Response: 500 Internal Server Error - Database or server error
 */
export async function GET() {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if ((session as any).user.role !== 'GROWER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const dispensaries = await db.dispensary.findMany({
      include: {
        user: {
          select: { email: true, name: true },
        },
      },
    });

    return NextResponse.json(dispensaries, { status: 200 });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/customers
 * 
 * Creates a new customer (dispensary) account.
 * Only accessible by users with GROWER role.
 * 
 * This endpoint creates both a User record and associated Dispensary profile.
 * A temporary random password is generated for the new account.
 * 
 * Request Body:
 * - businessName (required): Official business name of the dispensary
 * - email (required): Contact email (must be unique in system)
 * - contactName (optional): Primary contact person's name
 * - phone (optional): Business phone number
 * - address (optional): Street address
 * - city (optional): City
 * - state (optional): State code, defaults to 'VT'
 * - zipCode (optional): ZIP code
 * - licenseNumber (optional): Cannabis dispensary license number
 * 
 * Business Logic:
 * - Email uniqueness is validated before creation
 * - Temporary password is auto-generated (12 chars, random)
 * - Password is hashed with bcrypt (10 rounds)
 * - User role is set to 'DISPENSARY'
 * - User and Dispensary records are created in a sequence (not transactional)
 * 
 * Response: 201 Created - Newly created dispensary object with email
 * Response: 400 Bad Request - Missing required fields (businessName or email)
 * Response: 401 Unauthorized - No valid session
 * Response: 403 Forbidden - User is not a GROWER
 * Response: 409 Conflict - Email already exists in system
 * Response: 500 Internal Server Error - Database or server error
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if ((session as any).user.role !== 'GROWER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { businessName, contactName, email, phone, address, city, state, zipCode, licenseNumber } = body;

    if (!businessName || !email) {
      return NextResponse.json({ error: 'Business name and email are required' }, { status: 400 });
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }

    // Generate a temporary password
    const tempPassword = Math.random().toString(36).substring(2, 12);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Create the user first
    const user = await db.user.create({
      data: {
        email,
        name: contactName || businessName,
        passwordHash: hashedPassword,
        role: 'DISPENSARY',
      },
    });

    // Create the dispensary
    const dispensary = await db.dispensary.create({
      data: {
        userId: user.id,
        businessName,
        licenseNumber: licenseNumber || '',
        phone: phone || '',
        address: address || '',
        city: city || '',
        state: state || 'VT',
        zip: zipCode || '',
      },
    });

    return NextResponse.json({ ...dispensary, email }, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}
