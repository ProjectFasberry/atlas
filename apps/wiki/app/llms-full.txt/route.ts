import { llms } from 'fumadocs-core/source';
import { listLocalizedPages } from '@/lib/content/pages';
import { source } from '@/lib/content/source';
import { getLocale } from '@/lib/i18n/locale';

export const dynamic = 'force-dynamic';

export async function GET() {
  const locale = await getLocale();
  const localized = new Map((await listLocalizedPages(locale)).map((page) => [page.slug, page]));

  const body = await llms(() => source.get(), {
    renderPage: async (page) => {
      const translated = localized.get(page.slugs.join('/'));
      return `# ${translated?.title ?? page.data.title} (${page.url})\n\n${translated?.markdown ?? ''}`;
    },
  }).full();

  return new Response(`${body}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
