import ky from 'ky';
import { cookies } from 'next/headers';

export type Editor = { id: string; name: string };

const COOKIE_NAME = process.env.WIKI_AUTH_COOKIE || 'fasberry_session';

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
 * The httpOnly cookie of the .fasberry.fun domain is sent to wiki.fasberry.fun as well,
 * so the check happens on the server and the token never leaves it.
 */
export async function getEditor(): Promise<Editor | null> {
  if (process.env.WIKI_EDITOR_OPEN === '1') {
    return { id: 'local', name: 'local' };
  }

  const checkUrl = process.env.WIKI_AUTH_CHECK_URL;
  if (!checkUrl) return null;

  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const payload = await ky
      .get(checkUrl, {
        headers: { cookie: `${COOKIE_NAME}=${token}` },
        cache: 'no-store',
        timeout: 5000,
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
