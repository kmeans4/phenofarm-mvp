import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { format } from 'date-fns';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import Link from 'next/link';

const prisma = new PrismaClient();

interface OrderCardProps {
  id: string;
  orderId: string;
  dispensaryName: string;
  status: string;
  totalAmount: number;
  createdAt: Date;
}

function OrderCard({ id, orderId, dispensaryName, status, totalAmount, createdAt }: OrderCardProps) {
  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    PROCESSING: 'bg-purple-100 text-purple-800',
    SHIPPED: 'bg-orange-100 text-orange-800',
    DELIVERED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
  };

  const statusLabels = {
    PENDING: 'Pending',
    CONFIRMED: 'Confirmed',
    PROCESSING: 'Processing',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
  };

  return (
    <Link href={`/grower/orders/${id}`} className="block">
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-gray-900 text-lg">Order #{orderId}</h3>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[status as keyof typeof statusColors]}`}>
                {statusLabels[status as keyof typeof statusLabels]}
              </span>
            </div>
            <p className="text-gray-600">{dispensaryName}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">${totalAmount.toFixed(2)}</p>
            <p className="text-sm text-gray-500">{format(createdAt, 'MMM d, yyyy')}</p>
          </div>
        </div>
        
        <div className="flex gap-2 mt-6">
          <Button variant="primary" className="text-sm py-2">View Details</Button>
          <Button variant="secondary" className="text-sm py-2">Update Status</Button>
        </div>
      </div>
    </Link>
  );
}

export default async function GrowerOrdersPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session.user as any;
  
  if (user.role !== 'GROWER') {
    redirect('/dashboard');
  }

  const orders = await prisma.order.findMany({
    where: {
      growerId: user.growerId,
    },
    include: {
      dispensary: {
        select: {
          businessName: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const stats = await prisma.order.aggregate({
    where: {
      growerId: user.growerId,
    },
    _count: true,
    _sum: {
      totalAmount: true,
    },
  });

  const statusCounts = await prisma.order.groupBy({
    where: {
      growerId: user.growerId,
    },
    by: ['status'],
    _count: {
      status: true,
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Order Management
          </h1>
          <p className="text-gray-600 mt-1">Manage and track all orders</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" className="bg-white border-gray-300 hover:bg-gray-50">
            Filter
          </Button>
          <Button variant="primary" className="bg-green-600 hover:bg-green-700 text-white">
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-1">Total Orders</p>
            <p className="text-3xl font-bold text-gray-900">{stats._count}</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-gray-900">
              ${Number(stats._sum?.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-1">Pending</p>
            <p className="text-3xl font-bold text-yellow-600">
              {statusCounts.find((s: any) => s.status === 'PENDING')?._count.status || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-1">Active</p>
            <p className="text-3xl font-bold text-green-600">
              {statusCounts.filter((s: any) => ['CONFIRMED', 'PROCESSING', 'SHIPPED'].includes(s.status)).reduce((acc: number, s: any) => acc + (s._count.status || 0), 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.map((order: any) => (
          <OrderCard
            key={order.id}
            id={order.id}
            orderId={order.orderId}
            dispensaryName={order.dispensary.businessName}
            status={order.status}
            totalAmount={Number(order.totalAmount)}
            createdAt={order.createdAt}
          />
        ))}
      </div>

      {orders.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
          <p className="text-gray-600 mb-4">No orders yet</p>
          <p className="text-sm text-gray-500">Orders will appear here once dispatchers create them</p>
        </div>
      )}
    </div>
  );
}
