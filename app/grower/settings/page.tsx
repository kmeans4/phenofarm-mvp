import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Grower Settings</h1>
      </div>
      
      {/* Stripe Connect Section */}
      <StripeConnect />
      
      <div className="mt-8">
        <SettingsForm />
      </div>
    </div>
  );
}
