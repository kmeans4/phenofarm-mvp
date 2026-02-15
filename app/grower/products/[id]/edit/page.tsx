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

  let product: any = null;
  let strains: any[] = [];
  let batches: any[] = [];
  let productTypeConfigs: any[] = [];

  try {
    product = await db.product.findFirst({
      where: { id, growerId: user.growerId },
      include: {
        strain: { select: { id: true, name: true } },
        batch: { select: { id: true, batchNumber: true } },
      },
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Product</h2>
          <p className="text-red-600">Unable to fetch product details. Please try again later.</p>
        </div>
      </div>
    );
  }

  if (!product) {
    redirect('/grower/products');
  }

  try {
    strains = await db.strain.findMany({
      where: { growerId: user.growerId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    batches = await db.batch.findMany({
      where: { growerId: user.growerId },
      select: { id: true, batchNumber: true, strain: { select: { name: true } } },
      orderBy: { batchNumber: 'desc' },
      take: 50,
    });

    productTypeConfigs = await db.productTypeConfig.findMany({
      where: { 
        OR: [
          { growerId: user.growerId },
          { growerId: null }
        ]
      },
      select: { type: true, subTypes: true },
    });
  } catch (error) {
    console.error('Error fetching strains, batches, or configs:', error);
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Form Data</h2>
          <p className="text-red-600">Unable to fetch strains, batches, or product type configurations. Please try again later.</p>
        </div>
      </div>
    );
  }

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

  const productTypes = productTypeConfigs.map(c => c.type);
  const uniqueProductTypes = [...new Set(productTypes)];

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
        productTypeConfigs={productTypeConfigs}
      />
    </div>
  );
}
