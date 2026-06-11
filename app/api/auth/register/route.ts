import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { logApiError } from '@/lib/api-response';

/**
 * POST /api/auth/register
 *
 * Creates a user account with a grower or dispensary business profile.
 * New dispensaries start with licenseStatus pending_review and cannot
 * submit order requests until an admin verifies the license.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    const firstName = typeof body?.firstName === 'string' ? body.firstName.trim() : '';
    const lastName = typeof body?.lastName === 'string' ? body.lastName.trim() : '';
    const businessName = typeof body?.businessName === 'string' ? body.businessName.trim() : '';
    const businessType = body?.businessType === 'dispensary' ? 'dispensary' : body?.businessType === 'grower' ? 'grower' : null;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }
    if (!businessType) {
      return NextResponse.json({ error: 'Choose grower or dispensary' }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const name = [firstName, lastName].filter(Boolean).join(' ') || businessName;
    const resolvedBusinessName = businessName || name;

    if (!resolvedBusinessName) {
      return NextResponse.json({ error: 'Business name or contact name is required' }, { status: 400 });
    }

    const user = await db.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email,
          name,
          passwordHash,
          role: businessType === 'grower' ? 'GROWER' : 'DISPENSARY',
        },
      });

      if (businessType === 'grower') {
        const grower = await tx.grower.create({
          data: {
            userId: created.id,
            businessName: resolvedBusinessName,
            contactName: name,
          },
        });
        return tx.user.update({ where: { id: created.id }, data: { growerId: grower.id } });
      }

      const dispensary = await tx.dispensary.create({
        data: {
          userId: created.id,
          businessName,
          contactName: name,
        },
      });
      return tx.user.update({ where: { id: created.id }, data: { dispensaryId: dispensary.id } });
    });

    return NextResponse.json(
      { success: true, userId: user.id, role: user.role },
      { status: 201 }
    );
  } catch (error) {
    logApiError('auth.register', error, { route: '/api/auth/register' });
    return NextResponse.json({ error: 'Failed to create account. Please try again.' }, { status: 500 });
  }
}
