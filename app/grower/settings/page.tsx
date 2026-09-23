import { getAuthSession } from '@/lib/auth-helpers';
import { redirect, notFound } from "next/navigation";
import { SettingsForm } from "./components/SettingsForm";
import { SubscriptionBilling } from "@/app/components/settings/SubscriptionBilling";
import { CommercialTermsPanel } from "@/app/components/settings/CommercialTermsPanel";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { db } from '@/lib/db';
import { getSubscriptionSummary } from '@/lib/subscription';
import { DEFAULT_COMMERCIAL_TERMS } from '@/lib/ux-workflow';
import { SettingsSectionNav } from './components/SettingsSectionNav';

const settingsSections = [
  { id: "business-profile", label: "Profile" },
  { id: "branding", label: "Logo" },
  { id: "commercial-terms", label: "Terms" },
  { id: "subscription", label: "Subscription" },
];

export default async function GrowerSettingsPage() {
  const session = await getAuthSession();
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  if (session.user.role !== 'GROWER' || !session.user.growerId) redirect('/dashboard');
  const [grower, subscription] = await Promise.all([
    db.grower.findUnique({ where: { id: session.user.growerId }, select: {
      businessName: true, licenseNumber: true, licenseExpiry: true, contactName: true, phone: true, address: true, city: true, state: true, zip: true, website: true, description: true, logo: true, user: { select: { email: true } },
      commercialMinimumOrder: true, commercialFulfillmentMethods: true, commercialFulfillmentRegion: true, commercialPaymentTerms: true, commercialResponseWindow: true, commercialContactNote: true, commercialTermsUpdatedAt: true,
    } }),
    getSubscriptionSummary(session.user.growerId).catch(() => null),
  ]);
  if (!grower) notFound();
  const initialSettings = {
    businessName: grower.businessName, licenseNumber: grower.licenseNumber || '', licenseExpiry: grower.licenseExpiry?.toISOString().slice(0, 10) || '',
    contactName: grower.contactName || '', email: grower.user.email, phone: grower.phone || '', address: grower.address || '', city: grower.city || '', state: grower.state || 'VT', zip: grower.zip || '', website: grower.website || '', description: grower.description || '', logo: grower.logo || '',
  };
  const commercialTerms = { terms: {
    minimumOrder: grower.commercialMinimumOrder || DEFAULT_COMMERCIAL_TERMS.minimumOrder,
    fulfillmentMethods: grower.commercialFulfillmentMethods || DEFAULT_COMMERCIAL_TERMS.fulfillmentMethods,
    fulfillmentRegion: grower.commercialFulfillmentRegion || DEFAULT_COMMERCIAL_TERMS.fulfillmentRegion,
    paymentTerms: grower.commercialPaymentTerms || DEFAULT_COMMERCIAL_TERMS.paymentTerms,
    responseWindow: grower.commercialResponseWindow || DEFAULT_COMMERCIAL_TERMS.responseWindow,
    contactNote: grower.commercialContactNote || DEFAULT_COMMERCIAL_TERMS.contactNote,
  }, savedAt: grower.commercialTermsUpdatedAt?.toISOString() || null };

  return (
    <div className="pb-4">
      <PageHeader title="Settings" />

      <div className="mt-4 space-y-4">
        <aside className="sticky top-[65px] z-20 lg:top-0">
          <SettingsSectionNav sections={settingsSections} />
        </aside>

        <div className="min-w-0 space-y-5 sm:space-y-6">
          <SettingsForm initialSettings={initialSettings} />
          <section id="commercial-terms" className="scroll-mt-36 lg:scroll-mt-20">
            <CommercialTermsPanel initialData={commercialTerms} />
          </section>
          <section id="subscription" className="scroll-mt-36 lg:scroll-mt-20">
            <SubscriptionBilling initialData={subscription} />
          </section>
        </div>
      </div>
    </div>
  );
}
