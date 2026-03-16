import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { SettingsForm } from "./components/SettingsForm";
import { SubscriptionBilling } from "@/app/components/settings/SubscriptionBilling";

export default async function GrowerSettingsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  return (
    <div className="space-y-5 sm:space-y-6 pb-20 sm:pb-24">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Grower Settings</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Manage your account and preferences</p>
      </div>
      
      {/* Subscription Billing Section */}
      <SubscriptionBilling />
      
      {/* Settings Form */}
      <div className="mt-5 sm:mt-6">
        <SettingsForm />
      </div>
    </div>
  );
}
