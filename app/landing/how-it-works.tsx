'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { Package, ShoppingCart, Truck, ClipboardList, Store, DollarSign } from 'lucide-react';

const growerSteps = [
  {
    number: 1,
    title: 'List Products',
    description: 'Upload your inventory with detailed product information, strains, and pricing.',
    icon: Package,
  },
  {
    number: 2,
    title: 'Receive Orders',
    description: 'Get orders from verified dispensaries looking for quality products.',
    icon: ShoppingCart,
  },
  {
    number: 3,
    title: 'Process & Ship',
    description: 'Manage your warehouse and shipping through our integrated system.',
    icon: Truck,
  },
  {
    number: 4,
    title: 'Get Paid',
    description: 'Receive secure payments directly to your account. No delays.',
    icon: DollarSign,
  },
];

const dispensarySteps = [
  {
    number: 1,
    title: 'Browse Catalog',
    description: 'Explore products from multiple verified growers in one place.',
    icon: Store,
  },
  {
    number: 2,
    title: 'Place Orders',
    description: 'Order with flexible quantities. Track order status in real-time.',
    icon: ShoppingCart,
  },
  {
    number: 3,
    title: 'Manage Inventory',
    description: 'Keep track of wholesale purchases and sales data effortlessly.',
    icon: ClipboardList,
  },
  {
    number: 4,
    title: 'Grow Business',
    description: 'Scale your dispensary with better sourcing and analytics.',
    icon: TrendingUp,
  },
];

function TrendingUp(props: React.ComponentProps<'svg'>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-3 3" />
    </svg>
  );
}

export function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const [activeTab, setActiveTab] = useState<'grower' | 'dispensary'>('grower');

  const steps = activeTab === 'grower' ? growerSteps : dispensarySteps;

  return (
    <section 
      id="how-it-works" 
      ref={ref} 
      className="py-24 md:py-32 bg-gray-950 relative min-h-[700px]"
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
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            How It Works
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
            Simple steps to wholesale success. Whether you&apos;re growing or selling, we&apos;ve got you covered.
          </p>

          {/* Tab Toggle */}
          <div className="inline-flex items-center p-1 bg-gray-800 rounded-xl">
            <button
              onClick={() => setActiveTab('grower')}
              className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'grower'
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              For Growers
            </button>
            <button
              onClick={() => setActiveTab('dispensary')}
              className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'dispensary'
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              For Dispensaries
            </button>
          </div>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gray-800 -translate-y-1/2 z-0">
            <motion.div
              layout="position"
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 to-emerald-500"
              initial={{ width: '0%' }}
              animate={isInView ? { width: '100%' } : {}}
              transition={{ duration: 1.5, delay: 0.5 }}
            />
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                layout="position"
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.15 }}
                className="relative z-10"
                style={{ willChange: 'transform, opacity' }}
              >
                {/* Step Number */}
                <div className="flex md:block justify-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-gray-900 border-4 border-green-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                    <span className="text-xl font-bold text-white">{step.number}</span>
                  </div>
                </div>

                {/* Step Card */}
                <div className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                    <step.icon className="w-6 h-6 text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
