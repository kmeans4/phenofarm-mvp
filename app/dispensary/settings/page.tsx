import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { SettingsForm } from "./components/SettingsForm";

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
  let dispensary = null;
  try {
    dispensary = await db.dispensary.findUnique({
      where: { id: user.dispensaryId || '' },
      include: { user: { select: { email: true } } }
    });
  } catch (e) {
    console.error('Failed to fetch dispensary:', e);
  }

  const defaultValues = {
    businessName: dispensary?.businessName || '',
    licenseNumber: dispensary?.licenseNumber || '',
    email: dispensary?.user?.email || user.email || '',
    phone: dispensary?.phone || '',
    address: dispensary?.address || '',
    city: dispensary?.city || '',
    state: dispensary?.state || 'VT',
    zip: dispensary?.zip || '',
    website: dispensary?.website || '',
    description: dispensary?.description || '',
  };

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-3xl font-bold text-gray-900">Dispensary Settings</h1>
      <SettingsForm defaultValues={defaultValues} />
    </div>
  );
}
