import Link from 'next/link';

export default function Navbar({ user }: { user?: any }) {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">PF</span>
              </div>
              <span className="text-xl font-bold text-gray-900">PhenoFarm</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-sm text-gray-700">
                  {user.businessName || `${user.firstName} ${user.lastName}`}
                </span>
                <span className="text-sm px-3 py-1 bg-green-100 text-green-800 rounded-full">
                  {user.role}
                </span>
                <Link
                  href="/api/auth/signout"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Sign Out
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/auth/sign_in"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/sign_up"
                  className="text-sm font-medium text-green-600 hover:text-green-700"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
