import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Next.js Proxy (formerly Middleware)
 *
 * Responsibilities:
 * 1. Refresh the Supabase session cookie on every request.
 * 2. Protect /(app) routes — unauthenticated users are redirected to /.
 * 3. Redirect authenticated users away from / to /chat.
 */
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        }
      }
    }
  );

  // Refresh session — IMPORTANT: do not add logic between createServerClient
  // and getUser(), as it may cause hard-to-debug auth issues.
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Removed redirect for authenticated users away from the landing page
  // so they can visit the Company (Marketing) page via the Sidebar Info link.

  // Protect all app routes — redirect unauthenticated users to /
  const publicPaths = new Set([
    '/',
    '/about',
    '/team',
    '/contact',
    '/privacy',
    '/terms'
  ]);

  const isPublicRoute =
    publicPaths.has(pathname) ||
    pathname.startsWith('/chat') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/logos') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/auth') ||
    /\.[^/]+$/.test(pathname); // static files with extensions

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
};
