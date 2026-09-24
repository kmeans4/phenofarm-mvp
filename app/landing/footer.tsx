
import { BrandLogo } from '@/app/components/ui/BrandLogo';
import Link from 'next/link';

const footerLinks = {
  Growers: [
    { label: 'Sell your products', href: '/auth/sign_up' },
    { label: 'Grower dashboard', href: '/auth/sign_up' },
    { label: 'Pricing', href: '#pricing' },
  ],
  Dispensaries: [
    { label: 'Browse products', href: '/auth/sign_in' },
    { label: 'Dispensary dashboard', href: '/dispensary/dashboard' },
    { label: 'Pricing', href: '#pricing' },
  ],
  Company: [
    { label: 'Contact', href: 'mailto:support@phenoshop.app' },
    { label: 'Help center', href: '/help' },
  ],
};

export function Footer() {
  return (
    <footer className="relative border-t border-white/[0.06]">
      <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))] md:gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5">
              <BrandLogo className="w-40" />
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-gray-500">
              The B2B workspace connecting licensed cannabis growers and dispensaries for
              requests, fulfillment, and direct settlement.
            </p>
            <a
              href="mailto:support@phenoshop.app"
              className="mt-5 inline-flex min-h-10 items-center text-sm text-gray-400 transition-colors hover:text-emerald-400"
            >
              support@phenoshop.app
            </a>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <nav key={heading} aria-label={heading}>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">{heading}</h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="inline-flex min-h-10 items-center text-sm text-gray-400 transition-colors hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-white/[0.06] pt-8 sm:flex-row sm:items-center md:mt-14">
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} PhenoShop. For licensed operators only. Wholesale settlement stays
            direct between businesses.
          </p>
          <div className="flex gap-6">
            <Link href="/legal/privacy" className="inline-flex min-h-10 items-center text-xs text-gray-600 transition-colors hover:text-gray-300">
              Privacy
            </Link>
            <Link href="/legal/terms" className="inline-flex min-h-10 items-center text-xs text-gray-600 transition-colors hover:text-gray-300">
              Terms
            </Link>
            <Link href="/legal/cookies" className="inline-flex min-h-10 items-center text-xs text-gray-600 transition-colors hover:text-gray-300">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
