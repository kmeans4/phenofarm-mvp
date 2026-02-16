import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import PriceAlertsContent from "./PriceAlertsContent";

export const metadata = {
  title: "Price Alerts | PhenoFarm Marketplace",
  description: "Manage your price drop alerts for cannabis products",
};

export default async function PriceAlertsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/sign_in');
  }

  const user = (session as any).user as { role: string };
  
  if (user.role !== 'DISPENSARY') {
    redirect('/dashboard');
  }

  return <PriceAlertsContent />;
}
