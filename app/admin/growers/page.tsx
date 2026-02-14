import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/app/components/ui/Button";

interface GrowerWithUser {
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

export default async function AdminGrowersPage() {
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

  // Fetch growers with error handling
  let growers: GrowerWithUser[] = [];
  try {
    growers = await db.grower.findMany({
      include: {
        user: { select: { email: true, name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
  } catch {
    growers = [];
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Grower Management</h1>
        <p className="text-gray-500">{growers.length} growers found</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {growers.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 mx-6 mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No growers yet</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Growers will appear here once they register on the platform.
            </p>
            <Button variant="primary" asChild>
              <Link href="/auth/register">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add a grower
              </Link>
            </Button>
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
                {growers.map((g) => (
                  <tr key={g.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{g.businessName}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{g.user?.email || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{g.licenseNumber || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={'inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ' + (
                        g.isVerified 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      )}>
                        {g.isVerified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(g.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form action={'/admin/growers/' + g.id + '/verify'} method="POST">
                        <button
                          type="submit"
                          className={'inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors ' + (
                            g.isVerified
                              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          )}
                        >
                          {g.isVerified ? 'Unverify' : 'Verify'}
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
