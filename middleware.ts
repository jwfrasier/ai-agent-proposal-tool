import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { parseBasicAuth, timingSafeEqualStr } from '@/lib/auth/basic-auth';

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Cron endpoint self-authenticates with x-cron-secret; skip Basic Auth.
  if (pathname.startsWith('/api/cron')) {
    return NextResponse.next();
  }

  const appPassword = process.env.APP_PASSWORD;

  // If APP_PASSWORD is not configured, fail closed in production.
  if (!appPassword) {
    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.next();
    }
    return new NextResponse('Authentication not configured', { status: 503 });
  }

  const credentials = parseBasicAuth(request.headers.get('Authorization'));

  if (!credentials || !timingSafeEqualStr(credentials.pass, appPassword)) {
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="govcontracts", charset="UTF-8"',
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     *   - _next/static  (Next.js static assets)
     *   - _next/image   (Next.js image optimization)
     *   - favicon.ico
     *   - Common static file extensions
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|otf|map)$).*)',
  ],
};
