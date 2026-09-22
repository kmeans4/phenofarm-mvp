import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { getAuthSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { validateLogoDataUrl } from '@/lib/upload-validation';
import { persistMediaReference } from '@/lib/blob-storage';
import { isLicenseExpired } from '@/lib/license';

class InvalidSettings extends Error {}
const fail = (message: string): never => { throw new InvalidSettings(message); };
function text(body: Record<string, unknown>, key: string, required = false, max = 200) {
  const value = body[key];
  if (value !== undefined && value !== null && typeof value !== 'string') fail(`${key} must be text`);
  const result = typeof value === 'string' ? value.trim() : '';
  if ((required && !result) || result.length > max) fail(`Invalid ${key}`);
  return result || null;
}

export async function saveProfileSettings(request: NextRequest, role: 'GROWER' | 'DISPENSARY', partial = false) {
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = session.user;
  const profileId = role === 'GROWER' ? user.growerId : user.dispensaryId;
  if (user.role !== role || !profileId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) fail('Invalid settings');
    const logoOnly = partial && Object.keys(body).length === 1 && Object.hasOwn(body, 'logo');
    if (partial && role === 'GROWER' && !logoOnly) fail('Only logo can be changed with PATCH');
    let logo: string | null | undefined;
    if (Object.hasOwn(body, 'logo')) {
      const result = validateLogoDataUrl(body.logo);
      if (!result.ok) fail(result.error);
      logo = body.logo ? await persistMediaReference(body.logo, `logos/${profileId}`) : null;
    }
    const licenseNumber = logoOnly ? undefined : text(body, 'licenseNumber', true);
    const expiry = logoOnly || body.licenseExpiry === undefined ? undefined : text(body, 'licenseExpiry');
    const licenseExpiry = expiry ? new Date(expiry) : expiry === null ? null : undefined;
    if (!logoOnly && (role === 'GROWER' || partial) && !licenseExpiry) fail('License expiry is required');
    if (licenseExpiry && (!expiry || !/^\d{4}-\d{2}-\d{2}$/.test(expiry) || !Number.isFinite(licenseExpiry.getTime()) || licenseExpiry.toISOString().slice(0, 10) !== expiry || isLicenseExpired(licenseExpiry))) fail('License expiry must be today or later');
    let website = !partial ? text(body, 'website', false, 2048) : undefined;
    if (website) {
      try {
        const url = new URL(/^https?:\/\//i.test(website) ? website : `https://${website}`);
        if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) fail('Invalid website');
        website = url.href;
      } catch { fail('Invalid website'); }
    }
    const email = !partial ? text(body, 'email', true, 254)?.toLowerCase() : undefined;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('Enter a valid email');
    if (email && email !== user.email) fail('Use Change email to verify your new address before updating it.');
    const common = partial ? {} : {
      businessName: text(body, 'businessName', true)!, contactName: text(body, 'contactName'),
      phone: text(body, 'phone'), address: text(body, 'address', false, 500), city: text(body, 'city'),
      state: text(body, 'state') || 'VT', zip: text(body, 'zip', false, 20), website,
      description: text(body, 'description', false, 5000),
    };
    const saved = await db.$transaction(async tx => {
      if (role === 'GROWER') {
        const before = await tx.grower.findUniqueOrThrow({ where: { id: profileId }, select: { licenseNumber: true, licenseExpiry: true } });
        const changed = !logoOnly && (licenseNumber !== before.licenseNumber || (licenseExpiry !== undefined && licenseExpiry?.getTime() !== before.licenseExpiry?.getTime()));
        return tx.grower.update({ where: { id: profileId }, data: { ...common, logo, licenseNumber, licenseExpiry, ...(changed ? { isVerified: false } : {}) }, select: { businessName: true, licenseNumber: true, contactName: true, phone: true, logo: true } });
      }
      const licenseState = !partial ? text(body, 'licenseState', true, 2)!.toUpperCase() : undefined;
      const before = await tx.dispensary.findUniqueOrThrow({ where: { id: profileId }, select: { licenseNumber: true, licenseExpiry: true, licenseState: true } });
      const changed = !logoOnly && (licenseNumber !== before.licenseNumber || (licenseExpiry !== undefined && licenseExpiry?.getTime() !== before.licenseExpiry?.getTime()) || (licenseState !== undefined && licenseState !== before.licenseState));
      return tx.dispensary.update({ where: { id: profileId }, data: { ...common, logo, licenseNumber, licenseState, licenseExpiry, ...(changed ? { isVerified: false, licenseStatus: 'pending_review', verifiedAt: null, licenseReviewNotes: null } : {}) }, select: { businessName: true, licenseNumber: true, contactName: true, phone: true, logo: true } });
    });
    return NextResponse.json({ success: true, message: 'Settings saved successfully', [role === 'GROWER' ? 'grower' : 'dispensary']: saved });
  } catch (error) {
    if (error instanceof InvalidSettings) return NextResponse.json({ error: error.message }, { status: 400 });
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') return NextResponse.json({ error: 'This email is already in use' }, { status: 409 });
      if (error.code === 'P2025') return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Unable to save settings' }, { status: 503 });
  }
}
