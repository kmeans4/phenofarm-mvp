import { Pagination } from '@/app/components/ui/Pagination';
import { parsePage } from '@/lib/buyer-products';
import { productImagesById } from '@/lib/product-images';
import { getThcBadgeColor, getCbdBadgeColor, getStrainTypeColor } from '@/lib/product-badges';
import Link from "next/link";
import { getAuthSession } from '@/lib/auth-helpers';
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { CheckCircle2, FileText, Plus } from "lucide-react";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { ProductImage } from '@/app/components/ui/ProductImage';
import { STRAIN_TYPE_LABELS, isStrainType } from "@/lib/strain-types";
import { formatProductUnit } from '@/lib/product-display';

type MarketplaceProduct = {
  id: string;
  name: string;
  price: number;
  isPriceVisible: boolean;
  strainName: string | null;
  strainType: string | null;
  productType: string | null;
  subType: string | null;
  unit: string | null;
  thc: number | null;
  cbd: number | null;
  images: string[];
  inventoryQty: number;
  grower: {
    id: string;
    businessName: string;
    isVerified: boolean;
  };
};

function formatPercent(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1).replace(/\.0$/, "");
}

function getStrainTypeLabel(product: MarketplaceProduct) {
  if (isStrainType(product.strainType)) {
    return STRAIN_TYPE_LABELS[product.strainType];
  }

  const lower = product.strainName?.toLowerCase() || "";
  if (lower.includes("indica")) return "Indica";
  if (lower.includes("sativa")) return "Sativa";
  if (product.strainName) return "Hybrid";
  return null;
}

