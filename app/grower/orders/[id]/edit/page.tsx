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
          product: true,
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
    items: order.items.map((item: unknown) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
    })),
  };
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditOrderPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session.user as any;

  if (user.role !== 'GROWER') {
    redirect('/dashboard');
  }

  const { id } = await params;
  const order = await fetchOrder(id, user.growerId);

  if (!order) {
    redirect('/grower/orders');
  }

  return <EditOrderForm order={order} />;
}
