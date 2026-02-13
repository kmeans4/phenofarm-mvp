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

  const user = session.user as any;
  
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
  const growerGroups = products.reduce((groups: any[], product) => {
    const existingGroup = groups.find(g => g.growerId === product.grower.id);
    
    if (existingGroup) {
      existingGroup.products.push(product);
    } else {
      groups.push({
        growerId: product.grower.id,
        growerName: product.grower.businessName,
        products: [product],
      });
    }
    
    return groups;
  }, []);

  return <CatalogContent initialGroups={growerGroups} />;
}
