import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-helpers';
import { getDispensarySettings } from '@/lib/dispensary-settings';
import { saveProfileSettings } from '@/lib/profile-settings';

// GET - Fetch dispensary settings
export async function GET() {
  try {
    const session = await getAuthSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;

    if (user.role !== 'DISPENSARY' || !user.dispensaryId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const settings = await getDispensarySettings(user.dispensaryId);
    return settings ? NextResponse.json(settings) : NextResponse.json({ error: 'Dispensary not found' }, { status: 404 });
  } catch (error) {
    console.error('Error fetching dispensary settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  return saveProfileSettings(request, 'DISPENSARY');
}

export async function PATCH(request: NextRequest) {
  return saveProfileSettings(request, 'DISPENSARY', true);
}
