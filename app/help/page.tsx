import Link from 'next/link';
import { getAuthSession } from '@/lib/auth-helpers';
export const metadata = { title: 'Help | PhenoShop' };
const guides = {
  GROWER: [
    {
      title: 'List products',
      href: '/grower/products',
      body: 'Add a product with price, unit and stock. Save a draft to finish later. Price on request lets dispensaries ask for a quote.',
    },
    {
      title: 'Manage orders',
      href: '/grower/orders',
      body: 'Review new orders and move them through Accepted, Preparing, On the way and Delivered. Record phone orders or repeat a past order.',
    },
    {
      title: 'Profile, license and plans',
      href: '/grower/settings',
      body: 'Update your business profile, submit license details and set your usual order terms. A changed license pauses listings until review.',
    },
  ],
  DISPENSARY: [
    {
      title: 'Browse products',
      href: '/dispensary/catalog',
      body: 'Open a product to see photos, lab results and grower terms. Save favorites, set price alerts or ask the grower for a price.',
    },
    {
      title: 'Send an order',
      href: '/dispensary/cart',
      body: 'Review quantities, delivery address and each grower’s terms, then send. Products from different growers create separate orders. License approval is required to send.',
    },
    {
      title: 'Track or repeat orders',
      href: '/dispensary/orders',
      body: 'Follow order progress or reorder available products. Withdraw a new order, or message the grower about changes after acceptance.',
    },
  ],
};
export default async function Help() {
  const session = await getAuthSession();
  const role = session?.user.role;
  const groups =
    role === 'GROWER'
      ? [['For growers', guides.GROWER] as const]
      : role === 'DISPENSARY'
        ? [['For dispensaries', guides.DISPENSARY] as const]
        : ([
            ['For growers', guides.GROWER],
            ['For dispensaries', guides.DISPENSARY],
          ] as const);
  return (
    <main className="mx-auto min-h-dvh max-w-3xl space-y-6 px-4 py-8 text-pf-text">
      <nav className="flex justify-between">
        <Link
          className="inline-flex min-h-11 items-center text-pf-accent"
          href="/"
        >
          PhenoShop
        </Link>
        <Link
          className="inline-flex min-h-11 items-center text-pf-accent"
          href={session ? '/dashboard' : '/auth/sign_in'}
        >
          {session ? 'Dashboard' : 'Sign in'}
        </Link>
      </nav>
      <h1 className="text-3xl font-semibold">Help</h1>
      {groups.map(([heading, items]) => (
        <section key={heading}>
          <h2 className="mb-3 text-lg font-semibold">{heading}</h2>
          <div className="space-y-3">
            {items.map((item) => (
              <article
                key={item.href}
                className="rounded-xl border border-pf-line bg-pf-surface p-4"
              >
                <Link
                  className="inline-flex min-h-11 items-center font-semibold text-pf-accent"
                  href={
                    session
                      ? item.href
                      : `/auth/sign_in?callbackUrl=${encodeURIComponent(item.href)}`
                  }
                >
                  {item.title}
                </Link>
                <p className="text-sm leading-6 text-pf-secondary">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </section>
      ))}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Account access</h2>
        <details className="rounded-xl border border-pf-line p-4">
          <summary className="cursor-pointer font-medium">
            Password reset and email verification
          </summary>
          <p className="mt-2 text-sm leading-6 text-pf-secondary">
            Verification links work once and expire after 24 hours.
            Password-reset links expire after 2 hours. Resetting signs out other
            devices. Choose Change email in Settings to change your login
            address.
          </p>
          <Link
            className="inline-flex min-h-11 items-center text-sm text-pf-accent underline"
            href="/auth/forgot-password"
          >
            Reset password
          </Link>
        </details>
      </section>
      <Link
        className="inline-flex min-h-11 items-center rounded-lg bg-emerald-500 px-4 font-semibold text-pf-canvas"
        href="/contact"
      >
        Contact support
      </Link>
    </main>
  );
}
