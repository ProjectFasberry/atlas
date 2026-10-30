import { isMarkdownPreferred, rewritePath } from 'fumadocs-core/negotiation';
import { type NextRequest, NextResponse } from 'next/server';
import { docsContentRoute } from '@/lib/shared';

const { rewrite: rewriteMarkdown } = rewritePath(
  '{/*path}',
  `${docsContentRoute}{/*path}/content.md`,
);

// service routes, leave them alone
const INTERNAL_PREFIXES = ['/_next', '/api', '/llms', '/og'];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (INTERNAL_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // /boosts.md -> markdown version of the page
  if (pathname.endsWith('.md')) {
    const target = pathname.slice(0, -'.md'.length) || '/';
    const result = rewriteMarkdown(target);

    return result ? NextResponse.rewrite(new URL(result, request.nextUrl)) : NextResponse.next();
  }

  // a request with Accept: text/plain returns markdown instead of HTML
  if (isMarkdownPreferred(request)) {
    const result = rewriteMarkdown(pathname);
    if (result) {
      return NextResponse.rewrite(new URL(result, request.nextUrl), {
        // this URL has two representations, selected by `Accept`
        headers: { Vary: 'Accept' },
      });
    }
  }

  return NextResponse.next();
}
