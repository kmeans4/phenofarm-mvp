import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import CatalogContent from "./CatalogContent";

export default async function DispensaryCatalogPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = (session as any).user as { role: string; growerId?: string; dispensaryId?: string };
  
  if (user.role !== 'DISPENSARY') {
    redirect('/dashboard');
  }

  // Fetch all available products with grower info
  const products = await db.product.findMany({
    where: {
      isAvailable: true,
      inventoryQty: { gt: 0 },
    },
    include: {
      grower: {
        select: {
          id: true,
          businessName: true,
        },
      },
    },
    orderBy: [
      { grower: { businessName: 'asc' } },
      { name: 'asc' },
    ],
  });

  // Group products by grower
  const growerGroups = products.reduce((groups: { growerId: string; growerName: string; products: { id: string; name: string; price: number; strain: string | null; unit: string | null; thc: number | null; inventoryQty: number; category: string | null; grower: { id: string; businessName: string } }[] }[], product) => {
    const existingGroup = groups.find(g => g.growerId === product.grower.id);
    
    if (existingGroup) {
      existingGroup.products.push({ ...product, price: Number(product.price) });
    } else {
      groups.push({
        growerId: product.grower.id,
        growerName: product.grower.businessName,
        products: [{ ...product, price: Number(product.price) }],
      });
    }
    
    return groups;
  }, []);

  return <CatalogContent initialGroups={growerGroups} />;
}
