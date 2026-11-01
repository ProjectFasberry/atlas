import { action, atom, onConnect } from '@reatom/framework';

/** Steve head from the public volume: the same fallback the app uses for a missing skin. */
export const DEFAULT_AVATAR = 'https://volume.fasberry.fun/static/fallback/steve_head.png';

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

/** Ark marks its trigger, positioner and content with the same scope attribute. */
const MENU_SELECTOR = '[data-scope="menu"]';

/**
 * Ark closes the menu on an outside click and on Escape itself, but the atom has to follow
 * the same clicks even when some other handler stops the event, so the state is checked here.
 */
onConnect($userMenuOpen, (ctx) => {
  if (!ctx.get($userMenuOpen)) return;

  const onPointerDown = (event: PointerEvent) => {
    if (event.target instanceof Element && event.target.closest(MENU_SELECTOR)) return;
    setUserMenuOpen(ctx, false);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') setUserMenuOpen(ctx, false);
  };

  document.addEventListener('pointerdown', onPointerDown, true);
  document.addEventListener('keydown', onKeyDown);

  return () => {
    document.removeEventListener('pointerdown', onPointerDown, true);
    document.removeEventListener('keydown', onKeyDown);
  };
});
