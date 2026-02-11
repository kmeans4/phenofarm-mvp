import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const users = [
    { 
      id: 1, 
      name: 'Admin User', 
      email: 'admin@phenofarm.com', 
      role: 'ADMIN', 
      status: 'Active',
      joined: 'Jan 1, 2024' 
    },
    {
      id: 2,
      name: 'John Green',
      email: 'grower@vtnurseries.com',
      role: 'GROWER',
      status: 'Active',
      joined: 'Jan 10, 2024'
    },
    {
      id: 3,
      name: 'Jane Dispensary',
      email: 'dispensary@greenvermont.com',
      role: 'DISPENSARY',
      status: 'Active',
      joined: 'Jan 15, 2024'
    },
    {
      id: 4,
      name: 'Pending Grower',
      email: 'pending@grower.com',
      role: 'GROWER',
      status: 'Pending Verification',
      joined: 'Feb 5, 2024'
    },
    {
      id: 5,
      name: 'Suspended User',
      email: 'suspended@user.com',
      role: 'DISPENSARY',
      status: 'Suspended',
      joined: 'Dec 1, 2023'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
          + Add User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Total Users</p>
          <p className="text-2xl font-bold text-gray-900">{users.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Verified Users</p>
          <p className="text-2xl font-bold text-green-600">
            {users.filter(u => u.status === 'Active').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Growers</p>
          <p className="text-2xl font-bold text-blue-600">
            {users.filter(u => u.role === 'GROWER').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Dispensaries</p>
          <p className="text-2xl font-bold text-purple-600">
            {users.filter(u => u.role === 'DISPENSARY').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <input 
          type="text" 
          placeholder="Search users..." 
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2"
        />
        <select className="rounded-lg border border-gray-300 px-4 py-2">
          <option>All Roles</option>
          <option>ADMIN</option>
          <option>GROWER</option>
          <option>DISPENSARY</option>
        </select>
        <select className="rounded-lg border border-gray-300 px-4 py-2">
          <option>All Status</option>
          <option>Active</option>
          <option>Pending Verification</option>
          <option>Suspended</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">All Users</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">
                        {user.name.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'ADMIN' ? 'bg-gray-100 text-gray-800' :
                      user.role === 'GROWER' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.status === 'Active' ? 'bg-green-100 text-green-800' :
                      user.status === 'Pending Verification' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.joined}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-green-600 hover:text-green-900 mr-4">Edit</button>
                    {user.status === 'Active' ? (
                      <button className="text-yellow-600 hover:text-yellow-900 mr-4">Suspend</button>
                    ) : (
                      <button className="text-green-600 hover:text-green-900 mr-4">Activate</button>
                    )}
                    <button className="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          Export CSV
        </button>
        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          Export PDF
        </button>
      </div>
    </div>
  );
}
