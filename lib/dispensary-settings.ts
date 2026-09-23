import { db } from '@/lib/db';

export async function getDispensarySettings(dispensaryId: string) {
    const dispensary = await db.dispensary.findUnique({
      where: { id: dispensaryId },
      select: {
        businessName: true,
        licenseNumber: true,
        licenseExpiry: true,
        licenseState: true,
        licenseStatus: true,
        licenseReviewNotes: true,
        contactName: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zip: true,
        website: true,
        description: true,
        logo: true,
        user: { select: { email: true } },
      },
    });

    if (!dispensary) {
      return null;
    }

    return {
      businessName: dispensary.businessName,
      licenseNumber: dispensary.licenseNumber || '',
      licenseExpiry: dispensary.licenseExpiry?.toISOString().slice(0, 10) || '',
      licenseState: dispensary.licenseState || 'VT',
      licenseStatus: dispensary.licenseStatus,
      licenseReviewNotes: dispensary.licenseReviewNotes || '',
      contactName: dispensary.contactName || '',
      email: dispensary.user?.email || '',
      phone: dispensary.phone || '',
      address: dispensary.address || '',
      city: dispensary.city || '',
      state: dispensary.state || 'VT',
      zip: dispensary.zip || '',
      website: dispensary.website || '',
      description: dispensary.description || '',
      logo: dispensary.logo || '',
    };
}
