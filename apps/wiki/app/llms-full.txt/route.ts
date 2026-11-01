import { llms } from 'fumadocs-core/source';
import { getPageMarkdown } from '@/lib/content/pages';
import { source } from '@/lib/content/source';

export const dynamic = 'force-dynamic';

export async function GET() {
  const body = await llms(() => source.get(), {
    renderPage: async (page) => {
      const markdown = await getPageMarkdown(page.slugs);
      return `# ${page.data.title} (${page.url})\n\n${markdown ?? ''}`;
    },
  }).full();

  return new Response(`${body}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
