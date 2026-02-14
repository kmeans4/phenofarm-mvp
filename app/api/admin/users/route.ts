import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from 'bcryptjs';

// GET /api/admin/users - List all users
export async function GET(req: NextRequest) {
  try {
    // Verify admin
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role: string }).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query params
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const search = searchParams.get('search');

    // Build where clause with proper Prisma type
    const where: Prisma.UserWhereInput = {};
    
    if (role && role !== 'ALL') {
      where.role = role as UserRole;
    }
    
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Fetch users with related data
    const users = await db.user.findMany({
      where,
      include: {
        grower: true,
        dispensary: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform to response format
    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      grower: user.grower ? {
        id: user.grower.id,
        businessName: user.grower.businessName,
        licenseNumber: user.grower.licenseNumber,
        isVerified: user.grower.isVerified
      } : null,
      dispensary: user.dispensary ? {
        id: user.dispensary.id,
        businessName: user.dispensary.businessName,
        licenseNumber: user.dispensary.licenseNumber,
        isVerified: user.dispensary.isVerified
      } : null
    }));

    return NextResponse.json({ users: formattedUsers });
  } catch (error) {
    console.error('Admin users API error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST /api/admin/users - Create new user
export async function POST(req: NextRequest) {
  try {
    // Verify admin
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role: string }).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { email, name, role, password, businessName, licenseNumber } = body;

    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }

    // Hash password if provided
    const passwordHash = password ? await bcrypt.hash(password, 10) : null;

    // Create user with transaction to also create grower/dispensary
    const user = await db.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.user.create({
        data: {
          email,
          name: name || null,
          role,
          passwordHash,
        }
      });

      // Create grower or dispensary if business name provided
      if (role === 'GROWER' && businessName) {
        await tx.grower.create({
          data: {
            userId: newUser.id,
            businessName,
            licenseNumber: licenseNumber || null,
            isVerified: false,
          }
        });
      } else if (role === 'DISPENSARY' && businessName) {
        await tx.dispensary.create({
          data: {
            userId: newUser.id,
            businessName,
            licenseNumber: licenseNumber || null,
            isVerified: false,
          }
        });
      }

      return newUser;
    });

    return NextResponse.json({ 
      success: true,
      message: 'User created successfully',
      user 
    }, { status: 201 });
  } catch (error) {
    console.error('Admin create user error:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
