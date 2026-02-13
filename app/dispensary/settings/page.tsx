import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export default async function DispensarySettingsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = session.user as any;
  
  if (user.role !== 'DISPENSARY') {
    redirect('/dashboard');
  }

  // Fetch dispensary data
  const dispensary = await db.dispensary.findUnique({
    where: { id: user.dispensaryId },
    include: { user: { select: { email: true } } }
  });

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-3xl font-bold text-gray-900">Dispensary Settings</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Business Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold">Business Information</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                <input 
                  type="text" 
                  defaultValue={dispensary?.businessName || ''}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dispensary License Number</label>
                <input 
                  type="text" 
                  defaultValue={dispensary?.licenseNumber || ''}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Email</label>
                <input 
                  type="email" 
                  defaultValue={dispensary?.user?.email || ''}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Phone</label>
                <input 
                  type="tel" 
                  defaultValue={dispensary?.phone || ''}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Address</label>
                <input 
                  type="text" 
                  defaultValue={dispensary?.address || ''}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input 
                    type="text" 
                    defaultValue={dispensary?.city || ''}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input 
                    type="text" 
                    defaultValue={dispensary?.state || 'VT'}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                  <input 
                    type="text" 
                    defaultValue={dispensary?.zip || ''}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input 
                  type="url" 
                  defaultValue={dispensary?.website || ''}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Description</label>
                <textarea 
                  rows={3}
                  defaultValue={dispensary?.description || ''}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:ring-green-500"
                />
              </div>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">Business Hours</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Open Time</label>
                  <input 
                    type="time" 
                    defaultValue="08:00"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Close Time</label>
                  <input 
                    type="time" 
                    defaultValue="18:00"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Banking & Payment Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold">Banking Information</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Bank Name</label>
                <input 
                  type="text" 
                  placeholder="Bank name"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label>
                <input 
                  type="text" 
                  placeholder="Account holder name"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Routing Number</label>
                  <input 
                    type="text" 
                    placeholder="Routing #"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                  <input 
                    type="text" 
                    placeholder="Account #"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>Security Note:</strong> Your banking information is encrypted and never shared with third parties.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden md:col-span-2">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold">Notifications</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-gray-900">Order Status Updates</p>
                <p className="text-sm text-gray-500">Email when order status changes</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-gray-900">Payment Notifications</p>
                <p className="text-sm text-gray-500">Email when payments are processed</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-gray-900">New Product Alerts</p>
                <p className="text-sm text-gray-500">Email when growers add new products</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-gray-900">Marketing Emails</p>
                <p className="text-sm text-gray-500">Receive updates and promotions from PhenoFarm</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <button className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium">
          Save Changes
        </button>
      </div>
    </div>
  );
}
