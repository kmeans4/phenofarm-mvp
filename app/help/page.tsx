import Link from 'next/link';

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16 text-gray-900">
      <div className="mx-auto max-w-3xl rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-700">Help Center</p>
        <h1 className="mt-2 text-3xl font-bold">PhenoFarm support</h1>
        <p className="mt-4 text-gray-600">
          For account access, marketplace questions, billing help, or order workflow support, contact the PhenoFarm team.
        </p>
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-medium text-green-900">Support email</p>
          <a href="mailto:support@phenofarm.com" className="mt-1 inline-flex text-green-700 hover:text-green-800">
            support@phenofarm.com
          </a>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/auth/sign_in" className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
            Sign in
          </Link>
          <Link href="/" className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
