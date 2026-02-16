'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { DollarSign, Lock, Globe, CheckCircle2 } from 'lucide-react';

const problems = [
  {
    icon: DollarSign,
    title: 'Exorbitant Fees',
    description: 'Traditional platforms charge 60% markup. APEX Trading costs $600/month for basic features.',
    color: 'red',
  },
  {
    icon: Globe,
    title: 'Limited Access',
    description: 'Regional restrictions lock you out of national growers. Missing out on better prices.',
    color: 'red',
  },
  {
    icon: Lock,
    title: 'Walled Gardens',
    description: 'No transparency on pricing or quality. Hard to verify partners and build trust.',
    color: 'red',
  },
];

const solutions = [
  {
    icon: CheckCircle2,
    title: 'Save 60%',
    description: 'Only $249/month for the same powerful tools. That\'s less than half of APEX.',
    color: 'green',
  },
  {
    icon: Globe,
    title: 'Open Marketplace',
    description: 'Access verified growers and dispensaries nationwide. Complete transparency on pricing.',
    color: 'green',
  },
  {
    icon: CheckCircle2,
    title: 'Direct Relationships',
    description: 'Build direct partnerships with verified partners. No middleman, no hidden fees.',
    color: 'green',
  },
];

export function ProblemSolution() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section 
      ref={ref} 
      className="py-24 md:py-32 bg-gray-950 relative overflow-hidden min-h-[900px]"
      style={{ contentVisibility: 'auto', contain: 'layout style paint' }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,1),transparent_70%)]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Problems */}
        <motion.div
          layout="position"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-8 bg-red-500 rounded-full" />
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">The Problem</h2>
          </div>
          <p className="text-gray-300 text-lg max-w-2xl">
            Traditional cannabis wholesale is broken. You&apos;re paying too much for too little.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {problems.map((problem, index) => (
            <motion.div
              key={problem.title}
              layout="position"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
              className="group p-8 rounded-2xl bg-gray-900/50 border border-red-500/20 hover:border-red-500/40 transition-all"
              style={{ willChange: 'transform, opacity' }}
            >
              <div className="w-14 h-14 rounded-xl bg-red-500/10 flex items-center justify-center mb-5 group-hover:bg-red-500/20 transition-colors">
                <problem.icon className="w-7 h-7 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{problem.title}</h3>
              <p className="text-gray-300 leading-relaxed">{problem.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Transform Arrow */}
        <motion.div 
          layout="position"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex justify-center my-16"
        >
          <div className="flex items-center gap-4">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-green-500" />
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-green-500" />
          </div>
        </motion.div>

        {/* Solutions */}
        <motion.div
          layout="position"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-8 bg-green-500 rounded-full" />
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">The Solution: PhenoFarm</h2>
          </div>
          <p className="text-gray-300 text-lg max-w-2xl">
            A modern marketplace built for today&apos;s cannabis industry. Affordable, transparent, connected.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {solutions.map((solution, index) => (
            <motion.div
              key={solution.title}
              layout="position"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
              className="group p-8 rounded-2xl bg-green-950/30 border border-green-500/20 hover:border-green-500/50 transition-all relative overflow-hidden"
              style={{ willChange: 'transform, opacity' }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl bg-green-500/10 flex items-center justify-center mb-5 group-hover:bg-green-500/20 transition-colors">
                  <solution.icon className="w-7 h-7 text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{solution.title}</h3>
                <p className="text-gray-300 leading-relaxed">{solution.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
