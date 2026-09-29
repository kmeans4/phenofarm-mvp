import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { formatDate } from '@/lib/format';
import { isLicenseExpired } from '@/lib/license';
import { licenseReviewKey } from '@/lib/admin-verification';
import { VerificationQueue } from '@/app/admin/components/VerificationQueue';
export default async function ReviewPage({
  params,
}: {
  params: Promise<{ kind: string; id: string }>;
}) {
  await requireAdmin();
  const { kind, id } = await params;
  if (kind !== 'grower' && kind !== 'dispensary') notFound();
  const profile =
    kind === 'grower'
      ? await db.grower.findUnique({
          where: { id },
          include: {
            user: {
              select: { email: true, name: true, emailVerifiedAt: true },
            },
          },
        })
      : await db.dispensary.findFirst({
          where: { id, isOffPlatform: false },
          include: {
            user: {
              select: { email: true, name: true, emailVerifiedAt: true },
            },
          },
        });
  if (!profile) notFound();
  const state =
    'licenseState' in profile ? profile.licenseState : profile.state;
  const expired = isLicenseExpired(profile.licenseExpiry);
  const registry =
    state === 'VT'
      ? 'https://ccb.vermont.gov/licenses'
      : state === 'NJ'
        ? 'https://www.nj.gov/cannabis/businesses/permitted/'
        : null;
  return (
    <div className="space-y-5">
      <Link
        className="inline-flex min-h-11 items-center text-pf-accent"
        href="/admin/review"
      >
        ← Review queue
      </Link>
      <h1 className="text-2xl font-semibold">{profile.businessName}</h1>
      <dl className="grid gap-4 rounded-xl border border-pf-line bg-pf-surface p-4 sm:grid-cols-2">
        {[
          ['Business', profile.businessName],
          ['Contact', profile.contactName || profile.user?.name],
          ['License number', profile.licenseNumber],
          ['License state', state],
          [
            'Expires',
            profile.licenseExpiry
              ? formatDate(profile.licenseExpiry.toISOString().slice(0, 10))
              : null,
          ],
          [
            'Address',
            [profile.address, profile.city, profile.state, profile.zip]
              .filter(Boolean)
              .join(', '),
          ],
          [
            'Email ownership',
            profile.user?.emailVerifiedAt ? 'Verified' : 'Not verified',
          ],
          [
            'Submitted',
            formatDate(profile.licenseSubmittedAt || profile.createdAt),
          ],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-sm text-pf-muted">{label}</dt>
            <dd className="mt-1 break-words text-sm">
              {value || 'Not supplied'}
            </dd>
          </div>
        ))}
        <div>
          <dt className="text-sm text-pf-muted">Email</dt>
          <dd>
            {profile.user?.email ? (
              <a
                className="inline-flex min-h-11 items-center break-all text-pf-accent"
                href={`mailto:${profile.user.email}`}
              >
                {profile.user.email}
              </a>
            ) : (
              'Not supplied'
            )}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-pf-muted">Phone</dt>
          <dd>
            {profile.phone ? (
              <a
                className="inline-flex min-h-11 items-center text-pf-accent"
                href={`tel:${profile.phone}`}
              >
                {profile.phone}
              </a>
            ) : (
              'Not supplied'
            )}
          </dd>
        </div>
      </dl>
      {registry ? (
        <a
          href={registry}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center rounded-lg border border-pf-line-strong px-3 text-pf-accent"
        >
          Look up in state registry ↗
        </a>
      ) : (
        <a
          href="https://www.cann-ra.org/membership"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center rounded-lg border border-pf-line-strong px-3 text-pf-accent"
        >
          Find this state’s regulator ↗
        </a>
      )}
      {profile.licenseReviewNotes && (
        <p className="rounded-lg bg-pf-warning-bg p-3 text-sm text-pf-warning">
          Last review: {profile.licenseReviewNotes}
        </p>
      )}
      <VerificationQueue
        showDetails={false}
        rows={[
          {
            id,
            kind,
            businessName: profile.businessName,
            email: profile.user?.email || null,
            licenseNumber: profile.licenseNumber,
            licenseExpiry: profile.licenseExpiry
              ? formatDate(profile.licenseExpiry.toISOString().slice(0, 10))
              : '',
            state,
            status: expired
              ? 'Expired'
              : profile.isVerified
                ? 'Approved'
                : profile.licenseStatus === 'rejected'
                  ? 'Changes needed'
                  : 'Waiting for review',
            canApprove:
              !profile.isVerified &&
              Boolean(
                profile.licenseExpiry && profile.licenseNumber && state
              ) &&
              !expired,
            reviewKey: licenseReviewKey(profile),
            updatedAt: profile.updatedAt.toISOString(),
            previousLicenseNumber: profile.previousLicenseNumber,
          },
        ]}
      />
    </div>
  );
}
