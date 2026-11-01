import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getEditor } from '@/lib/auth';
import { database } from '@/lib/db';
import { wikiImages } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

const MAX_SIZE = 8 * 1024 * 1024;

const EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export async function POST(request: Request) {
  const editor = await getEditor();
  if (!editor) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const form = await request.formData().catch(() => null);
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
  const data = new Uint8Array(await file.arrayBuffer());

  const db = await database();
  await db.insert(wikiImages).values({ id, mime: file.type, data: Buffer.from(data) });

  return NextResponse.json({ url: `/api/images/${id}` });
}
