'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export function CTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  return (
    <section 
      ref={ref} 
      className="relative py-24 md:py-32 overflow-hidden min-h-[500px]"
      style={{ contentVisibility: 'auto', contain: 'layout style paint' }}
    >
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-900 via-green-800 to-emerald-900">
        <motion.div 
          layout="position"
          className="absolute inset-0 opacity-40"
          style={{
            background: `
              radial-gradient(at 40% 20%, rgba(34, 197, 94, 0.4) 0px, transparent 50%),
              radial-gradient(at 80% 0%, rgba(16, 185, 129, 0.3) 0px, transparent 50%),
              radial-gradient(at 0% 50%, rgba(20, 184, 166, 0.3) 0px, transparent 50%),
              radial-gradient(at 80% 50%, rgba(34, 197, 94, 0.3) 0px, transparent 50%),
              radial-gradient(at 0% 100%, rgba(16, 185, 129, 0.3) 0px, transparent 50%)
            `
          }}
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          layout="position"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Ready to Transform Your
            <br />
            <span className="bg-gradient-to-r from-green-300 to-emerald-200 bg-clip-text text-transparent">
              Cannabis Wholesale Business?
            </span>
          </h2>
          
          <p className="text-xl text-green-100 mb-10 max-w-2xl mx-auto">
            Join 500+ businesses saving 60% on their platform costs with PhenoFarm.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <motion.div
              layout="position"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link 
                href="/auth/sign_up"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-green-900 font-semibold rounded-xl transition-all shadow-xl hover:shadow-2xl hover:shadow-white/20"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
            
            <motion.div
              layout="position"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link 
                href="/contact"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-xl transition-all"
              >
                Talk to Sales
              </Link>
            </motion.div>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-green-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-300" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-300" />
              <span>30 days free</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-300" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