function BuyerPreviewCard({ product }: { product: MarketplaceProduct }) {
  const strainTypeLabel = getStrainTypeLabel(product);
  const firstImage = product.images[0];

  return (
    <div
      data-testid="marketplace-listing-card"
      data-product-id={product.id}
      className="relative overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-lg"
    >
      <div className="absolute left-3 top-3 h-16 w-16 overflow-hidden rounded-lg bg-gradient-to-br from-green-50 to-emerald-100 sm:relative sm:left-auto sm:top-auto sm:h-auto sm:w-auto sm:rounded-none">
        <ProductImage
          src={firstImage}
          alt={product.name}
          productType={product.productType}
          className="h-16 w-full sm:h-40"
          placeholderClassName="h-16 sm:h-40"
          showPlaceholderLabel={false}
        />


      </div>

      <div className="p-3 sm:p-4">
        <div className="min-h-16 pl-[76px] sm:min-h-0 sm:pl-0">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 flex-1 font-semibold text-gray-900">{product.name}</h3>
          {product.grower.isVerified && (
            <span className="mt-0.5 text-green-600" title="Verified Grower">
              <CheckCircle2 size={16} />
            </span>
          )}
        </div>


        {strainTypeLabel && (
          <div className="mb-2">
            <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${getStrainTypeColor(strainTypeLabel, 'card')}`}>
              {strainTypeLabel}
            </span>
          </div>
        )}
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          {product.thc != null && (
            <span className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${getThcBadgeColor(product.thc)}`}>
              THC {formatPercent(product.thc)}%
            </span>
          )}
          {product.cbd != null && (
            <span className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${getCbdBadgeColor(product.cbd)}`}>
              CBD {formatPercent(product.cbd)}%
            </span>
          )}
          {product.productType && (
            <span className="rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
              {product.productType}
            </span>
          )}
        </div>

        <div className="mb-3 text-sm text-gray-600">
          {product.strainName && (
            <p className="mb-1">
              <span className="text-gray-400">Strain:</span> {product.strainName}
            </p>
          )}
          <p className="text-xs text-gray-500">
            {product.inventoryQty} {formatProductUnit(product.unit)} available
          </p>
        </div>

        <div aria-hidden="true" className="pointer-events-none space-y-2 border-t border-gray-100 pt-3 opacity-80">
          {product.isPriceVisible ? (
            <div className="flex items-center justify-between gap-2 sm:block sm:space-y-2">
              <div className="min-w-0 flex-1 break-words">
                <span className="text-xl font-bold text-green-700">${product.price.toFixed(2)}</span>
                <span className="ml-1 text-sm text-gray-500">/ {formatProductUnit(product.unit)}</span>
              </div>
              <div
                aria-hidden="true"
                className="inline-flex min-h-10 flex-1 cursor-default items-center justify-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white sm:w-full"
              >
                <Plus size={16} />
                <span className="sm:hidden">Add</span><span className="hidden sm:inline">Add to draft</span>
              </div>
            </div>
          ) : (
            <div
              aria-hidden="true"
              className="inline-flex w-full cursor-default items-center justify-center gap-2 rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm font-medium text-green-700"
            >
              Request pricing
            </div>
          )}

          <div
            aria-hidden="true"
            className="inline-flex w-full cursor-default items-center justify-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-500"
          >
            Message grower
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between gap-2 border-t border-gray-100 pt-2 sm:mt-3 sm:block sm:pt-3">
          <p className="flex items-center gap-1.5 py-1 text-xs font-medium text-gray-500 sm:justify-center">
            <FileText size={14} />
            Lab results on request
          </p>
          <div className="shrink-0 text-right sm:mt-3 sm:border-t sm:border-gray-100 sm:pt-3">
          <Link
            href={`/grower/products/${product.id}/edit`}
            className="inline-flex min-h-10 items-center text-sm font-medium text-green-700 underline-offset-4 hover:text-green-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
          >
            Edit listing
          </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function GrowerMarketplacePage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const session = await getAuthSession();
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session.user;
  
  if (user?.role !== 'GROWER' || !user.growerId) {
    redirect('/dashboard');
  }

  const grower = await db.grower.findUnique({
    where: { id: user.growerId },
    select: {
      businessName: true,
      isVerified: true,
      commercialMinimumOrder: true,
    },
  });

  const query = await searchParams;
  const where = { growerId: user.growerId, isDeleted: false, isAvailable: true, status: 'PUBLISHED' as const, inventoryQty: { gt: 0 } };
  const [activeListings, hiddenPriceListings] = await Promise.all([
    db.product.count({ where }), db.product.count({ where: { ...where, isPriceVisible: false } }),
  ]);
  const pageSize = 24;
  const page = Math.min(parsePage(query.page || null), Math.max(1, Math.ceil(activeListings / pageSize)));
  const rawProducts = await db.product.findMany({
    where,
    take: pageSize, skip: (page - 1) * pageSize,
    select: { id: true, name: true, price: true, isPriceVisible: true, productType: true, subType: true, unit: true, thcMin: true, thcMax: true, cbdMin: true, cbdMax: true, inventoryQty: true, strain: { select: { name: true, strainType: true } }, batch: { select: { thc: true, cbd: true } } },
    orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
  });

  const productImages = await productImagesById(rawProducts.map(product => product.id));

  const growerProfile = {
    id: user.growerId,
    businessName: grower?.businessName || user.name || "Your grower profile",
    isVerified: Boolean(grower?.isVerified),
  };

  // Match buyer cards: batch lab values take precedence over product ranges.
  const products: MarketplaceProduct[] = rawProducts.map((p) => ({
    ...p,
    images: productImages.get(p.id) || [],
    price: Number(p.price) || 0,
    thc: p.batch?.thc != null ? Number(p.batch.thc) : p.thcMax != null ? Number(p.thcMax) : p.thcMin != null ? Number(p.thcMin) : null,
    cbd: p.batch?.cbd != null ? Number(p.batch.cbd) : p.cbdMax != null ? Number(p.cbdMax) : p.cbdMin != null ? Number(p.cbdMin) : null,
    strainName: p.strain?.name || null,
    strainType: p.strain?.strainType || null,
    productType: p.productType,
    grower: growerProfile,
  }));

  const savedMinimumOrder = grower?.commercialMinimumOrder?.trim();

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title={<>Marketplace<span className="sr-only sm:not-sr-only"> preview</span></>}
        description="How buyers see your listings."
        mobileInlineActions
        actions={
          <Link href="/grower/products/add" className="inline-flex min-h-10 items-center rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 sm:px-4">
            Add product
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <span><strong>{activeListings}</strong> active</span>
        <span><strong>{hiddenPriceListings}</strong> quote required</span>
        <Link href="/grower/settings#commercial-terms" className="text-green-700 underline">Terms{savedMinimumOrder ? ` · MOQ ${savedMinimumOrder}` : ''}</Link>
      </div>
      <div>
        <div>
          {products.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7h18M5 7l1 12h12l1-12M9 7V5a3 3 0 016 0v2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No active listings yet</h3>
              <p className="text-gray-500 mb-2 max-w-md mx-auto">
                Add a product to make it available to buyers.
              </p>
              <Link href="/grower/products/add" className="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                List your first product
              </Link>
            </div>
          ) : (
            <div>
              <h2 className="mb-3 text-lg font-semibold">{growerProfile.businessName}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <BuyerPreviewCard key={product.id} product={product} />
              ))}
              </div>
              <Pagination page={page} pageSize={pageSize} total={activeListings} basePath="/grower/marketplace" label="listings" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
