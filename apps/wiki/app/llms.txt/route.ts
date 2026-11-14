import { llms } from 'fumadocs-core/source';
import { DEFAULT_SERVER } from '@/lib/content/servers';
import { getSource } from '@/lib/content/source';

export const dynamic = 'force-dynamic';

export async function GET() {
  const body = await llms(() => getSource(DEFAULT_SERVER).get()).index();

  return new Response(`${body}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
