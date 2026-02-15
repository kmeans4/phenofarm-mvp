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

  // Fetch product with strain relation
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

  // Serialize properly - extract strain name and exclude relations
  const { strain, batch, ...productData } = product;
  
  const serializedProduct = {
    ...productData,
    price: Number(product.price),
    // Use strain relation or legacy field
    strain: strain?.name || product.strainLegacy,
    strainId: product.strainId,
    batchId: product.batchId,
    batchNumber: batch?.batchNumber,
    // Use new schema fields
    productType: product.productType,
    subType: product.subType,
    // Legacy fields
    thc: product.thcLegacy ? Number(product.thcLegacy) : null,
    cbd: product.cbdLegacy ? Number(product.cbdLegacy) : null,
  };

  return (
    <div className="space-y-6 p-4 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
        <p className="text-gray-600 mt-1">Update your product details</p>
      </div>
      
      <EditProductForm product={serializedProduct} />
    </div>
  );
}
