import { NextResponse } from 'next/server';
import { listLocalizedPages, pagePlainText, pageUrl } from '@/lib/content/pages';
import { getLocale } from '@/lib/i18n/locale';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const query = (new URL(request.url).searchParams.get('query') || '').trim().toLowerCase();
  if (!query) return NextResponse.json([]);

  const terms = query.split(/\s+/).filter(Boolean);

  // the index follows the reading locale: titles and text come from the translation
  // the page itself would show, so search never mixes languages in one locale
  const pages = await listLocalizedPages(await getLocale());

  const results = pages
    .map((page) => {
      const title = page.title.toLowerCase();
      const description = page.description.toLowerCase();
      const text = pagePlainText(page).toLowerCase();
      const haystack = `${title} ${description} ${text}`;

      if (!terms.every((term) => haystack.includes(term))) return null;

      const rank = title.includes(query) ? 0 : description.includes(query) ? 1 : 2;

      return {
        rank,
        result: {
          id: pageUrl(page.slug),
          url: pageUrl(page.slug),
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
