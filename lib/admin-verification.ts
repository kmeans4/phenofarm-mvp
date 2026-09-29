import { createHash } from 'node:crypto';
import { db } from '@/lib/db';
import { createNotification } from '@/lib/notifications';
import { isLicenseExpired } from '@/lib/license';

export function licenseReviewKey(value: {
  licenseNumber: string | null;
  licenseExpiry: Date | null;
  state?: string | null;
  licenseState?: string | null;
  isVerified?: boolean;
  licenseStatus?: string;
  licenseReviewNotes?: string | null;
}) {
  return createHash('sha256')
    .update(
      JSON.stringify([
        value.licenseNumber,
        value.licenseExpiry?.toISOString() || null,
        value.licenseState ?? value.state ?? null,
        value.isVerified ?? false,
        value.licenseStatus ?? 'pending_review',
        value.licenseReviewNotes || null,
      ])
    )
    .digest('hex');
}
export async function applyVerification(
  kind: 'GROWER' | 'DISPENSARY',
  id: string,
  body: unknown
) {
  const input = body as {
    verified?: boolean;
    decision?: string;
    reason?: string;
    expectedUpdatedAt?: string;
    expectedLicenseKey?: string;
    undo?: boolean;
  } | null;
  if (
    !input ||
    (typeof input.verified !== 'boolean' &&
      !['approve', 'decline', 'pending'].includes(input.decision || '')) ||
    (!input.expectedLicenseKey && !input.expectedUpdatedAt)
  )
    return {
      status: 400,
      error: 'Refresh the license details before reviewing.',
    };
  const decision = input.decision || (input.verified ? 'approve' : 'pending');
  const reason =
    typeof input.reason === 'string' ? input.reason.trim().slice(0, 1000) : '';
  if (decision === 'decline' && !reason)
    return {
      status: 400,
      error: 'Choose a reason or explain the changes needed.',
    };
  return db.$transaction(async (tx) => {
    if (kind === 'GROWER')
      await tx.$queryRaw`SELECT id FROM growers WHERE id = ${id} FOR UPDATE`;
    else
      await tx.$queryRaw`SELECT id FROM dispensaries WHERE id = ${id} FOR UPDATE`;
    const current =
      kind === 'GROWER'
        ? await tx.grower.findUnique({ where: { id } })
        : await tx.dispensary.findUnique({ where: { id } });
    if (!current || ('isOffPlatform' in current && current.isOffPlatform))
      return { status: 404, error: 'Account not found.' };
    const key = licenseReviewKey(current);
    const targetStatus =
      decision === 'approve'
        ? 'verified'
        : decision === 'decline'
          ? 'rejected'
          : 'pending_review';
    const verifying = decision === 'approve';
    if (
      verifying &&
      (!current.licenseNumber ||
        !current.licenseExpiry ||
        !('licenseState' in current ? current.licenseState : current.state))
    )
      return {
        status: 409,
        error:
          'Ask for a license number, state, and expiry date before approving.',
      };
    if (verifying && isLicenseExpired(current.licenseExpiry))
      return {
        status: 409,
        error: 'This license expired. Ask for an updated license.',
      };
    if (
      !input.undo &&
      current.isVerified === verifying &&
      current.licenseStatus === targetStatus &&
      (decision !== 'decline' || current.licenseReviewNotes === reason)
    )
      return {
        status: 200,
        success: true,
        message: 'This decision is already saved.',
      };
    if (
      input.expectedLicenseKey
        ? input.expectedLicenseKey !== key
        : current.updatedAt.toISOString() !== input.expectedUpdatedAt
    )
      return {
        status: 409,
        error:
          'The license changed. Review its latest details before approving.',
      };
    if (
      input.undo &&
      current.updatedAt.toISOString() !== input.expectedUpdatedAt
    )
      return {
        status: 409,
        error:
          'Another update was saved. Refresh before changing this decision.',
      };
    const previous =
      current.licenseStatus === 'rejected'
        ? 'decline'
        : current.isVerified
          ? 'approve'
          : 'pending';
    const data = {
      isVerified: verifying,
      licenseStatus: targetStatus as 'verified' | 'rejected' | 'pending_review',
      licenseReviewNotes: decision === 'decline' ? reason : null,
    };
    const updated =
      kind === 'GROWER'
        ? await tx.grower.update({ where: { id }, data })
        : await tx.dispensary.update({
            where: { id },
            data: { ...data, verifiedAt: verifying ? new Date() : null },
          });
    await createNotification(tx, {
      userId: current.userId,
      type: 'VERIFICATION_DECISION',
      title: verifying
        ? 'License approved'
        : decision === 'decline'
          ? 'License changes needed'
          : 'License review reopened',
      body: verifying
        ? 'Your business is approved. You can now use the marketplace.'
        : reason || 'Your license is waiting for review.',
      href: `/${kind.toLowerCase()}/settings#license`,
    });
    return {
      status: 200,
      success: true,
      verified: verifying,
      message: `${current.businessName}: ${verifying ? 'approved' : decision === 'decline' ? 'changes requested' : 'review reopened'}.`,
      undo: {
        decision: previous,
        reason: current.licenseReviewNotes || undefined,
        expectedUpdatedAt: updated.updatedAt.toISOString(),
        expectedLicenseKey: licenseReviewKey(updated),
        undo: true,
      },
    };
  });
}
