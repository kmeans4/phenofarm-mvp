import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function AdminGrowersPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const pendingGrowers = [
    { id: 1, name: 'MountainTop Cannabis', email: 'applications@mountaintopcannabis.com', date: 'Feb 5, 2024' },
    { id: 2, name: 'Green Horizon Vermont', email: 'info@greenhorizonvt.com', date: 'Feb 3, 2024' },
  ];

  const verifiedGrowers = [
    { id: 3, name: 'Vermont Nurseries', email: 'contact@vtnurseries.com', verified: 'Jan 10, 2024' },
    { id: 4, name: 'Verdant Valley Growers', email: 'info@verdantvalley.com', verified: 'Jan 15, 2024' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Grower Management</h1>

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
                <div>
                  <h3 className="font-medium text-gray-900">{grower.name}</h3>
                  <p className="text-sm text-gray-500">{grower.email}</p>
                  <p className="text-xs text-gray-400 mt-1">Applied on {grower.date}</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                    Verify
                  </button>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                    Reject
                  </button>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                    Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Verified Growers */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Verified Growers</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grower</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verified</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {verifiedGrowers.map((grower) => (
                <tr key={grower.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{grower.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {grower.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {grower.verified}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-green-600 hover:text-green-900 mr-4">Edit</button>
                    <button className="text-yellow-600 hover:text-yellow-900 mr-4">Suspend</button>
                    <button className="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grower Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Total Verified Growers</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{verifiedGrowers.length + pendingGrowers.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Total Products</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">156</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Total Sales (YTD)</p>
          <p className="text-3xl font-bold text-green-600 mt-1">$124,500</p>
        </div>
      </div>
    </div>
  );
}
