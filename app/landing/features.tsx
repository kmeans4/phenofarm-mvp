'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { 
  Network, 
  BarChart3, 
  Shield, 
  Smartphone, 
  FileSpreadsheet, 
  Leaf,
  Users,
  TrendingDown
} from 'lucide-react';

const features = [
  {
    icon: Network,
    title: 'Verified Network',
    description: 'Connect with licensed, verified growers and dispensaries across the region. Every partner is vetted.',
    colSpan: 'md:col-span-2',
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Track performance with real-time insights. Make data-driven decisions.',
  },
  {
    icon: Shield,
    title: 'Bank-Level Security',
    description: 'Your account, license, marketplace, and request records are protected with enterprise-grade security.',
  },
  {
    icon: Smartphone,
    title: 'Mobile First',
    description: 'Full access on any device. Manage your business from anywhere.',
  },
  {
    icon: TrendingDown,
    title: 'Subscription-Only Billing',
    description: 'Cultivator software subscriptions are handled in PhenoFarm; wholesale settlement stays direct.',
  },
  {
    icon: FileSpreadsheet,
    title: 'CSV Import',
    description: 'Bulk upload your inventory with CSV. Get started in minutes.',
  },
  {
    icon: Users,
    title: 'Direct Relationships',
    description: 'Build lasting partnerships. No middleman, no hidden fees.',
  },
  {
    icon: Leaf,
    title: 'Metrc Integration',
    description: 'Ready for compliance. Integrate with state tracking systems.',
    colSpan: 'md:col-span-2',
  },
];

export function Features() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section 
      id="features" 
      ref={ref} 
      className="py-24 md:py-32 bg-gray-900 relative min-h-[800px] content-visibility-auto"
      style={{ contentVisibility: 'auto', contain: 'layout style paint' }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          layout="position"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
            Why PhenoFarm?
          </h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            The core tools teams need to manage catalog discovery, request workflows, direct settlement context, and marketplace records.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              layout="position"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + index * 0.05 }}
              className={`group p-8 rounded-2xl bg-gray-800/50 border border-gray-700 hover:border-green-500/30 transition-all relative overflow-hidden ${feature.colSpan || ''}`}
              style={{ willChange: 'transform, opacity' }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-7 h-7 text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-300 leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
