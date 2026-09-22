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
        _count: { select: { products: { where: { isAvailable: true, isDeleted: false, status: 'PUBLISHED', inventoryQty: { gt: 0 } } } } },
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

  return initials || "PF";
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
    <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-24">
      <PageHeader
        title={grower.businessName}
        description={grower.description || "Browse available products and request wholesale terms directly from this grower."}
        actions={
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <Link
              href="/dispensary/catalog"
              className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-green-50 hover:text-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Catalog
            </Link>
            <Link
              href="#shop-products"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
            >
              <Package className="h-4 w-4" />
              Browse products
            </Link>
          </div>
        }
      />

      <div className="rounded-xl border border-green-900/20 bg-gradient-to-r from-green-900 to-green-700 p-4 text-white shadow-sm sm:p-6">
        <div className="flex items-start gap-4 sm:items-center">
          <div className="flex-shrink-0">
            {grower.logo ? (
              // eslint-disable-next-line @next/next/no-img-element -- Existing logos can use legacy inline or local URLs until the Blob backfill.
              <img
                src={grower.logo}
                alt={grower.businessName}
                width={112}
                height={112}
                className="h-14 w-14 rounded-2xl border-4 border-white/20 object-cover shadow-lg sm:h-20 sm:w-20"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-4 border-white/20 bg-gradient-to-br from-emerald-500 to-green-800 shadow-lg sm:h-20 sm:w-20">
                <span className="text-3xl font-bold text-white">
                  {getInitials(grower.businessName)}
                </span>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            {grower.isVerified && (
              <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-green-500/20 px-3 py-1">
                <CheckCircle className="h-5 w-5 text-green-300" />
                <span className="text-sm font-medium text-green-100">Verified</span>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-green-100">
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
                  className="flex items-center gap-1 rounded-sm transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-green-800"
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

      <p className="text-sm text-gray-600">
        {commercialTerms.fulfillmentMethods === DEFAULT_COMMERCIAL_TERMS.fulfillmentMethods ? 'Pickup or delivery' : commercialTerms.fulfillmentMethods}
        {' · '}{commercialTerms.minimumOrder}
      </p>

      <GrowerShopContent key={grower.id}
        initialData={catalog}
        growerName={grower.businessName}
        growerId={grower.id}
      />
      <details className="rounded-xl border border-gray-200 bg-white p-4">
        <summary className="cursor-pointer text-sm font-semibold text-gray-900">Shop details</summary>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div><dt className="text-gray-500">Region</dt><dd>{commercialTerms.fulfillmentRegion}</dd></div>
          <div><dt className="text-gray-500">Fulfillment</dt><dd>{commercialTerms.fulfillmentMethods}</dd></div>
          <div><dt className="text-gray-500">Minimum</dt><dd>{commercialTerms.minimumOrder}</dd></div>
          <div><dt className="text-gray-500">Replies</dt><dd>{commercialTerms.responseWindow === DEFAULT_COMMERCIAL_TERMS.responseWindow ? '1 business day' : commercialTerms.responseWindow}</dd></div>
          <div><dt className="text-gray-500">Payment terms</dt><dd>{commercialTerms.paymentTerms === DEFAULT_COMMERCIAL_TERMS.paymentTerms ? 'Direct with grower' : commercialTerms.paymentTerms}</dd></div>
          <div><dt className="text-gray-500">Requests fulfilled</dt><dd>{fulfilledRequests}</dd></div>
          {commercialTerms.contactNote !== DEFAULT_COMMERCIAL_TERMS.contactNote && <div className="sm:col-span-2"><dt className="text-gray-500">Contact note</dt><dd>{commercialTerms.contactNote}</dd></div>}
        </dl>
      </details>
    </div>
  );
}
