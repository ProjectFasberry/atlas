import { headers } from 'next/headers';
import { http } from '@/lib/http';

export type Editor = { id: string; name: string };

type AccessPayload = {
  id?: string | number;
  name?: string;
  username?: string;
  canEdit?: boolean;
  data?: AccessPayload;
  user?: AccessPayload;
};

/**
 * Who is allowed to edit the wiki.
 *
 * WIKI_EDITOR_OPEN=1  - stub: the editor is open to everyone (locally).
 * WIKI_AUTH_CHECK_URL - backend endpoint that decides from the cookie whether editing
 *                       is allowed (for example https://api.fasberry.fun/wiki/access).
 *
 * The whole incoming `cookie` header is forwarded, like minotaur does: the session
 * cookie name belongs to the backend, so nothing about it is hardcoded here. The
 * httpOnly cookie of the .fasberry.fun domain reaches wiki.fasberry.fun too, and the
 * token never leaves the server.
 */
export async function getEditor(): Promise<Editor | null> {
  if (process.env.WIKI_EDITOR_OPEN === '1') {
    return { id: 'local', name: 'local' };
  }

  const checkUrl = process.env.WIKI_AUTH_CHECK_URL;
  if (!checkUrl) return null;

  const cookie = (await headers()).get('cookie');
  if (!cookie) return null;

  try {
    const payload = await http
      .get(checkUrl, {
        headers: { cookie },
        cache: 'no-store',
      })
      .json<AccessPayload>()
      .catch(() => null);
    const user = payload?.data ?? payload?.user ?? payload;
    if (!user) return null;

    const canEdit = payload?.data?.canEdit ?? payload?.canEdit ?? user.canEdit;
    if (canEdit === false) return null;

    return {
      id: String(user.id ?? user.username ?? 'editor'),
      name: String(user.name ?? user.username ?? 'editor'),
    };
  } catch {
    return null;
  }
}
