import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";

interface UserWithBusiness {
  id: string;
  email: string;
  role: UserRole;
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
  
  if (!session?.user) {
    redirect('/auth/sign_in');
  }

  const userRole = (session.user as { role: string }).role;
  
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
          <div className="p-8 text-center text-gray-500">
            No users found or database error
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Business</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((u) => {
                const businessName = u.grower?.businessName || u.dispensary?.businessName || '-';
                return (
                  <tr key={u.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        u.role === 'ADMIN' ? 'bg-gray-100 text-gray-800' :
                        u.role === 'GROWER' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
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
        )}
      </div>
    </div>
  );
}
