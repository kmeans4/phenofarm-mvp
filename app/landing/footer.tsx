'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Twitter, Linkedin, Instagram, Mail } from 'lucide-react';

const footerLinks = {
  growers: [
    { label: 'Sell Your Products', href: '/auth/sign_up' },
    { label: 'Grower Dashboard', href: '/grower/dashboard' },
    { label: 'Pricing', href: '#pricing' },
  ],
  dispensaries: [
    { label: 'Browse Products', href: '/dispensary/marketplace' },
    { label: 'Dispensary Dashboard', href: '/dispensary/dashboard' },
    { label: 'Pricing', href: '#pricing' },
  ],
  company: [
    { label: 'Contact', href: 'mailto:support@phenofarm.com' },
    { label: 'Help Center', href: '#' },
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
  ],
};

const socialLinks = [
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Mail, href: 'mailto:support@phenofarm.com', label: 'Email' },
];

export function Footer() {
  return (
    <footer className="bg-gray-950 border-t border-gray-900">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-5 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">PF</span>
              </div>
              <span className="text-xl font-bold text-white">PhenoFarm</span>
            </div>
            <p className="text-gray-400 text-sm mb-6 max-w-xs">
              The affordable B2B marketplace connecting cannabis growers and dispensaries. Save 60% on platform costs.
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 rounded-lg bg-gray-900 hover:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-green-400 transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* For Growers */}
          <div>
            <h3 className="text-white font-semibold mb-4">For Growers</h3>
            <ul className="space-y-3">
              {footerLinks.growers.map((link) => (
                <li key={link.label}>
                  <Link 
                    href={link.href}
                    className="text-gray-400 hover:text-green-400 text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Dispensaries */}
          <div>
            <h3 className="text-white font-semibold mb-4">For Dispensaries</h3>
            <ul className="space-y-3">
              {footerLinks.dispensaries.map((link) => (
                <li key={link.label}>
                  <Link 
                    href={link.href}
                    className="text-gray-400 hover:text-green-400 text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link 
                    href={link.href}
                    className="text-gray-400 hover:text-green-400 text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} PhenoFarm. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm">
            <Link href="#" className="text-gray-500 hover:text-gray-400 transition-colors">
              Privacy
            </Link>
            <Link href="#" className="text-gray-500 hover:text-gray-400 transition-colors">
              Terms
            </Link>
            <Link href="#" className="text-gray-500 hover:text-gray-400 transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
