import Link from 'next/link';
import { getAuthSession } from '@/lib/auth-helpers';
import { ContactForm } from './ContactForm';
export const metadata = { title: 'Contact | PhenoShop' };
export default async function ContactPage() {
  const session = await getAuthSession();
  return (
    <main className="mx-auto min-h-dvh max-w-xl space-y-5 px-4 py-8 text-pf-text">
      <Link
        className="inline-flex min-h-11 items-center text-sm text-pf-accent"
        href={session ? '/dashboard' : '/'}
      >
        ← {session ? 'Dashboard' : 'Home'}
      </Link>
      <h1 className="text-3xl font-semibold">Contact support</h1>
      <ContactForm
        name={session?.user.name || ''}
        email={session?.user.email || ''}
      />
      <a
        className="inline-flex min-h-11 items-center text-sm text-pf-accent"
        href="mailto:support@phenoshop.app"
      >
        support@phenoshop.app
      </a>
    </main>
  );
}
