import { getBuyerCatalog } from '@/lib/buyer-catalog';
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helpers";
import { 
  MapPin, 
  Phone, 
  Globe, 
  CheckCircle, 
  Package,
  ArrowLeft,
  Shield
} from "lucide-react";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { DEFAULT_COMMERCIAL_TERMS } from "@/lib/ux-workflow";
import GrowerShopContent from "./GrowerShopContent";
import { marketplaceGrowerWhere } from "@/lib/license";

interface GrowerPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ search?: string }>;
}

async function getGrowerWithProducts(id: string) {
  const [grower, fulfilledRequests] = await Promise.all([
    db.grower.findFirst({
      where: { id, ...marketplaceGrowerWhere() },
      select: {
        id: true, businessName: true, description: true, logo: true, isVerified: true,
        city: true, state: true, phone: true, website: true, licenseNumber: true,
        commercialMinimumOrder: true, commercialFulfillmentMethods: true, commercialFulfillmentRegion: true,
        commercialPaymentTerms: true, commercialResponseWindow: true, commercialContactNote: true,
      },
    }),
    db.order.count({
      where: {
        growerId: id,
        status: "DELIVERED",
      },
    }),
  ]);

  return grower ? { ...grower, fulfilledRequests } : null;
}

function getInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "PS";
}

function displayTerm(value: string | null | undefined, fallback: string) {
  return value?.trim() || fallback;
}

export default async function GrowerPage({ params, searchParams }: GrowerPageProps) {
  const session = await getAuthSession();
  if (!session) redirect('/auth/sign_in');
  if (session.user.role !== 'DISPENSARY' || !session.user.dispensaryId) redirect('/dashboard');
  const { id } = await params;
  const query = await searchParams;
  const [grower, catalog] = await Promise.all([
    getGrowerWithProducts(id),
    getBuyerCatalog(session.user.dispensaryId, new URLSearchParams({ growerId: id, limit: '24', search: query.search || '' })),
  ]);

  if (!grower) {
    notFound();
  }

  const website = (() => { try { const url = new URL(grower.website || ''); return ['http:', 'https:'].includes(url.protocol) ? url.href : null; } catch { return null; } })();

  // Calculate stats
  const fulfilledRequests = grower.fulfilledRequests;

  // Get unique product types
  const commercialTerms = {
    minimumOrder: displayTerm(grower.commercialMinimumOrder, DEFAULT_COMMERCIAL_TERMS.minimumOrder),
    fulfillmentMethods: displayTerm(grower.commercialFulfillmentMethods, DEFAULT_COMMERCIAL_TERMS.fulfillmentMethods),
    fulfillmentRegion: displayTerm(grower.commercialFulfillmentRegion, DEFAULT_COMMERCIAL_TERMS.fulfillmentRegion),
    paymentTerms: displayTerm(grower.commercialPaymentTerms, DEFAULT_COMMERCIAL_TERMS.paymentTerms),
    responseWindow: displayTerm(grower.commercialResponseWindow, DEFAULT_COMMERCIAL_TERMS.responseWindow),
    contactNote: displayTerm(grower.commercialContactNote, DEFAULT_COMMERCIAL_TERMS.contactNote),
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={grower.businessName}
        description={grower.description || "Browse products and discuss terms with the grower."}
        actions={
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <Link
              href="/dispensary/catalog"
              className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-pf-muted transition-colors hover:bg-pf-accent-bg hover:text-pf-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas"
            >
              <ArrowLeft className="h-4 w-4" />
              Catalog
            </Link>
            <Link
              href="#shop-products"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-[#032116] transition-colors hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas"
            >
              <Package className="h-4 w-4" />
              Browse products
            </Link>
          </div>
        }
      />

      <div className="rounded-xl border border-pf-line bg-pf-surface p-4 text-pf-text">
        <div className="flex items-start gap-4 sm:items-center">
          <div className="flex-shrink-0">
            {grower.logo ? (
              // eslint-disable-next-line @next/next/no-img-element -- Existing logos can use legacy inline or local URLs until the Blob backfill.
              <img
                src={grower.logo}
                alt={grower.businessName}
                width={112}
                height={112}
                className="h-14 w-14 rounded-xl border border-pf-line object-cover sm:h-16 sm:w-16"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-pf-accent-line bg-pf-accent-bg sm:h-16 sm:w-16">
                <span className="text-xl font-semibold text-pf-accent">
                  {getInitials(grower.businessName)}
                </span>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            {grower.isVerified && (
              <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-pf-accent-bg px-3 py-1">
                <CheckCircle className="h-5 w-5 text-pf-accent" />
                <span className="text-sm font-medium text-pf-accent">Verified</span>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-pf-secondary">
              {grower.city && grower.state && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {grower.city}, {grower.state}
                </span>
              )}
              {grower.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {grower.phone}
                </span>
              )}
              {website && (
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded-sm transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-pf-canvas"
                >
                  <Globe className="h-4 w-4" />
                  Website
                </a>
              )}
              {grower.licenseNumber && (
                <span className="flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  License: {grower.licenseNumber}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <p className="text-sm text-pf-muted">
        {commercialTerms.fulfillmentMethods === DEFAULT_COMMERCIAL_TERMS.fulfillmentMethods ? 'Pickup or delivery' : commercialTerms.fulfillmentMethods}
        {' · '}{commercialTerms.minimumOrder}
      </p>

      <GrowerShopContent key={grower.id}
        initialData={catalog}
        growerName={grower.businessName}
        growerId={grower.id}
      />
      <details className="rounded-xl border border-pf-line bg-pf-surface px-4 py-1">
        <summary className="min-h-10 cursor-pointer content-center text-sm font-semibold text-pf-text">Shop details</summary>
        <dl className="my-3 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div><dt className="text-pf-muted">Region</dt><dd>{commercialTerms.fulfillmentRegion}</dd></div>
          <div><dt className="text-pf-muted">Fulfillment</dt><dd>{commercialTerms.fulfillmentMethods}</dd></div>
          <div><dt className="text-pf-muted">Minimum</dt><dd>{commercialTerms.minimumOrder}</dd></div>
          <div><dt className="text-pf-muted">Replies</dt><dd>{commercialTerms.responseWindow === DEFAULT_COMMERCIAL_TERMS.responseWindow ? '1 business day' : commercialTerms.responseWindow}</dd></div>
          <div><dt className="text-pf-muted">Payment terms</dt><dd>{commercialTerms.paymentTerms === DEFAULT_COMMERCIAL_TERMS.paymentTerms ? 'Direct with grower' : commercialTerms.paymentTerms}</dd></div>
          <div><dt className="text-pf-muted">Requests fulfilled</dt><dd>{fulfilledRequests}</dd></div>
          {commercialTerms.contactNote !== DEFAULT_COMMERCIAL_TERMS.contactNote && <div className="sm:col-span-2"><dt className="text-pf-muted">Contact note</dt><dd>{commercialTerms.contactNote}</dd></div>}
        </dl>
      </details>
    </div>
  );
}
