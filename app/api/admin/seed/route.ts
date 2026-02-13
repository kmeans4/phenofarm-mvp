import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from 'bcryptjs';

// GET /api/admin/seed - Check and create demo data
export async function GET() {
  try {
    // Verify admin
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results: any = { checked: [], created: [], errors: [] };

    // Check existing data
    const userCount = await db.user.count();
    const growerCount = await db.grower.count();
    const dispensaryCount = await db.dispensary.count();
    
    results.checked = { users: userCount, growers: growerCount, dispensaries: dispensaryCount };

    // Create demo grower if needed
    if (growerCount === 0) {
      try {
        const hashedPassword = await bcrypt.hash('password123', 10);
        
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
      } catch (e: any) {
        results.errors.push(`Grower creation failed: ${e.message}`);
      }
    }

    // Create demo dispensary if needed
    if (dispensaryCount === 0) {
      try {
        const hashedPassword = await bcrypt.hash('password123', 10);
        
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
            address: '456 Medical Ave',
            city: 'Montpelier',
            state: 'VT',
            zip: '05602',
            phone: '802-555-0202',
            description: 'Patient-focused medical dispensary',
          }
        });

        results.created.push('dispensary@greenvermont.com');
      } catch (e: any) {
        results.errors.push(`Dispensary creation failed: ${e.message}`);
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
  } catch (error: any) {
    console.error('Seed API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
