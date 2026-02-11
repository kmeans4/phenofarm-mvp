"use client";

import { useState } from "react";

interface PricingTier {
  id: string;
  name: string;
  price: number;
  features: string[];
  active: boolean;
}

export default function GrowerPricing() {
  const [tiers, setTiers] = useState<PricingTier[]>([
    { id: "1", name: "Basic", price: 199, active: true, features: ["100 products", "Basic analytics", "3 users"] },
    { id: "2", name: "Standard", price: 299, active: false, features: ["500 products", "Advanced analytics", "10 users", "Priority support"] },
    { id: "3", name: "Premium", price: 499, active: false, features: ["Unlimited products", "Full analytics", "Unlimited users", "24/7 support", "API access"] },
  ]);

  const toggleTier = (id: string) => {
    setTiers(tiers.map(tier => ({ ...tier, active: tier.id === id })));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Custom Pricing Tiers</h1>
        <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
          + Add New Tier
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map((tier) => (
          <div key={tier.id} className={`rounded-lg border-2 ${tier.active ? 'border-green-600 shadow-lg' : 'border-gray-200'} overflow-hidden`}>
            <div className="p-6 bg-white">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{tier.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">${tier.price}</span>
                <span className="text-gray-500">/month</span>
              </div>

              <div className="space-y-3 mb-6">
                {tier.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center">
                    <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center mr-3">
                      <svg className="h-3 w-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-600 text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => toggleTier(tier.id)}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                  tier.active
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {tier.active ? "Current Plan" : "Set as Active"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Custom Tier Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold">Create Custom Tier</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tier Name</label>
              <input type="text" className="w-full rounded-lg border border-gray-300 px-4 py-2" placeholder="e.g., Enterprise" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Price ($)</label>
              <input type="number" className="w-full rounded-lg border border-gray-300 px-4 py-2" placeholder="e.g., 999" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Features (one per line)</label>
              <textarea className="w-full rounded-lg border border-gray-300 px-4 py-2 h-32" placeholder="Enter each feature on a new line..." />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">Create Tier</button>
          </div>
        </div>
      </div>
    </div>
  );
}
