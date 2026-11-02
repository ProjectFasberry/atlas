import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getEditor } from '@/lib/auth';
import { database } from '@/lib/db';
import { wikiImages } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

const MAX_SIZE = 8 * 1024 * 1024;
/** The file plus multipart boundaries and headers. */
const MAX_BODY = MAX_SIZE + 128 * 1024;

const EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

type LimitedBody = { ok: true; body: Uint8Array } | { ok: false; error: 'no-body' | 'too-large' };

/**
 * Reads the request body with a hard cap before the multipart parser allocates
 * the whole payload. `content-length` is only a fast path: a chunked request
 * without it is stopped while reading.
 */
async function readLimited(request: Request, limit: number): Promise<LimitedBody> {
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > limit) return { ok: false, error: 'too-large' };

  const reader = request.body?.getReader();
  if (!reader) return { ok: false, error: 'no-body' };

  const chunks: Uint8Array[] = [];
  let total = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    total += value.byteLength;
    if (total > limit) {
      await reader.cancel();
      return { ok: false, error: 'too-large' };
    }
    chunks.push(value);
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return { ok: true, body };
}

export async function POST(request: Request) {
  const editor = await getEditor();
  if (!editor) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const limited = await readLimited(request, MAX_BODY);
  if (!limited.ok) {
    return NextResponse.json(
      { error: limited.error },
      { status: limited.error === 'too-large' ? 413 : 400 },
    );
  }

  const contentType = request.headers.get('content-type');
  const form = await new Response(limited.body.buffer as ArrayBuffer, {
    headers: contentType ? { 'content-type': contentType } : undefined,
  })
    .formData()
    .catch(() => null);

  const file = form?.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }

  const ext = EXTENSIONS[file.type];
  if (!ext) {
    return NextResponse.json({ error: 'unsupported type' }, { status: 415 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'too large' }, { status: 413 });
  }

  const id = `${randomUUID()}.${ext}`;
  const data = Buffer.from(await file.arrayBuffer());

  const db = await database();
  await db.insert(wikiImages).values({ id, mime: file.type, data });

  return NextResponse.json({ url: `/api/images/${id}` });
}
