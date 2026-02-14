import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import bcrypt from 'bcryptjs';

interface SessionUser {
  role: string;
}

// GET all dispensaries (customers)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as SessionUser;
    
    if (user.role !== 'GROWER') {
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

// POST create a new customer (creates User + Dispensary)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userSession = session.user as SessionUser;
    
    if (userSession.role !== 'GROWER') {
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
