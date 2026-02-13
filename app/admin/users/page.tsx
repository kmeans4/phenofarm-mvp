import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from 'next/link';

export default async function AdminUsersPage() {
  // Auth check
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session.user as any;
  
  // Admin role check
  if (user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  // Fetch real users from database with error handling
  let users: any[] = [];
  
  try {
    users = await db.user.findMany({
      include: {
        grower: true,
        dispensary: true,
      },
      orderBy: { createdAt: 'desc' }
    }) || [];
  } catch (error) {
    console.error('Admin users fetch error:', error);
  }

  // Calculate stats
  const totalUsers = users.length;
  const verifiedUsers = users.filter(u => u.grower?.isVerified || u.dispensary?.isVerified).length;
  const growers = users.filter(u => u.role === 'GROWER').length;
  const dispensaries = users.filter(u => u.role === 'DISPENSARY').length;

  // Format date helper
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <Link 
          href="/auth/sign_up" 
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 inline-flex items-center gap-2"
        >
          + Add User
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Total Users</p>
          <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Verified Users</p>
          <p className="text-2xl font-bold text-green-600">{verifiedUsers}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Growers</p>
          <p className="text-2xl font-bold text-blue-600">{growers}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Dispensaries</p>
          <p className="text-2xl font-bold text-purple-600">{dispensaries}</p>
        </div>
      </div>

      {/* Filters */}
      <form className="flex gap-4" method="GET">
        <input 
          type="text" 
          name="search"
          placeholder="Search users..." 
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:ring-1 focus:ring-green-500"
        />
        <select name="role" className="rounded-lg border border-gray-300 px-4 py-2">
          <option value="ALL">All Roles</option>
          <option value="ADMIN">ADMIN</option>
          <option value="GROWER">GROWER</option>
          <option value="DISPENSARY">DISPENSARY</option>
        </select>
        <button type="submit" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg">
          Filter
        </button>
      </form>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">All Users ({users.length})</h2>
        </div>
        
        {users.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No users found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => {
                  const isVerified = user.grower?.isVerified || user.dispensary?.isVerified;
                  const businessName = user.grower?.businessName || user.dispensary?.businessName;
                  
                  return (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">
                            {(user.name || user.email).charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-gray-900">{user.name || 'No name'}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === 'ADMIN' ? 'bg-gray-100 text-gray-800' :
                          user.role === 'GROWER' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {businessName && <div className="text-gray-900">{businessName}</div>}
                        <div className={isVerified ? 'text-green-600' : 'text-yellow-600'}>
                          {isVerified ? '✓ Verified' : 'Pending'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <a 
                          href={`mailto:${user.email}`}
                          className="text-green-600 hover:text-green-900"
                        >
                          Contact
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
