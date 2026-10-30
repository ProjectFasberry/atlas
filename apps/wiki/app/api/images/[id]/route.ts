import { eq } from 'drizzle-orm';
import { database } from '@/lib/db';
import { wikiImages } from '@/lib/schema';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await database();
  const [row] = await db
    .select({ mime: wikiImages.mime, data: wikiImages.data })
    .from(wikiImages)
    .where(eq(wikiImages.id, id))
    .limit(1);

  if (!row) {
    return new Response('Not found', { status: 404 });
  }

  const bytes = new Uint8Array(row.data);

  return new Response(bytes.buffer as ArrayBuffer, {
    headers: {
      'Content-Type': row.mime,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
