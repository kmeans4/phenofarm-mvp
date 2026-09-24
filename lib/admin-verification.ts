import { db } from '@/lib/db';
import { createNotification } from '@/lib/notifications';
import { isLicenseExpired } from '@/lib/license';

export async function applyVerification(kind: 'GROWER' | 'DISPENSARY', id: string, body: unknown) {
  const input = body as { verified?: unknown; expectedUpdatedAt?: unknown } | null;
  if (!input || typeof input.verified !== 'boolean' || typeof input.expectedUpdatedAt !== 'string'
    || !Number.isFinite(Date.parse(input.expectedUpdatedAt))) {
    return { status: 400, error: 'Refresh this page before changing verification.' };
  }
  const verifying = input.verified;
  const expectedUpdatedAt = new Date(input.expectedUpdatedAt).toISOString();
  return db.$transaction(async tx => {
    // Read intent against the latest profile while holding its row lock. Repeated
    // decisions are no-ops; an old screen cannot approve a changed license.
    if (kind === 'GROWER') await tx.$queryRaw`SELECT id FROM growers WHERE id = ${id} FOR UPDATE`;
    else await tx.$queryRaw`SELECT id FROM dispensaries WHERE id = ${id} FOR UPDATE`;
    const select = { businessName: true, isVerified: true, userId: true, updatedAt: true, licenseExpiry: true };
    const current = kind === 'GROWER'
      ? await tx.grower.findUnique({ where: { id }, select })
      : await tx.dispensary.findUnique({ where: { id }, select: { ...select, licenseStatus: true, verifiedAt: true } });
    if (!current) return { status: 404, error: 'Account not found.' };
    if (verifying && isLicenseExpired(current.licenseExpiry)) {
      return { status: 409, error: 'This license has expired. Review an updated license before approving.' };
    }
    const alreadyApplied = current.isVerified === verifying && (!verifying || !('licenseStatus' in current)
      || (current.licenseStatus === 'verified' && current.verifiedAt !== null));
    if (!alreadyApplied) {
      if (current.updatedAt.toISOString() !== expectedUpdatedAt) {
        return { status: 409, error: 'This profile changed since you opened it. Refresh and review it before changing verification.' };
      }
      if (kind === 'GROWER') await tx.grower.update({ where: { id }, data: { isVerified: verifying } });
      else await tx.dispensary.update({ where: { id }, data: verifying
        ? { isVerified: true, licenseStatus: 'verified', verifiedAt: new Date() }
        : { isVerified: false, licenseStatus: 'pending_review', verifiedAt: null } });
      await createNotification(tx, { userId: current.userId, type: 'VERIFICATION_DECISION',
        title: verifying ? (kind === 'GROWER' ? 'Account verified' : 'License verified') : 'Verification removed',
        body: kind === 'GROWER'
          ? (verifying ? 'Your listings are now visible to verified dispensaries.' : 'Your listings are hidden until PhenoShop verifies your account again.')
          : (verifying ? 'Ordering is now unlocked for your dispensary.' : 'Ordering is paused until PhenoShop verifies your license again.'),
        href: kind === 'GROWER' ? '/grower/dashboard' : '/dispensary/dashboard',
      });
    }
    return { status: 200, success: true, verified: verifying, message: `${current.businessName} ${verifying ? 'verified' : 'unverified'}.` };
  });
}
