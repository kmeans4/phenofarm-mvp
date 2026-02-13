import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from 'next/link';

export default async function AdminGrowersPage() {
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

  // Fetch real growers from database with error handling
  let growers: any[] = [];
  let pendingGrowers: any[] = [];
  let verifiedGrowers: any[] = [];

  try {
    growers = await db.grower.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            products: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }) || [];

    // Filter based on isVerified if available, otherwise treat all as verified
    pendingGrowers = growers.filter(g => g.isVerified === false);
    verifiedGrowers = growers.filter(g => g.isVerified !== false);
  } catch (error) {
    console.error('Admin growers fetch error:', error);
    // Return empty arrays on error
  }

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
        <h1 className="text-3xl font-bold text-gray-900">Grower Management</h1>
        <div className="text-sm text-gray-500">
          {verifiedGrowers.length} verified • {pendingGrowers.length} pending
        </div>
      </div>

      {/* Pending Verification */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-yellow-50">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Pending Verification</h2>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full font-medium">
              {pendingGrowers.length} pending
            </span>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          {pendingGrowers.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No pending grower applications</p>
          ) : (
            pendingGrowers.map((grower) => (
              <div key={grower.id} className="border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{grower.businessName}</h3>
                  <p className="text-sm text-gray-500">
                    {grower.user?.email || 'No email'} • License: {grower.licenseNumber || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Applied on {formatDate(grower.createdAt)}
                  </p>
                  {grower.address && (
                    <p className="text-xs text-gray-400">{grower.address}, {grower.city}, {grower.state}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <a 
                    href={`mailto:${grower.user?.email}`}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                  >
                    Contact
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Verified Growers */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Verified Growers ({verifiedGrowers.length})</h2>
        </div>
        
        {verifiedGrowers.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No verified growers yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grower</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Products</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {verifiedGrowers.map((grower) => (
                  <tr key={grower.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">
                          {grower.businessName.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">{grower.businessName}</div>
                          <div className="text-sm text-gray-500">{grower.user?.email}</div>
                          <div className="text-xs text-gray-400">{grower.city}, {grower.state}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {grower.licenseNumber || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {grower._count?.products || 0} products
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(grower.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Grower Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Total Growers</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{growers.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Pending Verification</p>
          <p className="text-3xl font-bold text-yellow-600 mt-1">{pendingGrowers.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Verified Growers</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{verifiedGrowers.length}</p>
        </div>
      </div>
    </div>
  );
}
