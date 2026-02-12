import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/Card";
import { Button } from "@/app/components/ui/Button";

export default async function GrowerMetrcSyncPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session.user as any;
  
  if (user.role !== 'GROWER') {
    redirect('/dashboard');
  }

  // Fetch sync data from database
  const [latestSync, successSyncCount, failedSyncCount, totalSynced] = await Promise.all([
    db.metrcSyncLog.findFirst({
      where: { growerId: user.growerId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        recordsSynced: true,
        success: true,
        errorMessage: true,
        createdAt: true,
      },
    }),
    db.metrcSyncLog.count({ where: { growerId: user.growerId, success: true } }),
    db.metrcSyncLog.count({ where: { growerId: user.growerId, success: false } }),
    db.metrcSyncLog.aggregate({
      where: { growerId: user.growerId },
      _sum: {
        recordsSynced: true,
      },
    }),
  ]);

  const syncStatus = {
    lastSync: latestSync?.createdAt,
    status: latestSync ? (latestSync.success ? 'connected' : 'error') : 'not_configured',
    pendingItems: 0,
    errorCount: failedSyncCount,
    previousRecords: totalSynced || 0,
  };

  const handleManualSync = async () => {
    'use server';
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/metrc/sync`, {
        method: 'POST',
      });
      if (response.ok) {
        // Would trigger revalidation here
        console.log('Sync initiated');
      }
    } catch (error) {
      console.error('Sync error:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">METRC Sync Status</h1>
        <Button variant="primary" className="bg-green-600 hover:bg-green-700 text-white" onClick={handleManualSync}>
          Sync Now
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Connection Status */}
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Connection Status</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className={`flex items-center p-4 rounded-lg ${syncStatus.status === 'connected' ? 'bg-green-50' : syncStatus.status === 'error' ? 'bg-red-50' : 'bg-gray-50'}`}>
                <div className={`w-3 h-3 rounded-full ${syncStatus.status === 'connected' ? 'bg-green-500' : syncStatus.status === 'error' ? 'bg-red-500' : 'bg-gray-400'} mr-3`}></div>
                <div>
                  <p className="font-medium text-gray-900">
                    {syncStatus.status === 'connected' ? 'Connected to METRC' : syncStatus.status === 'error' ? 'Connection Issues' : 'Not Connected'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {syncStatus.status === 'connected' 
                      ? 'Products will sync automatically' 
                      : syncStatus.status === 'error' ? 'Check connection settings' : 'Configure API credentials to enable sync'}
                  </p>
                </div>
              </div>

              {syncStatus.status !== 'not_configured' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Last Sync</span>
                    <span className="text-sm font-medium text-gray-900">
                      {syncStatus.lastSync ? format(syncStatus.lastSync, 'MMM d, h:mm a') : 'Never'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      syncStatus.status === 'connected' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {syncStatus.status === 'connected' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sync Statistics */}
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Sync Statistics</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Last Sync</p>
                <p className="text-lg font-bold text-gray-900">
                  {syncStatus.lastSync ? format(syncStatus.lastSync, 'MMM d') : 'Never'}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Synced Items</p>
                <p className="text-lg font-bold text-gray-900">
                  {totalSynced || 0}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Pending Items</p>
                <p className="text-lg font-bold text-gray-900">{syncStatus.pendingItems}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Errors (24h)</p>
                <p className={`text-lg font-bold ${syncStatus.errorCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {syncStatus.errorCount}
                </p>
              </div>
            </div>

            {syncStatus.pendingItems > 0 && (
              <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  {syncStatus.pendingItems} items waiting for sync. Run manual sync to update METRC.
                </p>
                <Button 
                  variant="secondary" 
                  className="mt-2 text-xs"
                  onClick={handleManualSync}
                >
                  Run Manual Sync
                </Button>
              </div>
            )}

            {syncStatus.errorCount > 0 && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-800 mb-2">
                  {syncStatus.errorCount} sync errors in the last 24 hours.
                </p>
                <Button variant="secondary" className="mt-2 text-xs">
                  View Error Logs
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sync Schedule */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Sync Schedule</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Automatic Sync</p>
                <p className="text-sm text-gray-500">Sync your products to METRC automatically</p>
              </div>
              <div className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  defaultChecked={syncStatus.status === 'connected'} 
                  readOnly
                />
                <div 
                  className={`w-11 h-6 rounded-full peer ${
                    syncStatus.status === 'connected' 
                      ? 'bg-green-600 peer-focus:ring-green-300' 
                      : 'bg-gray-200 peer-focus:ring-gray-200'
                  }`}
                ></div>
                <div 
                  className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-all ${
                    syncStatus.status === 'connected' ? 'translate-x-5' : ''
                  }`}
                ></div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Sync Frequency</p>
                <p className="text-sm text-gray-500">How often to sync products</p>
              </div>
              <select className="rounded-lg border border-gray-300 px-4 py-2" disabled>
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
                {syncStatus.lastSync ? format(syncStatus.lastSync, 'MMM d, h:mm a') : 'Never'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
