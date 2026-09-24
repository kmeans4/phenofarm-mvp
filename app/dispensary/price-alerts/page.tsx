import { redirect } from "next/navigation";

export const metadata = {
  title: "Price Alerts | PhenoShop Marketplace",
  description: "Manage your price drop alerts for cannabis products",
};

export default async function PriceAlertsPage() {
  redirect('/dispensary/saved?tab=alerts');
}
