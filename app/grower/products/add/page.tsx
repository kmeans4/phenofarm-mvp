'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { productCopyFields } from '@/lib/product-copy';
import { ProductForm, type ProductFormData } from '../components/ProductForm';
import {
  buildProductRequestPayload,
  PRODUCT_STATUS,
} from '@/lib/product-payload';
import { toast } from '@/app/hooks/useToast';
import { LoadingState, ErrorState } from '@/app/components/ui/FetchState';
import { PageHeader } from '@/app/components/ui/PageHeader';

interface GrowerInfo {
  businessName: string;
}

export default function AddProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const duplicateId = searchParams?.get('duplicate');
  const requestedReturn = searchParams?.get('returnTo');
  const returnTo =
    requestedReturn?.startsWith('/grower/products') &&
    !requestedReturn.startsWith('//')
      ? requestedReturn
      : '/grower/products';
  const [copyFields, setCopyFields] = useState<Partial<ProductFormData> | null>(
    null
  );
  const [loadError, setLoadError] = useState('');
  const [loadVersion, setLoadVersion] = useState(0);
  const [formVersion, setFormVersion] = useState(0);
  const prefillStrainId = searchParams?.get('strainId');
  const prefillBatchId = searchParams?.get('batchId');
  const [growerInfo, setGrowerInfo] = useState<GrowerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialData = useMemo<Partial<ProductFormData>>(
    () => ({
      ...Object.fromEntries(
        [
          'name',
          'productType',
          'subType',
          'price',
          'inventoryQty',
          'unit',
        ].flatMap((key) =>
          searchParams?.get(key) ? [[key, searchParams.get(key)!]] : []
        )
      ),
      strainId: prefillStrainId || undefined,
      batchId: prefillBatchId || undefined,
      ...copyFields,
    }),
    [prefillStrainId, prefillBatchId, copyFields, searchParams]
  );

  useEffect(() => {
    const controller = new AbortController();
    const fetchGrowerInfo = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const [profileResponse, sourceResponse] = await Promise.all([
          fetch('/api/growers/me', { signal: controller.signal }),
          duplicateId
            ? fetch(`/api/products/${encodeURIComponent(duplicateId)}`, {
                signal: controller.signal,
              })
            : Promise.resolve(null),
        ]);
        if (!profileResponse.ok)
          throw new Error(
            'Could not load your business profile. Return to Products and try again.'
          );
        if (sourceResponse && !sourceResponse.ok)
          throw new Error(
            'Could not load the listing to copy. Return to Products and try again.'
          );
        const [profile, source] = await Promise.all([
          profileResponse.json(),
          sourceResponse?.json(),
        ]);
        if (controller.signal.aborted) return;
        setGrowerInfo(profile);
        setCopyFields(source ? productCopyFields(source) : null);
      } catch (error) {
        if (!controller.signal.aborted)
          setLoadError(
            error instanceof Error
              ? error.message
              : 'Could not load your business profile.'
          );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void fetchGrowerInfo();
    return () => controller.abort();
  }, [duplicateId, loadVersion]);

  const saveProduct = async (
    formData: ProductFormData,
    status: 'DRAFT' | 'PUBLISHED'
  ) => {
    const payload = buildProductRequestPayload(
      formData as unknown as Record<string, unknown>,
      status
    );

    const response = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw Object.assign(
        new Error(data.error || 'We could not save product. Please try again.'),
        { errors: data.errors || data.details || [] }
      );
    }

    return response.json();
  };

  const handleSubmit = async (
    formData: ProductFormData,
    addAnother = false
  ) => {
    try {
      setIsSubmitting(true);
      const product = await saveProduct(formData, PRODUCT_STATUS.PUBLISHED);
      toast.success(
        product.isAvailable
          ? 'Product is live'
          : Number(product.inventoryQty) === 0
            ? 'Saved but hidden: no stock'
            : 'Product saved hidden'
      );
      if (addAnother) {
        setCopyFields({
          productType: formData.productType,
          subType: formData.subType,
          unit: formData.unit,
          price: formData.price,
          brand: formData.brand,
          isPriceVisible: formData.isPriceVisible,
          strainId: '',
          batchId: '',
        });
        setFormVersion((version) => version + 1);
        window.scrollTo({ top: 0 });
      } else router.push(returnTo);
    } catch (err: unknown) {
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async (formData: ProductFormData) => {
    try {
      setIsSubmitting(true);
      await saveProduct(formData, PRODUCT_STATUS.DRAFT);
      router.push(returnTo);
    } catch (err: unknown) {
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-4">
        <PageHeader title="Add product" />
        <LoadingState title="Loading product form" />
      </div>
    );
  }

  if (loadError)
    return (
      <ErrorState
        description={loadError}
        onRetry={() => setLoadVersion((value) => value + 1)}
      />
    );

  return (
    <div className="mx-auto w-full max-w-5xl space-y-3 sm:space-y-6">
      <Link
        href={returnTo}
        className="inline-flex min-h-11 items-center text-sm text-pf-accent"
      >
        ← Products
      </Link>
      <PageHeader title="Add product" />
      {duplicateId && formVersion === 0 && (
        <p className="rounded-lg border border-pf-info-line bg-pf-info-bg p-3 text-sm">
          Unsaved copy. Photos and product details were copied. Enter this
          listing’s stock and SKU, review its batch, then publish or save a
          draft.
        </p>
      )}
      <ProductForm
        allowAddAnother
        draftKey={duplicateId ? `copy:${duplicateId}` : 'new'}
        key={`${duplicateId || ''}:${prefillStrainId || ''}:${prefillBatchId || ''}:${formVersion}`}
        onSubmit={handleSubmit}
        onSaveDraft={handleSaveDraft}
        onCancel={() => router.push(returnTo)}
        growerBrand={growerInfo?.businessName}
        initialData={initialData}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
