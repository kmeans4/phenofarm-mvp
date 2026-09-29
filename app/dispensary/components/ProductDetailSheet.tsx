'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Modal } from '@/app/components/ui/Modal';
import { ProductImage } from '@/app/components/ui/ProductImage';
import { LabReportDownloads } from './LabReportDownloads';
import AddToCartButton from '../catalog/components/AddToCartButton';
import type { LabReportKey } from '@/lib/lab-reports';
import { formatMoney } from '@/lib/format';
import { formatProductUnit } from '@/lib/product-display';

type Detail = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  strain: string | null;
  unit: string | null;
  thc: number | null;
  cbd: number | null;
  inventoryQty: number;
  images: string[];
  productType: string | null;
  labReports: LabReportKey[];
  grower: { id: string; businessName: string };
  terms: {
    commercialMinimumOrder: string | null;
    commercialFulfillmentMethods: string | null;
    commercialFulfillmentRegion: string | null;
    commercialPaymentTerms: string | null;
  } | null;
};
export function ProductDetailSheet({
  productId,
  onClose,
}: {
  productId: string;
  onClose: () => void;
}) {
  const [product, setProduct] = useState<Detail | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!productId) return;
    const controller = new AbortController();
    queueMicrotask(() => {
      if (!controller.signal.aborted) {
        setProduct(null);
        setError('');
      }
    });
    void fetch(`/api/dispensary/products/${encodeURIComponent(productId)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || 'Could not load product.');
        setProduct(data.product);
      })
      .catch((cause) => {
        if (!controller.signal.aborted)
          setError(
            cause instanceof Error ? cause.message : 'Could not load product.'
          );
      });
    return () => controller.abort();
  }, [productId, retry]);
  return (
    <Modal
      open={!!productId}
      onClose={onClose}
      title={product?.name || 'Product details'}
      className="max-w-2xl"
    >
      {error ? (
        <div role="alert" className="space-y-3">
          <p>{error}</p>
          <button
            className="min-h-11 rounded-lg border border-pf-line-strong px-4"
            onClick={() => setRetry((value) => value + 1)}
          >
            Retry
          </button>
        </div>
      ) : !product ? (
        <p role="status">Loading product…</p>
      ) : (
        <div className="space-y-4">
          <div className="flex snap-x gap-3 overflow-x-auto">
            {(product.images.length ? product.images : ['']).map(
              (image, index) => (
                <ProductImage
                  key={image || index}
                  src={image}
                  alt={`${product.name}${product.images.length > 1 ? ` photo ${index + 1}` : ''}`}
                  productType={product.productType}
                  className="h-56 w-full shrink-0 snap-center rounded-xl sm:h-72"
                />
              )
            )}
          </div>
          <Link
            href={`/dispensary/grower/${product.grower.id}`}
            className="inline-flex min-h-11 items-center font-semibold text-pf-accent"
          >
            {product.grower.businessName}
          </Link>
          <p className="text-sm text-pf-secondary">
            {[
              product.productType,
              product.thc != null ? `THC ${product.thc}%` : '',
              product.cbd != null ? `CBD ${product.cbd}%` : '',
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
          {product.description && (
            <p className="whitespace-pre-wrap text-sm text-pf-secondary">
              {product.description}
            </p>
          )}
          <section>
            <h3 className="mb-2 font-semibold">Lab results</h3>
            {product.labReports.length ? (
              <LabReportDownloads
                productId={product.id}
                productName={product.name}
                reports={product.labReports}
                showHeading={false}
              />
            ) : (
              <p className="text-sm text-pf-muted">
                No lab results.{' '}
                <Link
                  className="inline-flex min-h-11 items-center text-pf-accent underline"
                  href={`/messages?growerId=${product.grower.id}&productId=${product.id}`}
                >
                  Ask grower
                </Link>
              </p>
            )}
          </section>
          <section className="rounded-lg border border-pf-line p-3">
            <h3 className="font-semibold">Grower terms</h3>
            <dl className="mt-2 grid gap-2 text-sm">
              {[
                ['Minimum order', product.terms?.commercialMinimumOrder],
                [
                  'Pickup / delivery',
                  product.terms?.commercialFulfillmentMethods,
                ],
                ['Service area', product.terms?.commercialFulfillmentRegion],
                ['Payment', product.terms?.commercialPaymentTerms],
              ]
                .filter(([, value]) => value)
                .map(([label, value]) => (
                  <div
                    key={label}
                    className="flex flex-wrap justify-between gap-x-4"
                  >
                    <dt className="text-pf-muted">{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
            </dl>
          </section>
          {product.price != null ? (
            <>
              <p className="text-xl font-semibold text-pf-accent">
                {formatMoney(product.price)} / {formatProductUnit(product.unit)}
              </p>
              <AddToCartButton
                product={product}
                growerName={product.grower.businessName}
                growerId={product.grower.id}
              />
            </>
          ) : (
            <Link
              href={`/messages?growerId=${product.grower.id}&productId=${product.id}`}
              className="inline-flex min-h-11 items-center rounded-lg bg-emerald-500 px-4 font-semibold text-[#032116]"
            >
              Ask for price
            </Link>
          )}
        </div>
      )}
    </Modal>
  );
}
