import { NextResponse, type NextRequest } from 'next/server';

/** Carry the requested page through server-rendered sign-in and policy gates.
 * Authentication and authorization remain in the pages and API handlers. */
export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const query = new URLSearchParams(request.nextUrl.searchParams);
  query.delete('_rsc');
  const suffix = query.toString();
  requestHeaders.set(
    'x-phenoshop-page',
    request.nextUrl.pathname + (suffix ? `?${suffix}` : '')
  );
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    '/grower/:path*',
    '/dispensary/:path*',
    '/admin/:path*',
    '/dashboard',
    '/account/:path*',
    '/messages',
    '/auth/change-email',
  ],
};
