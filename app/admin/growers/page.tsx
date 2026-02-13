import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export default async function AdminGrowersPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session.user as any;
  
  if (user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  // Fetch all growers (don't filter by isVerified - column may not exist yet)
  const growers = await db.grower.findMany({
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
  });

  // Handle isVerified filtering in JS (column might not exist in DB yet)
  const pendingGrowers = growers.filter((g: any) => g.isVerified === false);
  const verifiedGrowers = growers.filter((g: any) => g.isVerified !== false);

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

      {/* Growers Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">All Growers ({growers.length})</h2>
        </div>
        
        {growers.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 mb-4">No growers found in the database.</p>
            <p className="text-sm text-gray-400">Demo accounts should be created via signup or seed script.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grower</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">License</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Products</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {growers.map((grower: any) => (
                  <tr key={grower.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">
                          {grower.businessName?.charAt(0).toUpperCase() || 'G'}
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
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        grower.isVerified 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {grower.isVerified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {grower._count?.products || 0}
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
    </div>
  );
}
