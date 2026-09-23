import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from 'bcryptjs';
import { getAuthSession } from '@/lib/auth-helpers';

interface SeedResults {
  checked: { users: number; growers: number; dispensaries: number };
  created: string[];
  errors: string[];
  final?: { users: number; growers: number; dispensaries: number };
}

function isProductionEnvironment() {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
}

// Demo seeding is deliberately unavailable in production. Keep the endpoint
// development-only because it creates credentials and sample records.
export async function GET() {
  return NextResponse.json(
    { error: 'Demo seeding requires an explicit POST in a non-production environment.' },
    { status: 405, headers: { Allow: 'POST' } },
  );
}

export async function POST() {
  try {
    if (isProductionEnvironment()) {
      return NextResponse.json({ error: 'Demo seeding is disabled in production.' }, { status: 404 });
    }

    // Verify admin
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const demoPassword = process.env.DEMO_SEED_PASSWORD;
    if (!demoPassword) {
      return NextResponse.json(
        { error: 'Demo seeding is not configured for this environment.' },
        { status: 503 },
      );
    }

    const results: SeedResults = { checked: { users: 0, growers: 0, dispensaries: 0 }, created: [], errors: [] };

    // Check existing data
    const userCount = await db.user.count();
    const growerCount = await db.grower.count();
    const dispensaryCount = await db.dispensary.count();
    
    results.checked = { users: userCount, growers: growerCount, dispensaries: dispensaryCount };

    // Create demo grower if needed
    if (growerCount === 0) {
      try {
        const hashedPassword = await bcrypt.hash(demoPassword, 10);
        
        const growerUser = await db.user.create({
          data: {
            email: 'grower@vtnurseries.com',
            name: 'VT Nurseries',
            role: 'GROWER',
            passwordHash: hashedPassword,
          }
        });

        await db.grower.create({
          data: {
            userId: growerUser.id,
            businessName: 'VT Nurseries',
            licenseNumber: 'VT-G-2024-001',
            address: '123 Green Mountain Rd',
            city: 'Burlington',
            state: 'VT',
            zip: '05401',
            phone: '802-555-0101',
            description: 'Premium Vermont cannabis cultivator',
          }
        });

        results.created.push('grower@vtnurseries.com');
      } catch (e) {
        console.error('Grower demo seed failed:', e instanceof Error ? e.message : 'unknown error');
        results.errors.push('Grower account could not be created.');
      }
    }

    // Create demo dispensary if needed
    if (dispensaryCount === 0) {
      try {
        const hashedPassword = await bcrypt.hash(demoPassword, 10);
        
        const dispensaryUser = await db.user.create({
          data: {
            email: 'dispensary@greenvermont.com',
            name: 'Green Vermont Dispensary',
            role: 'DISPENSARY',
            passwordHash: hashedPassword,
          }
        });

        await db.dispensary.create({
          data: {
            userId: dispensaryUser.id,
            businessName: 'Green Vermont Dispensary',
            licenseNumber: 'VT-D-2024-001',
            licenseExpiry: new Date('2027-12-31T00:00:00.000Z'),
            licenseStatus: 'verified',
            address: '456 Medical Ave',
            city: 'Montpelier',
            state: 'VT',
            zip: '05602',
            phone: '802-555-0202',
            description: 'Patient-focused medical dispensary',
          }
        });

        results.created.push('dispensary@greenvermont.com');
      } catch (e) {
        console.error('Dispensary demo seed failed:', e instanceof Error ? e.message : 'unknown error');
        results.errors.push('Dispensary account could not be created.');
      }
    }

    // Refresh counts
    const newUserCount = await db.user.count();
    const newGrowerCount = await db.grower.count();
    const newDispensaryCount = await db.dispensary.count();
    
    results.final = { 
      users: newUserCount, 
      growers: newGrowerCount, 
      dispensaries: newDispensaryCount 
    };

    return NextResponse.json(results);
  } catch (error) {
    console.error('Seed API error:', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ error: 'Unable to seed demo data.' }, { status: 500 });
  }
}
