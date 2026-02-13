import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from 'next/link';

export default async function AdminPage() {
  let session;
  
  try {
    session = await getServerSession(authOptions);
  } catch (e) {
    redirect('/auth/sign_in');
  }
  
  if (!session?.user) {
    redirect('/auth/sign_in');
  }

  const userRole = (session.user as any).role;
  
  if (userRole !== 'ADMIN') {
    redirect('/dashboard');
  }

  // Fetch stats
  let stats = { users: 0, growers: 0, dispensaries: 0 };
  try {
    const [users, growers, dispensaries] = await Promise.all([
      db.user.count(),
      db.grower.count(),
      db.dispensary.count()
    ]);
    stats = { users, growers, dispensaries };
  } catch (e) {
    console.error('Stats error:', e);
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">Users</p>
          <p className="text-3xl font-bold text-gray-900">{stats.users}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">Growers</p>
          <p className="text-3xl font-bold text-green-600">{stats.growers}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">Dispensaries</p>
          <p className="text-3xl font-bold text-blue-600">{stats.dispensaries}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link 
          href="/admin/users" 
          className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition block"
        >
          <h3 className="font-medium text-gray-900">Manage Users</h3>
          <p className="text-sm text-gray-500 mt-1">View and manage users</p>
        </Link>
        <Link 
          href="/admin/growers" 
          className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition block"
        >
          <h3 className="font-medium text-gray-900">Manage Growers</h3>
          <p className="text-sm text-gray-500 mt-1">View and manage growers</p>
        </Link>
      </div>
    </div>
  );
}
