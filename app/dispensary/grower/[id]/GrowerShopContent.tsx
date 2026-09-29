'use client';
import type { BuyerCatalogPage } from '@/lib/buyer-catalog';
import CatalogContent from '../../catalog/CatalogContent';
export default function GrowerShopContent({
  initialData,
  growerId,
}: {
  initialData: BuyerCatalogPage;
  growerName: string;
  growerId: string;
}) {
  return (
    <section id="shop-products" className="scroll-mt-24">
      <CatalogContent initialData={initialData} fixedGrowerId={growerId} />
    </section>
  );
}
