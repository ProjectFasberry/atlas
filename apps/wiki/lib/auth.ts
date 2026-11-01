import { headers } from 'next/headers';
import { cache } from 'react';
import { getServerEnv } from '@/lib/env/server';
import { http } from '@/lib/utils/http';

export type Editor = { id: string; name: string };

/** Steve head from the public volume, the same fallback the app uses when a skin is missing. */
export const DEFAULT_AVATAR = 'https://volume.fasberry.fun/static/fallback/steve_head.png';

/** Who is signed in by the session cookie, and whether that user may edit. */
export type Viewer = { nickname: string; canEdit: boolean; avatar: string | null };

type AccessPayload = {
  id?: string | number | null;
  name?: string | null;
  username?: string | null;
  nickname?: string | null;
  canEdit?: boolean;
  data?: AccessPayload;
  user?: AccessPayload;
};

type Access = { nickname: string; canEdit: boolean };

/**
 * The backend answers from the cookie whether a user is signed in and may edit
 * (`WIKI_AUTH_CHECK_URL`, for example https://api.fasberry.fun/wiki/access).
 *
 * The whole incoming `cookie` header is forwarded, like minotaur does: the session
 * cookie name belongs to the backend, so nothing about it is hardcoded here. The
 * httpOnly cookie of the .fasberry.fun domain reaches wiki.fasberry.fun too, and the
 * token never leaves the server. One call per request, shared by the page and the layout.
 */
export const getAccess = cache(async (): Promise<Access | null> => {
  const env = getServerEnv();

  if (env.editorOpen) return { nickname: 'local', canEdit: true };

  const checkUrl = env.authCheckUrl;
  if (!checkUrl) return null;

  const cookie = (await headers()).get('cookie');
  if (!cookie) return null;

  try {
    const payload = await http
      .get(checkUrl, { headers: { cookie }, cache: 'no-store' })
      .json<AccessPayload>()
      .catch(() => null);

    const user = payload?.data ?? payload?.user ?? payload;
    const nickname = user?.nickname ?? user?.name ?? user?.username;
    if (!nickname || typeof nickname !== 'string') return null;

    const canEdit = payload?.data?.canEdit ?? payload?.canEdit ?? false;

    return { nickname, canEdit };
  } catch {
    return null;
  }
});

/** Who may edit. The hook above answers for every signed-in user, editors are a subset. */
export async function getEditor(): Promise<Editor | null> {
  const access = await getAccess();
  if (!access?.canEdit) return null;

  return { id: access.nickname, name: access.nickname };
}

/** Head of the player skin, served from the public volume; `null` when it cannot be read. */
async function getAvatar(nickname: string): Promise<string | null> {
  const checkUrl = getServerEnv().authCheckUrl;
  if (!checkUrl) return null;

  try {
    const base = new URL(checkUrl).origin;
    const payload = await http
      .get(`${base}/server/player/${encodeURIComponent(nickname)}`, { cache: 'no-store' })
      .json<{ data?: { avatar?: string | null } }>();

    return payload?.data?.avatar ?? null;
  } catch {
    return null;
  }
}

/** The signed-in user with the data the header badge needs. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const access = await getAccess();
  if (!access) return null;

  return { ...access, avatar: (await getAvatar(access.nickname)) ?? DEFAULT_AVATAR };
});
