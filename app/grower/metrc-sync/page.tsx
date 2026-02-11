import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function GrowerMetrcSyncPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const syncStatus = {
    lastSync: null,
    nextSync: null,
    status: 'not_configured',
    pendingItems: 0,
    errorCount: 0,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">METRC Sync Status</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Connection Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Connection Status</h2>
          
          <div className="space-y-4">
            <div className={`flex items-center p-4 rounded-lg ${syncStatus.status === 'connected' ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className={`w-3 h-3 rounded-full ${syncStatus.status === 'connected' ? 'bg-green-500' : 'bg-red-500'} mr-3`}></div>
              <div>
                <p className="font-medium text-gray-900">
                  {syncStatus.status === 'connected' ? 'Connected to METRC' : 'Not Connected'}
                </p>
                <p className="text-sm text-gray-500">
                  {syncStatus.status === 'connected' 
                    ? 'Products will sync automatically' 
                    : 'Configure API credentials to enable sync'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">METRC API Credentials</label>
              
              {syncStatus.status === 'connected' ? (
                <div className="flex gap-2">
                  <div className="flex-1 bg-gray-100 px-4 py-2 rounded-lg">
                    <span className="text-sm text-gray-600">API Key: ••••••••••••••••</span>
                  </div>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    Reconnect
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <input 
                    type="text" 
                    placeholder="API User Key" 
                    className="w-full rounded-lg border border-gray-300 px-4 py-2"
                  />
                  <input 
                    type="text" 
                    placeholder="API Passphrase" 
                    className="w-full rounded-lg border border-gray-300 px-4 py-2"
                  />
                  <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                    Connect to METRC
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sync Statistics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Sync Statistics</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Last Sync</p>
              <p className="text-lg font-bold text-gray-900">
                {syncStatus.lastSync ? new Date(syncStatus.lastSync).toLocaleString() : 'Never'}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Next Sync</p>
              <p className="text-lg font-bold text-gray-900">
                {syncStatus.nextSync ? new Date(syncStatus.nextSync).toLocaleString() : 'Scheduled'}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Pending Items</p>
              <p className="text-lg font-bold text-gray-900">{syncStatus.pendingItems}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Errors (24h)</p>
              <p className="text-lg font-bold text-red-600">{syncStatus.errorCount}</p>
            </div>
          </div>

          {syncStatus.pendingItems > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                {syncStatus.pendingItems} items waiting for sync. Run manual sync to update METRC.
              </p>
              <button className="mt-2 text-sm text-yellow-700 hover:text-yellow-900 font-medium">
                Run Manual Sync
              </button>
            </div>
          )}

          {syncStatus.errorCount > 0 && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-800 mb-2">
                {syncStatus.errorCount} sync errors in the last 24 hours. Check error logs.
              </p>
              <button className="text-sm text-red-700 hover:text-red-900 font-medium">
                View Error Logs
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sync Schedule */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Sync Schedule</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Automatic Sync</p>
              <p className="text-sm text-gray-500">Sync your products to METRC automatically</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked={syncStatus.status === 'connected'} />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Sync Frequency</p>
              <p className="text-sm text-gray-500">How often to sync products</p>
            </div>
            <select className="rounded-lg border border-gray-300 px-4 py-2">
              <option>Every 15 minutes</option>
              <option>Every 30 minutes</option>
              <option>Every hour</option>
              <option>Every 4 hours</option>
              <option>Every 12 hours</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Last Sync Time</p>
              <p className="text-sm text-gray-500">When products were last synced</p>
            </div>
            <span className="text-sm text-gray-900">
              {syncStatus.lastSync ? new Date(syncStatus.lastSync).toLocaleString() : 'Never'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
