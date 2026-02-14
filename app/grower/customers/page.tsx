import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Button } from "@/app/components/ui/Button";

export default async function GrowerCustomersPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

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
        <Button variant="primary" asChild>
          <Link href="/grower/customers/add">+ Add Customer</Link>
        </Button>
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
          <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 mx-6 mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No customers yet</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Start growing your business by adding your first dispensary customer.
            </p>
            <Button variant="primary" asChild>
              <Link href="/grower/customers/add">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add your first customer
              </Link>
            </Button>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
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
                    <td className="px-6 py-4">
                      <Link
                        href={'/grower/customers/' + customer.id + '/edit'}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        Edit
                      </Link>
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
