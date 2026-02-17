import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import EditOrderForm from './components/EditOrderForm';

async function fetchOrder(id: string, growerId: string) {
  const order = await db.order.findUnique({
    where: { id, growerId },
    include: {
      dispensary: true,
      items: {
        include: {
          product: {
            include: {
              strain: { select: { id: true, name: true } }
            }
          },
        },
      },
    },
  });
  
  if (!order) return null;
  
  return {
    ...order,
    totalAmount: Number(order.totalAmount),
    subtotal: Number(order.subtotal),
    tax: Number(order.tax),
    shippingFee: Number(order.shippingFee),
    items: order.items.map((item) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
      product: {
        ...item.product,
        // Use strain relation or legacy field
        strain: item.product.strain?.name || item.product.strainLegacy,
        // Use new schema fields
        productType: item.product.productType,
        subType: item.product.subType,
      },
    })),
  };
}

interface ExtendedUser {
  role: string;
  growerId?: string;
  dispensaryId?: string;
}
interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditOrderPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session.user as ExtendedUser;

  if (user.role !== 'GROWER') {
    redirect('/dashboard');
  }

  const { id } = await params;
  const order = await fetchOrder(id, user.growerId!);

  if (!order) {
    redirect('/grower/orders');
  }

  return <EditOrderForm order={order} />;
}
