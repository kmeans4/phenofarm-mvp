import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth-helpers';

// GET product type configs (global defaults + grower's custom configs)
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = (session as any).user;
    
    if (user.role !== 'GROWER' || !user.growerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const growerId = user.growerId;

    // Get global configs and grower's custom configs
    const configs = await db.productTypeConfig.findMany({
      where: {
        OR: [
          { growerId: null }, // Global defaults
          { growerId }        // Grower's custom configs
        ]
      },
      orderBy: { type: 'asc' }
    });

    return NextResponse.json(configs, { status: 200 });
  } catch (error) {
    console.error('Error fetching product type configs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create/update a custom product type config for the grower
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = (session as any).user;
    
    if (user.role !== 'GROWER' || !user.growerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const growerId = user.growerId;
    const body = await request.json();
    const { type, subTypes } = body;

    if (!type || !subTypes || !Array.isArray(subTypes) || subTypes.length === 0) {
      return NextResponse.json({ error: 'Type and subTypes array are required' }, { status: 400 });
    }

    // Check if config already exists (either global or custom)
    const existing = await db.productTypeConfig.findFirst({
      where: { type, growerId: growerId }
    });

    if (existing) {
      // Update existing config
      const updated = await db.productTypeConfig.update({
        where: { id: existing.id },
        data: {
          subTypes,
          isCustom: true
        }
      });
      return NextResponse.json(updated, { status: 200 });
    } else {
      // Create new custom config
      const created = await db.productTypeConfig.create({
        data: {
          type,
          subTypes,
          growerId,
          isCustom: true
        }
      });
      return NextResponse.json(created, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating/updating product type config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
