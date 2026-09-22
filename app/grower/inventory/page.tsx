import Link from "next/link";
import { getAuthSession } from '@/lib/auth-helpers';
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { InventoryClient, InventoryProduct } from "./InventoryClient";

export default async function GrowerInventoryPage() {
  const session = await getAuthSession();
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const sessionUser = session.user as { growerId?: string; role?: string };
  
  if (sessionUser.role !== 'GROWER' || !sessionUser.growerId) redirect('/dashboard');

  // Fetch products for this grower with strain info
  const rawProducts = await db.product.findMany({
    where: { growerId: sessionUser.growerId, isDeleted: false },
    select: {
      id: true,
      name: true,
      productType: true,
      subType: true,
      price: true,
      inventoryQty: true,
      unit: true,
      isAvailable: true,
      strain: { select: { id: true, name: true } },
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

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
            <Link href="/grower/products/add" className="rounded-lg bg-green-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 sm:w-auto">
              Add product
            </Link>
            <Link href="/grower/inventory/add" className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 sm:w-auto">
              Update stock
            </Link>
          </>
        }
      />

      <InventoryClient initialProducts={products} />
    </div>
  );
}
