import { getAuthSession } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { SettingsForm } from "./components/SettingsForm";
import { PageHeader } from "@/app/components/ui/PageHeader";

export default async function DispensarySettingsPage() {
  const session = await getAuthSession();
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  return (
    <div className="space-y-5 sm:space-y-6 pb-20 sm:pb-24">
      <PageHeader title="Settings" description="Manage your account and preferences" />
      
      <div className="mt-5 sm:mt-6">
        <SettingsForm defaultValues={{
          businessName: '',
          licenseNumber: '',
          licenseExpiry: '',
          licenseState: 'VT',
          contactName: '',
          email: '',
          phone: '',
          address: '',
          city: '',
          state: 'VT',
          zip: '',
          website: '',
          description: '',
          logo: '',
          licenseStatus: 'pending_review',
          licenseReviewNotes: '',
        }} />
      </div>
    </div>
  );
}
