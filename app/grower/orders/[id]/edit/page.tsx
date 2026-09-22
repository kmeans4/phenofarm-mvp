import { getAuthSession } from '@/lib/auth-helpers';
import { redirect, notFound } from 'next/navigation';
import { db } from '@/lib/db';
import EditOrderForm from './components/EditOrderForm';

async function fetchOrder(id: string, growerId: string) {
  const order = await db.order.findUnique({
    where: { id, growerId },
    include: {
      dispensary: { select: { id: true, businessName: true, phone: true, address: true, city: true, state: true, zip: true, isOffPlatform: true } },
      items: {
        include: {
          product: {
            select: { id: true, name: true, unit: true, inventoryQty: true, strain: { select: { name: true } } }
          },
        },
      },
    },
  });
  
  if (!order) return null;
  
  return {
    id: order.id,
    orderId: order.orderId,
    status: order.status,
    totalAmount: Number(order.totalAmount),
    subtotal: Number(order.subtotal),
    tax: Number(order.tax),
    shippingFee: Number(order.shippingFee),
    notes: order.notes,
    dispensary: {
      businessName: order.dispensary.businessName,
      phone: order.dispensary.phone,
      address: order.dispensary.address,
      city: order.dispensary.city,
      state: order.dispensary.state,
    },
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
      maxQuantity: item.quantity + Number(item.product.inventoryQty || 0),
      product: {
        id: item.product.id,
        name: item.product.name,
        unit: item.product.unit,
        strain: item.product.strain?.name || null,
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
  const session = await getAuthSession();

  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session.user as ExtendedUser;

  if (user.role !== 'GROWER' || !user.growerId) {
    redirect('/dashboard');
  }

  const { id } = await params;
  const order = await fetchOrder(id, user.growerId!);

  if (!order) {
    notFound();
  }

  return <EditOrderForm order={order} />;
}
