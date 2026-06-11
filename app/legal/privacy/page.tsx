import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16 text-gray-900">
      <div className="mx-auto max-w-3xl rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-700">Legal</p>
        <h1 className="mt-2 text-3xl font-bold">Privacy Policy</h1>
        <p className="mt-4 text-gray-600">
          PhenoFarm uses account, company, license, marketplace, order, and billing information to operate the B2B marketplace and support registered users.
        </p>
        <p className="mt-4 text-gray-600">
          Questions about data handling, account records, or privacy requests should be sent to support@phenofarm.com.
        </p>
        <Link href="/" className="mt-6 inline-flex rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Back to home
        </Link>
      </div>
    </main>
  );
}
