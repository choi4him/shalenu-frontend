import { NextRequest, NextResponse } from 'next/server';

const LOCALES = ['ko', 'en'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Already has locale prefix — pass through
  const hasLocale = LOCALES.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );
  if (hasLocale) return;

  // Detect preferred language from Accept-Language header
  const acceptLang = request.headers.get('accept-language') ?? '';
  const locale = acceptLang.toLowerCase().includes('ko') ? 'ko' : 'en';

  // Redirect: / → /{locale}/dashboard, others → /{locale}{path}
  const url = request.nextUrl.clone();
  url.pathname = pathname === '/' ? `/${locale}/dashboard` : `/${locale}${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next|api|favicon\\.ico|images|fonts|.*\\.).*)'],
};
