import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth';
import { redirect } from "next/navigation";
import { SettingsForm } from "./components/SettingsForm";
import { SubscriptionBilling } from "@/app/components/settings/SubscriptionBilling";
import { CommercialTermsPanel } from "@/app/components/settings/CommercialTermsPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/Card";

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
        <p className="text-sm sm:text-base text-gray-600 mt-1">Manage your account, subscription, and wholesale terms</p>
      </div>
      
      {/* Subscription Billing Section */}
      <SubscriptionBilling />

      <Card className="border-blue-200 bg-blue-50/60">
        <CardHeader>
          <CardTitle>Wholesale Settlement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-950">
          <p>
            PhenoFarm does not process payments from dispensaries to growers. Use this app to coordinate quotes,
            order requests, fulfillment, and records; settle wholesale invoices directly with each buyer.
          </p>
          <p className="font-medium">
            The only in-app payment flow for growers is the cultivator subscription paid to PhenoFarm.
          </p>
        </CardContent>
      </Card>

      <CommercialTermsPanel />
      
      {/* Settings Form */}
      <div className="mt-5 sm:mt-6">
        <SettingsForm />
      </div>
    </div>
  );
}
