import { NextResponse } from 'next/server';
import { listLocalizedPages, pagePlainText, pageUrl } from '@/lib/content/pages';
import { getServers, resolveRoute } from '@/lib/content/servers';
import { getLocale } from '@/lib/i18n/locale';

export const dynamic = 'force-dynamic';

/**
 * The search dialog asks from the current page, so the server comes from the
 * referer: `/muffin/armor` searches muffin, everything else searches the default.
 */
async function currentServer(request: Request) {
  const referer = request.headers.get('referer');
  if (!referer) return resolveRoute([], []);

  try {
    const segments = new URL(referer).pathname.split('/').filter(Boolean).map(decodeURIComponent);
    return resolveRoute(segments, await getServers());
  } catch {
    return resolveRoute([], []);
  }
}

export async function GET(request: Request) {
  const query = (new URL(request.url).searchParams.get('query') || '').trim().toLowerCase();
  if (!query) return NextResponse.json([]);

  const terms = query.split(/\s+/).filter(Boolean);
  const { server } = await currentServer(request);

  // the index follows the reading locale: titles and text come from the translation
  // the page itself would show, so search never mixes languages in one locale
  const pages = await listLocalizedPages(server, await getLocale());

  const results = pages
    .map((page) => {
      const title = page.title.toLowerCase();
      const description = page.description.toLowerCase();
      const text = pagePlainText(page).toLowerCase();
      const haystack = `${title} ${description} ${text}`;

      if (!terms.every((term) => haystack.includes(term))) return null;

      const rank = title.includes(query) ? 0 : description.includes(query) ? 1 : 2;
      const url = pageUrl(server, page.slug);

      return {
        rank,
        result: {
          id: url,
          url,
          type: 'page' as const,
          content: page.title,
        },
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => a.rank - b.rank || a.result.content.localeCompare(b.result.content))
    .slice(0, 20)
    .map((item) => item.result);

  return NextResponse.json(results);
}
