import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16 text-gray-900">
      <div className="mx-auto max-w-3xl rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-700">Legal</p>
        <h1 className="mt-2 text-3xl font-bold">Terms of Service</h1>
        <p className="mt-4 text-gray-600">
          PhenoFarm is intended for registered cannabis growers, dispensaries, and platform administrators using the marketplace for business workflows.
        </p>
        <p className="mt-4 text-gray-600">
          Users are responsible for accurate company, license, order, subscription, and direct-settlement information. PhenoFarm does not process wholesale payments between businesses. For terms questions, contact support@phenofarm.com.
        </p>
        <Link href="/" className="mt-6 inline-flex rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Back to home
        </Link>
      </div>
    </main>
  );
}
