import { action, atom, onConnect } from '@reatom/framework';

/** The signed-in user, filled once by `ViewerSync` from the server value. */
export type Viewer = { nickname: string; canEdit: boolean; avatar: string | null };

export const $viewer = atom<Viewer | null>(null, 'viewer');

export const setViewer = action((ctx, viewer: Viewer | null) => {
  $viewer(ctx, viewer);
}, 'viewer.set');

/** Open state of the user dropdown - UI state, so it lives here and not in a component. */
export const $userMenuOpen = atom(false, 'userMenu.open');

export const toggleUserMenu = action((ctx) => {
  $userMenuOpen(ctx, !ctx.get($userMenuOpen));
}, 'userMenu.toggle');

export const closeUserMenu = action((ctx) => {
  $userMenuOpen(ctx, false);
}, 'userMenu.close');

/** Anything inside the dropdown or its trigger carries this attribute. */
const MENU_SELECTOR = '[data-user-menu]';

onConnect($userMenuOpen, (ctx) => {
  if (!ctx.get($userMenuOpen)) return;

  const onPointerDown = (event: PointerEvent) => {
    if (event.target instanceof Element && event.target.closest(MENU_SELECTOR)) return;
    closeUserMenu(ctx);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') closeUserMenu(ctx);
  };

  document.addEventListener('pointerdown', onPointerDown);
  document.addEventListener('keydown', onKeyDown);

  return () => {
    document.removeEventListener('pointerdown', onPointerDown);
    document.removeEventListener('keydown', onKeyDown);
  };
});
