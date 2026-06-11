import Link from 'next/link';

export default function CookiesPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16 text-gray-900">
      <div className="mx-auto max-w-3xl rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-700">Legal</p>
        <h1 className="mt-2 text-3xl font-bold">Cookie Notice</h1>
        <p className="mt-4 text-gray-600">
          PhenoFarm uses essential cookies for authentication, session security, and core marketplace operation.
        </p>
        <p className="mt-4 text-gray-600">
          For questions about cookies or browser storage, contact support@phenofarm.com.
        </p>
        <Link href="/" className="mt-6 inline-flex rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Back to home
        </Link>
      </div>
    </main>
  );
}
