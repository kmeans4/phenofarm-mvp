import Link from "next/link";
import { getServerSession } from "next-auth";
import { authConfig } from "@/auth.config";

export default async function Header() {
  const session = await getServerSession(authConfig);

  return (
    <header className="border-b border-gray-200 bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-green-700">
          PhenoFarm
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/" className="text-gray-700 hover:text-green-700">
            Home
          </Link>
          <Link href="/catalog" className="text-gray-700 hover:text-green-700">
            Catalog
          </Link>
          <Link href="/growers" className="text-gray-700 hover:text-green-700">
            Growers
          </Link>
          {session ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {session.user?.email}
              </span>
              <Link
                href="/dashboard"
                className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Dashboard
              </Link>
              <form action="/api/auth/signout" method="post">
                <button
                  type="submit"
                  className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Sign Out
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
