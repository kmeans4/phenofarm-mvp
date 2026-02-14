'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Play, ChevronDown } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden flex flex-col">
      {/* Animated Mesh Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-950 via-green-900 to-emerald-950">
        <motion.div 
          className="absolute inset-0 opacity-60"
          style={{
            background: `
              radial-gradient(at 40% 20%, rgba(34, 197, 94, 0.3) 0px, transparent 50%),
              radial-gradient(at 80% 0%, rgba(16, 185, 129, 0.25) 0px, transparent 50%),
              radial-gradient(at 0% 50%, rgba(20, 184, 166, 0.2) 0px, transparent 50%),
              radial-gradient(at 80% 50%, rgba(34, 197, 94, 0.2) 0px, transparent 50%),
              radial-gradient(at 0% 100%, rgba(16, 185, 129, 0.25) 0px, transparent 50%),
              radial-gradient(at 100% 100%, rgba(34, 197, 94, 0.15) 0px, transparent 50%)
            `
          }}
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        {/* Noise overlay for texture */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1IiBoZWlnaHQ9IjUiPgo8cmVjdCB3aWR0aD0iNSIgaGVpZ2h0PSI1IiBmaWxsPSIjZmZmIi8+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMwMDAiLz4KPC9zdmc+')]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/25">
              <span className="text-white font-bold text-lg">PF</span>
            </div>
            <span className="text-xl font-bold text-white">PhenoFarm</span>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="hidden md:flex items-center gap-8"
          >
            <a href="#features" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">Features</a>
            <a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">How It Works</a>
            <a href="#pricing" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">Pricing</a>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center gap-3"
          >
            <Link href="/auth/sign_in" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">
              Sign In
            </Link>
            <Link 
              href="/auth/sign_up"
              className="px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold rounded-lg transition-all shadow-lg shadow-green-600/25 hover:shadow-green-500/40"
            >
              Get Started
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* Hero Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pt-12 pb-24">
        <motion.div 
          layout="position"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-center max-w-4xl mx-auto"
        >
          <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-[1.1] tracking-tight mb-6">
            Connect.{' '}
            <span className="bg-gradient-to-r from-green-400 via-emerald-300 to-teal-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              Grow.
            </span>{' '}
            <span className="bg-gradient-to-r from-green-400 via-emerald-300 to-teal-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              Thrive.
            </span>
          </h1>
          
          <p className="text-xl md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed mb-10">
            The affordable B2B marketplace for cannabis wholesale. Connect with verified growers and dispensaries. 
            <span className="text-green-400 font-semibold"> Save 60% compared to traditional platforms.</span>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.div
              layout="position"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link 
                href="/auth/sign_up"
                className="inline-flex items-center gap-2 px-8 py-4 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl transition-all shadow-xl shadow-green-600/25 hover:shadow-green-500/40"
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
              <a 
                href="#how-it-works"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 hover:border-white/30 text-white font-semibold rounded-xl transition-all"
              >
                <Play className="w-5 h-5" />
                Watch Demo
              </a>
            </motion.div>
          </div>
        </motion.div>

        {/* Floating Cards - with fixed dimensions to prevent layout shift */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Left Card */}
          <motion.div
            layout="position"
            initial={{ opacity: 0, y: 50, rotate: -5 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              rotate: -5,
              transition: { duration: 0.8, delay: 0.8 }
            }}
            className="absolute left-[5%] top-[20%] hidden lg:block"
            style={{ willChange: 'transform, opacity' }}
          >
            <div className="w-64 p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 shadow-2xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-green-400">🌱</span>
                </div>
                <div className="min-w-0">
                  <div className="text-white font-semibold text-sm truncate">Green Valley Farms</div>
                  <div className="text-gray-400 text-xs">Verified Grower</div>
                </div>
              </div>
              <div className="text-gray-300 text-xs">
                <span className="text-green-400 font-semibold">+47%</span> orders this month
              </div>
            </div>
          </motion.div>

          {/* Right Card */}
          <motion.div
            layout="position"
            initial={{ opacity: 0, y: 50, rotate: 5 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              rotate: 5,
              transition: { duration: 0.8, delay: 1 }
            }}
            className="absolute right-[5%] top-[25%] hidden lg:block"
            style={{ willChange: 'transform, opacity' }}
          >
            <div className="w-64 p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 shadow-2xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-emerald-400">💰</span>
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">Cost Savings</div>
                  <div className="text-gray-400 text-xs">This Month</div>
                </div>
              </div>
              <div className="text-white font-bold text-xl">$4,200</div>
              <div className="text-gray-400 text-xs">vs $10,500 on APEX</div>
            </div>
          </motion.div>

          {/* Bottom Left Card */}
          <motion.div
            layout="position"
            initial={{ opacity: 0, y: 50 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              transition: { duration: 0.8, delay: 1.2 }
            }}
            className="absolute left-[10%] bottom-[20%] hidden lg:block"
            style={{ willChange: 'transform, opacity' }}
          >
            <div className="w-56 p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 shadow-2xl">
              <div className="text-gray-400 text-xs mb-2">Active Listings</div>
              <div className="text-white font-bold text-2xl mb-1">128</div>
              <div className="flex items-center gap-1 text-green-400 text-xs">
                <span className="transform">↑</span> 12 new this week
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          layout="position"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center gap-2 text-gray-400"
          >
            <span className="text-xs uppercase tracking-widest">Scroll</span>
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
