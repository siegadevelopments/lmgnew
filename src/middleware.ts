import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host');
  
  // If the request is coming from the Vercel default domain
  if (host === 'lmgnew.vercel.app') {
    const url = request.nextUrl.clone();
    url.host = 'lifestylemedicinegateway.com';
    url.protocol = 'https';
    
    // Perform a permanent redirect to the custom domain
    return NextResponse.redirect(url, 301);
  }
  
  return NextResponse.next();
}

// Only run on page routes, not assets/api
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
