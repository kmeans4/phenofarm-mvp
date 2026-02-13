import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export default async function GrowerCustomersPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session.user as any;
  
  // Fetch all dispensaries (customers)
  const customers = await db.dispensary.findMany({
    include: {
      user: {
        select: { email: true, name: true },
      },
    },
    orderBy: {
      businessName: 'asc',
    },
  });

  const customerCount = customers.length;

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-1">Manage your dispensary customers</p>
        </div>
        <Link href="/grower/customers/add" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
          + Add Customer
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Total Customers</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{customerCount}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Active</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{customerCount}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Orders</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Customer List</h2>
        </div>
        {customers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No customers yet.</p>
            <Link href="/grower/customers/add" className="text-green-600 hover:underline mt-2 inline-block">Add your first customer</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Business</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{customer.businessName}</div>
                      {customer.licenseNumber && <div className="text-xs text-gray-500">License: {customer.licenseNumber}</div>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{customer.user?.name || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{customer.user?.email || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{customer.phone || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{customer.city}, {customer.state}</td>
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
