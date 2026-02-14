import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

interface DispensaryWithUser {
  id: string;
  businessName: string;
  licenseNumber: string | null;
  isVerified: boolean;
  createdAt: Date;
  user: {
    email: string | null;
    name: string | null;
  };
}

export default async function AdminDispensariesPage() {
  let session;
  
  try {
    session = await getServerSession(authOptions);
  } catch {
    redirect('/auth/sign_in');
  }
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!session || !(session as any)?.user) {
    redirect('/auth/sign_in');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (session as any).user.role as string;
  
  if (userRole !== 'ADMIN') {
    redirect('/dashboard');
  }

  // Fetch dispensaries with error handling
  let dispensaries: DispensaryWithUser[] = [];
  try {
    dispensaries = await db.dispensary.findMany({
      include: {
        user: { select: { email: true, name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
  } catch {
    dispensaries = [];
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dispensary Management</h1>
        <p className="text-gray-500">{dispensaries.length} dispensaries found</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {dispensaries.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No dispensaries found or database error
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Business</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">License</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Joined</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {dispensaries.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{d.businessName}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{d.user?.email || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{d.licenseNumber || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${
                        d.isVerified 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {d.isVerified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(d.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form action={`/admin/dispensaries/${d.id}/verify`} method="POST">
                        <button
                          type="submit"
                          className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            d.isVerified
                              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {d.isVerified ? 'Unverify' : 'Verify'}
                        </button>
                      </form>
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
