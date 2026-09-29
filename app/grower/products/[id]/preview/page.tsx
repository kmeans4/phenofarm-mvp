import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getAuthSession } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import {
  formatProductMoney,
  formatProductStock,
  formatProductUnit,
  productVisibility,
} from '@/lib/product-display';
import { formatHarvestDate } from '@/lib/batch-utils';
import { ProductImage } from '@/app/components/ui/ProductImage';
import { LabReportDownloads } from '@/app/dispensary/components/LabReportDownloads';
import { productLabReportsById } from '@/lib/buyer-lab-reports';
export default async function ProductPreview({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getAuthSession();
  if (!session || session.user.role !== 'GROWER' || !session.user.growerId)
    redirect('/dashboard');
  const { id } = await params;
  const product = await db.product.findFirst({
    where: { id, growerId: session.user.growerId, isDeleted: false },
    include: {
      strain: true,
      batch: true,
      grower: { select: { businessName: true } },
    },
  });
  if (!product) notFound();
  const reports = await productLabReportsById([id]);
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Link
        className="inline-flex min-h-11 items-center text-sm text-pf-accent"
        href={`/grower/products/${id}/edit`}
      >
        ← Edit product
      </Link>
      <p className="rounded-lg border border-pf-line p-3 text-sm">
        Buyer preview · {productVisibility(product)}. This page is visible only
        to you.
      </p>
      <article
        className={`grid gap-5 rounded-xl border border-pf-line bg-pf-surface p-4 ${product.images.length ? 'sm:grid-cols-2' : ''}`}
      >
        <div
          className={`grid grid-cols-3 gap-2 ${product.images.length ? '' : 'hidden'}`}
        >
          {product.images.map((image, index) => (
            <ProductImage
              key={index}
              src={image}
              alt={`${product.name} photo ${index + 1}`}
              productType={product.productType}
              className={`${index === 0 ? 'col-span-3 h-64 sm:h-80' : 'aspect-square'} w-full rounded-lg object-cover`}
              placeholderClassName="h-24"
              showPlaceholderLabel={false}
            />
          ))}
        </div>
        <div className="space-y-4">
          <p className="text-sm text-pf-muted">{product.grower.businessName}</p>
          <h1 className="text-2xl font-semibold">{product.name}</h1>
          <p className="text-sm">
            {[
              product.productType,
              product.subType,
              product.strain?.name,
              product.strain?.strainType,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
          <p className="text-xl font-semibold">
            {product.isPriceVisible
              ? `${formatProductMoney(Number(product.price))} / ${formatProductUnit(product.unit)}`
              : 'Price on request'}
          </p>
          <p>
            {formatProductStock(product.inventoryQty, product.unit)} available
          </p>
          {(product.thcMin !== null || product.cbdMin !== null) && (
            <p>
              {product.thcMin !== null
                ? `THC ${product.thcMin}${product.thcMax !== null && Number(product.thcMax) !== Number(product.thcMin) ? `–${product.thcMax}` : ''}%`
                : ''}
              {product.cbdMin !== null ? ` · CBD ${product.cbdMin}%` : ''}
            </p>
          )}
          {product.harvestDate && (
            <p>Harvested {formatHarvestDate(product.harvestDate)}</p>
          )}
          {product.description && (
            <p className="whitespace-pre-wrap">{product.description}</p>
          )}
          <LabReportDownloads
            productName={product.name}
            productId={id}
            reports={reports.get(id) || []}
            audience="grower"
          />
        </div>
      </article>
    </div>
  );
}
