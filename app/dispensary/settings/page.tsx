import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SettingsForm } from "./components/SettingsForm";

export default async function DispensarySettingsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dispensary Settings</h1>
      </div>
      
      <div className="mt-8">
        <SettingsForm defaultValues={{
          businessName: '',
          licenseNumber: '',
          email: '',
          phone: '',
          address: '',
          city: '',
          state: 'VT',
          zip: '',
          website: '',
          description: '',
        }} />
      </div>
    </div>
  );
}
