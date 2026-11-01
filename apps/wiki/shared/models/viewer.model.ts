import { action, atom } from '@reatom/framework';

/** The signed-in user, filled once by `ViewerSync` from the server value. */
export type Viewer = { nickname: string; canEdit: boolean; avatar: string | null };

export const $viewer = atom<Viewer | null>(null, 'viewer');

export const setViewer = action((ctx, viewer: Viewer | null) => {
  $viewer(ctx, viewer);
}, 'viewer.set');

/** Open state of the user dropdown - UI state, so it lives here and not in a component. */
export const $userMenuOpen = atom(false, 'userMenu.open');

export const setUserMenuOpen = action((ctx, open: boolean) => {
  $userMenuOpen(ctx, open);
}, 'userMenu.set');
