import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { getEditor } from '@/lib/auth';
import { getPage, pageUrl, savePage } from '@/lib/pages';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request, { params }: { params: Promise<{ slug?: string[] }> }) {
  const editor = await getEditor();
  if (!editor) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { slug } = await params;
  const key = (slug ?? []).join('/');
  const page = await getPage(key);
  if (!page) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as {
    title?: unknown;
    description?: unknown;
    html?: unknown;
  } | null;

  if (!body || typeof body.html !== 'string') {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const description =
    typeof body.description === 'string' ? body.description.trim() : page.description;

  if (!title || title.length > 200) {
    return NextResponse.json({ error: 'invalid title' }, { status: 400 });
  }

  const saved = await savePage(
    key,
    {
      title,
      description: description.slice(0, 500),
      html: body.html,
    },
    editor.name,
  );

  if (!saved) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  revalidatePath(pageUrl(key));

  return NextResponse.json({ ok: true, updatedAt: saved.updatedAt.toISOString() });
}
