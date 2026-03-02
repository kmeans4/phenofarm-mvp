import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth-helpers';

// GET all batches for the authenticated grower
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
    const { searchParams } = new URL(request.url);
    const strainId = searchParams.get('strainId');

    const batches = await db.batch.findMany({
      where: {
        growerId,
        ...(strainId && { strainId })
      },
      include: {
        strain: {
          select: { id: true, name: true, genetics: true }
        },
        _count: {
          select: { products: true }
        }
      },
      orderBy: { harvestDate: 'desc' }
    });

    return NextResponse.json(batches, { status: 200 });
  } catch (error) {
    console.error('Error fetching batches:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create a new batch
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
    const { 
      batchNumber, 
      lotNumber, 
      harvestDate, 
      strainId,
      thc, 
      cbd, 
      totalCannabinoids,
      terpenes,
      coaDocumentUrl,
      testResults,
      notes 
    } = body;

    if (!batchNumber || !harvestDate || !strainId) {
      return NextResponse.json({ error: 'Batch number, harvest date, and strain are required' }, { status: 400 });
    }

    // Verify strain belongs to grower
    const strain = await db.strain.findFirst({
      where: { id: strainId, growerId }
    });

    if (!strain) {
      return NextResponse.json({ error: 'Strain not found' }, { status: 404 });
    }

    // Check for duplicate batch number
    const existing = await db.batch.findFirst({
      where: { growerId, batchNumber }
    });

    if (existing) {
      return NextResponse.json({ error: 'A batch with this number already exists' }, { status: 409 });
    }

    const batch = await db.batch.create({
      data: {
        growerId,
        batchNumber,
        lotNumber: lotNumber || null,
        harvestDate: new Date(harvestDate),
        strainId,
        thc: thc !== undefined ? parseFloat(thc) : null,
        cbd: cbd !== undefined ? parseFloat(cbd) : null,
        totalCannabinoids: totalCannabinoids !== undefined ? parseFloat(totalCannabinoids) : null,
        terpenes: terpenes || null,
        coaDocumentUrl: coaDocumentUrl || null,
        testResults: testResults || null,
        notes: notes || null
      }
    });

    return NextResponse.json(batch, { status: 201 });
  } catch (error) {
    console.error('Error creating batch:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
