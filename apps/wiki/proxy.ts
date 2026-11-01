import { isMarkdownPreferred, rewritePath } from 'fumadocs-core/negotiation';
import { type NextRequest, NextResponse } from 'next/server';
import { detectLocale, LOCALE_COOKIE } from '@/lib/i18n';
import { docsContentRoute } from '@/lib/shared';
import { isLocale } from '@/paraglide/runtime';

const { rewrite: rewriteMarkdown } = rewritePath(
  '{/*path}',
  `${docsContentRoute}{/*path}/content.md`,
);

// service routes, leave them alone
const INTERNAL_PREFIXES = ['/_next', '/api', '/llms', '/og'];

const YEAR = 60 * 60 * 24 * 365;

/** Remember the language for the next visit, the same cookie the server reads. */
function withLocale(request: NextRequest, response: NextResponse) {
  const current = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(current)) return response;

  response.cookies.set(LOCALE_COOKIE, detectLocale(request.headers.get('accept-language')), {
    path: '/',
    maxAge: YEAR,
    sameSite: 'lax',
  });

  return response;
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (INTERNAL_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // /boosts.md -> markdown version of the page
  if (pathname.endsWith('.md')) {
    const target = pathname.slice(0, -'.md'.length) || '/';
    const result = rewriteMarkdown(target);

    return withLocale(
      request,
      result ? NextResponse.rewrite(new URL(result, request.nextUrl)) : NextResponse.next(),
    );
  }

  // a request with Accept: text/plain returns markdown instead of HTML
  if (isMarkdownPreferred(request)) {
    const result = rewriteMarkdown(pathname);
    if (result) {
      return withLocale(
        request,
        NextResponse.rewrite(new URL(result, request.nextUrl), {
          // this URL has two representations, selected by `Accept`
          headers: { Vary: 'Accept' },
        }),
      );
    }
  }

  return withLocale(request, NextResponse.next());
}
