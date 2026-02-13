import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/Card';

export default async function AdminPage() {
  // Auth check
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session.user as any;
  
  if (user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  // Fetch real stats
  const [
    totalUsers,
    activeGrowers,
    activeDispensaries,
    pendingGrowers,
    totalProducts,
    totalOrders
  ] = await Promise.all([
    db.user.count(),
    db.grower.count({ where: { isVerified: true } }),
    db.dispensary.count({ where: { isVerified: true } }),
    db.grower.count({ where: { isVerified: false } }),
    db.product.count(),
    db.order.count()
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <span className="text-sm text-gray-500">Platform Overview</span>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Total Users</p>
            <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Active Growers</p>
            <p className="text-2xl font-bold text-green-600">{activeGrowers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Active Dispensaries</p>
            <p className="text-2xl font-bold text-blue-600">{activeDispensaries}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Pending Growers</p>
            <p className="text-2xl font-bold text-yellow-600">{pendingGrowers}</p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Total Products</p>
            <p className="text-2xl font-bold text-purple-600">{totalProducts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Total Orders</p>
            <p className="text-2xl font-bold text-orange-600">{totalOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Platform Status</p>
            <p className="text-lg font-bold text-green-600">✓ Operational</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/admin/users" className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow block">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h3 className="font-medium text-gray-900">Manage Users</h3>
          <p className="text-sm text-gray-500 mt-1">View and manage all {totalUsers} users</p>
        </Link>

        <Link href="/admin/growers" className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow block">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600 mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="font-medium text-gray-900">Grower Management</h3>
          <p className="text-sm text-gray-500 mt-1">Verify and manage grower accounts ({pendingGrowers} pending)</p>
        </Link>
      </div>

      {/* Platform Info */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Database Connection</span>
              <span className="text-green-600 font-medium">Connected</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Subscription Price</span>
              <span className="text-gray-900">$249/month</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Platform Commission</span>
              <span className="text-gray-900">5%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
