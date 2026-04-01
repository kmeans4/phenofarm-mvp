import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { LicenseStatus } from "@prisma/client";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session || session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { status, notes } = body as { status: LicenseStatus; notes?: string };

  // Validate status
  const validStatuses: LicenseStatus[] = ['pending_review', 'verified', 'expired', 'rejected'];
  if (status && !validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid license status' }, { status: 400 });
  }

  try {
    const dispensary = await db.dispensary.findUnique({
      where: { id },
      select: { id: true, businessName: true, licenseNumber: true }
    });

    if (!dispensary) {
      return NextResponse.json({ error: 'Dispensary not found' }, { status: 404 });
    }

    const updateData: { licenseStatus: LicenseStatus; licenseReviewNotes?: string; verifiedAt?: Date } = {
      licenseStatus: status,
    };

    if (notes !== undefined) {
      updateData.licenseReviewNotes = notes;
    }

    if (status === 'verified') {
      updateData.verifiedAt = new Date();
    }

    await db.dispensary.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: `License status updated to ${status}`,
      dispensary: {
        id: dispensary.id,
        businessName: dispensary.businessName,
        licenseNumber: dispensary.licenseNumber,
        licenseStatus: status,
      }
    });
  } catch (error) {
    console.error('Error updating dispensary license:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session || session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const dispensary = await db.dispensary.findUnique({
      where: { id },
      select: {
        id: true,
        businessName: true,
        licenseNumber: true,
        licenseExpiry: true,
        licenseState: true,
        licenseStatus: true,
        licenseReviewNotes: true,
        verifiedAt: true,
        contactName: true,
        phone: true,
        email: {
          select: {
            email: true
          }
        }
      }
    });

    if (!dispensary) {
      return NextResponse.json({ error: 'Dispensary not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: dispensary.id,
      businessName: dispensary.businessName,
      licenseNumber: dispensary.licenseNumber,
      licenseExpiry: dispensary.licenseExpiry,
      licenseState: dispensary.licenseState,
      licenseStatus: dispensary.licenseStatus,
      licenseReviewNotes: dispensary.licenseReviewNotes,
      verifiedAt: dispensary.verifiedAt,
      contactName: dispensary.contactName,
      phone: dispensary.phone,
      email: dispensary.email?.email,
    });
  } catch (error) {
    console.error('Error fetching dispensary license info:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
