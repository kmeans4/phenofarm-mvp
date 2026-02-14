import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/app/components/ui/Button";

interface UserWithBusiness {
  id: string;
  email: string;
  role: string;
  createdAt: Date;
  grower: { businessName: string } | null;
  dispensary: { businessName: string } | null;
}

export default async function AdminUsersPage() {
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

  // Fetch users with error handling
  let users: UserWithBusiness[] = [];
  try {
    users = await db.user.findMany({
      include: {
        grower: { select: { businessName: true } },
        dispensary: { select: { businessName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
  } catch {
    users = [];
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-500">{users.length} users found</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {users.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 mx-6 mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No users yet</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Users will appear here once they sign up through the registration page.
            </p>
            <Button variant="primary" asChild>
              <Link href="/auth/register">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create a user
              </Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Business</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((u) => {
                  const businessName = u.grower?.businessName || u.dispensary?.businessName || '-';
                  return (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={'inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ' + (
                          u.role === 'ADMIN' ? 'bg-gray-100 text-gray-800' :
                          u.role === 'GROWER' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        )}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{businessName}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(u.createdAt).toLocaleDateString()}
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
