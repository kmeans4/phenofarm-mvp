'use client';

import { BrandLogo } from '@/app/components/ui/BrandLogo';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, m as motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { label: 'App preview', href: '#product' },
  { label: 'Features', href: '#workflow' },
  { label: 'Get started', href: '#getting-started' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Help', href: '/help' },
];

export function Nav({ signedIn = false }: { signedIn?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Highlight the section currently in view
  useEffect(() => {
    const ids = NAV_LINKS.map((l) => l.href.slice(1));
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(`#${entry.target.id}`);
        }
      },
      { rootMargin: '-30% 0px -60% 0px' }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  // Lock body scroll while the mobile menu is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled || open
          ? 'border-b border-white/[0.06] bg-[#070908]/85 backdrop-blur-xl'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="flex min-h-11 shrink-0 items-center gap-2.5"
          onClick={() => setOpen(false)}
        >
          <BrandLogo className="w-24 min-[380px]:w-32 sm:w-40" />
        </Link>

        <div className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`relative inline-flex min-h-11 items-center text-sm transition-colors hover:text-white ${
                active === item.href ? 'text-white' : 'text-gray-400'
              }`}
            >
              {item.label}
              {active === item.href && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute -bottom-1.5 left-0 right-0 h-px bg-emerald-400"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                />
              )}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {!signedIn && (
            <Link
              href="/auth/sign_in"
              className="inline-flex min-h-11 items-center whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:text-white sm:px-4"
            >
              Sign in
            </Link>
          )}
          <Link
            href={signedIn ? '/dashboard' : '/auth/sign_up'}
            className="inline-flex min-h-11 items-center whitespace-nowrap rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-950 transition-colors hover:bg-gray-200 sm:px-4"
          >
            {signedIn ? (
              'Open dashboard'
            ) : (
              <>
                <span className="sm:hidden">Sign up</span>
                <span className="hidden sm:inline">Create account</span>
              </>
            )}
          </Link>
          <button
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="ml-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-gray-300 transition-colors hover:text-white lg:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden border-t border-white/[0.06] lg:hidden"
          >
            <div className="space-y-1 px-6 py-4">
              {NAV_LINKS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center rounded-lg px-3 py-2.5 text-[15px] text-gray-300 transition-colors hover:bg-white/[0.04] hover:text-white"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
