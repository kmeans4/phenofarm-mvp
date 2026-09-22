import { PageHeader } from "@/app/components/ui/PageHeader";
import { PricingPlans } from "./PricingPlans";

export default function GrowerPricing() {
  return <div className="space-y-4">
    <PageHeader title="Plans" description="Software plans. Wholesale payments stay direct." />
    <PricingPlans />
  </div>;
}
