import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { SettingsForm } from "./components/SettingsForm";
import { StripeConnect } from "./components/StripeConnect";

export default async function GrowerSettingsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Grower Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account and preferences</p>
      </div>
      
      {/* Stripe Connect Section */}
      <StripeConnect />
      
      {/* Settings Form */}
      <div className="mt-8">
        <SettingsForm />
      </div>
    </div>
  );
}
