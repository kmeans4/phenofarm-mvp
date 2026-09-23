import Link from "next/link";
import { getAuthSession } from '@/lib/auth-helpers';
import { redirect } from "next/navigation";
import { getGrowerProductPage } from "@/lib/grower-products";
import { Pagination } from "@/app/components/ui/Pagination";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { InventoryClient, InventoryProduct } from "./InventoryClient";

export default async function GrowerInventoryPage({ searchParams }: { searchParams: Promise<{ page?: string; view?: string }> }) {
  const session = await getAuthSession();
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const sessionUser = session.user as { growerId?: string; role?: string };
  
  if (sessionUser.role !== 'GROWER' || !sessionUser.growerId) redirect('/dashboard');

  const query = await searchParams;
  const view = ['all', 'low-stock', 'out-of-stock', 'unavailable'].includes(query.view || '') ? query.view! : 'all';
  const result = await getGrowerProductPage(sessionUser.growerId, new URLSearchParams({ page: query.page || '1', pageSize: '25', view }));
  const rawProducts = result.products;

  // Convert Decimal prices to numbers and use new schema fields
  const products: InventoryProduct[] = rawProducts.map((p) => ({
    id: p.id,
    name: p.name,
    productType: p.productType,
    subType: p.subType,
    price: Number(p.price) || 0,
    inventoryQty: p.inventoryQty,
    unit: p.unit || 'Gram',
    isAvailable: p.isAvailable,
    strainName: p.strain?.name || null,
  }));

  return (
    <div className="space-y-3 sm:space-y-6">
      <PageHeader
        title="Inventory"
        actions={
          <>
            <Link href="/grower/products/add" className="rounded-lg bg-emerald-500 px-4 py-2 text-center text-sm font-semibold text-[#032116] hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2 sm:w-auto">
              Add product
            </Link>
            <Link href="/grower/inventory/add" className="rounded-lg border border-pf-line-strong bg-pf-surface px-4 py-2 text-center text-sm font-semibold text-pf-secondary hover:bg-pf-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pf-accent focus-visible:ring-offset-2 sm:w-auto">
              Update stock
            </Link>
          </>
        }
      />

      <InventoryClient initialProducts={products} view={view as "all" | "low-stock" | "out-of-stock" | "unavailable"} counts={result.counts} inventoryValue={result.inventoryValue} />
      <Pagination page={result.page} pageSize={result.pageSize} total={result.total} basePath="/grower/inventory" query={{ view }} label="products" />
    </div>
  );
}
