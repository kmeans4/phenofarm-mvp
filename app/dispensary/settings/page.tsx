import { getDispensarySettings } from '@/lib/dispensary-settings';
import { getAuthSession } from "@/lib/auth-helpers";
import { redirect, notFound } from "next/navigation";
import { SettingsForm } from "./components/SettingsForm";
import { PageHeader } from "@/app/components/ui/PageHeader";

export default async function DispensarySettingsPage() {
  const session = await getAuthSession();
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  if (session.user.role !== 'DISPENSARY' || !session.user.dispensaryId) redirect('/dashboard');
  const settings = await getDispensarySettings(session.user.dispensaryId);
  if (!settings) notFound();

  return (
    <div className="space-y-5 sm:space-y-6 pb-20 sm:pb-24">
      <PageHeader title="Settings" description="Manage your account and preferences" />
      
      <div className="mt-5 sm:mt-6">
        <SettingsForm initialSettings={settings} />
      </div>
    </div>
  );
}
