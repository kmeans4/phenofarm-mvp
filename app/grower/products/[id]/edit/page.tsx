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

  const product = await db.product.findFirst({
    where: { id, growerId: user.growerId },
  });

  if (!product) {
    redirect('/grower/products');
  }

  // Serialize Decimal fields
  const serializedProduct = {
    ...product,
    price: Number(product.price),
    thc: product.thc ? Number(product.thc) : null,
    cbd: product.cbd ? Number(product.cbd) : null,
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
