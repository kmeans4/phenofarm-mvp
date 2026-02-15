import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import EditProductForm from "./components/EditProductForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = (session as any).user;
  if (user?.role !== 'GROWER') {
    redirect('/dashboard');
  }

  const { id } = await params;

  // Fetch product with strain and batch relations
  const product = await db.product.findFirst({
    where: { id, growerId: user.growerId },
    include: {
      strain: { select: { id: true, name: true } },
      batch: { select: { id: true, batchNumber: true } },
    },
  });

  if (!product) {
    redirect('/grower/products');
  }

  // Fetch grower's strains for the dropdown
  const strains = await db.strain.findMany({
    where: { growerId: user.growerId },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  // Fetch grower's batches for the dropdown
  const batches = await db.batch.findMany({
    where: { growerId: user.growerId },
    select: { id: true, batchNumber: true, strain: { select: { name: true } } },
    orderBy: { batchNumber: 'desc' },
    take: 50,
  });

  // Fetch product type configs for dropdowns
  const productTypeConfigs = await db.productTypeConfig.findMany({
    where: { 
      OR: [
        { growerId: user.growerId },
        { growerId: null } // Global configs
      ]
    },
    select: { type: true, subTypes: true },
  });

  // Serialize properly
  const { strain, batch, ...productData } = product;
  
  const serializedProduct = {
    ...productData,
    price: Number(product.price),
    strainId: product.strainId,
    strainName: strain?.name || product.strainLegacy,
    batchId: product.batchId,
    batchNumber: batch?.batchNumber,
    productType: product.productType,
    subType: product.subType,
    thc: product.thcLegacy ? Number(product.thcLegacy) : null,
    cbd: product.cbdLegacy ? Number(product.cbdLegacy) : null,
  };

  // Get unique product types from configs
  const productTypes = productTypeConfigs.map(c => c.type);
  const uniqueProductTypes = [...new Set(productTypes)];

  // Build subtypes map for the selected product type
  const subtypesForType = (productType: string) => {
    const config = productTypeConfigs.find(c => c.type === productType);
    return config?.subTypes || [];
  };

  return (
    <div className="space-y-6 p-4 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
        <p className="text-gray-600 mt-1">Update your product details</p>
      </div>
      
      <EditProductForm 
        product={serializedProduct}
        strains={strains}
        batches={batches}
        productTypes={uniqueProductTypes}
        getSubtypesForType={subtypesForType}
      />
    </div>
  );
}
