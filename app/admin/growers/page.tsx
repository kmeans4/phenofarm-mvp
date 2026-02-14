interface GrowerWithUser {
  id: string;
  businessName: string;
  licenseNumber: string | null;
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
  
  if (!session?.user) {
    redirect('/auth/sign_in');
  }

  const userRole = (session.user as { role: string }).role;
  
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
          <div className="p-8 text-center text-gray-500">
            No growers found or database error
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Business</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">License</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {growers.map((g) => (
                <tr key={g.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">{g.businessName}</td>
                  <td className="px-4 py-3 text-gray-600">{g.user?.email || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{g.licenseNumber || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(g.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
