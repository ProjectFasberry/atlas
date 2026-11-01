import { action, atom, onConnect } from '@reatom/framework';
import { withAssign } from '@reatom/primitives';

export type Theme = 'light' | 'dark';

type Point = { x: number; y: number };

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => { finished: Promise<void> };
};

const THEME_COOKIE = 'theme';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const BACKGROUND: Record<Theme, string> = {
  light: '#ffffff',
  dark: '#0a0d0d',
};

/** Matches `--theme-reveal-feather` and the animation duration in CSS. */
const FEATHER = 150;
const DURATION = 620;
const EASING: [number, number, number, number] = [0.33, 0, 0.2, 1];

/** The current cover and the id of the latest animation - to cancel the previous one. */
let stopCover: (() => void) | null = null;
let revealId = 0;

/** The server already put the theme class on `<html>`, so the DOM is the source. */
function readTheme(): Theme {
  return document.documentElement.classList.contains('light') ? 'light' : 'dark';
}

function commitTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
  root.style.colorScheme = theme;

  // the next server render reads this cookie and puts the class on <html> itself
  // biome-ignore lint/suspicious/noDocumentCookie: CookieStore is not supported everywhere
  document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
}

/**
 * View Transitions give a real reveal: the old snapshot stays outside the
 * circle, the new one appears inside, content never disappears. In Gecko a clip
 * on `::view-transition-*` does not render, so the cover path is used there.
 */
function supportsViewTransitionReveal() {
  if (typeof (document as ViewTransitionDocument).startViewTransition !== 'function') return false;

  const ua = navigator.userAgent;
  if (/firefox|fxios/i.test(ua)) return false;

  return /chrome|chromium|crios|edg\/|opr\//i.test(ua);
}

/** A cubic-bezier curve like in CSS: solve x(t) for time and take y(t). */
function createEasing([x1, y1, x2, y2]: [number, number, number, number]) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;

  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;

  return (progress: number) => {
    let low = 0;
    let high = 1;
    let t = progress;

    for (let i = 0; i < 10; i += 1) {
      const x = sampleX(t);
      if (Math.abs(x - progress) < 0.001) break;
      if (x < progress) low = t;
      else high = t;
      t = (low + high) / 2;
    }

    return sampleY(t);
  };
}

const ease = createEasing(EASING);

/** Radius that reaches the farthest corner of the window. */
function farthestRadius(x: number, y: number) {
  const width = window.innerWidth;
  const height = window.innerHeight;

  return Math.hypot(Math.max(x, width - x), Math.max(y, height - y)) + 24;
}

function revealWithTransition(next: Theme, x: number, y: number) {
  const root = document.documentElement;
  const id = ++revealId;

  clearCover();

  root.style.setProperty('--theme-reveal-x', `${x}px`);
  root.style.setProperty('--theme-reveal-y', `${y}px`);
  root.style.setProperty('--theme-reveal-radius', `${farthestRadius(x, y)}px`);

  const doc = document as ViewTransitionDocument;
  const transition = doc.startViewTransition?.(() => commitTheme(next));
  if (!transition) return;

  transition.finished.finally(() => {
    if (id !== revealId) return;

    root.style.removeProperty('--theme-reveal-x');
    root.style.removeProperty('--theme-reveal-y');
    root.style.removeProperty('--theme-reveal-radius');
  });
}

function clearCover() {
  stopCover?.();
  stopCover = null;
}

/**
 * A cover in the old colour with the circle cut out: inside the circle the new
 * content is already visible, outside it is the old colour. The edge is blurred
 * and grain runs along it. The radius is updated every frame so we do not depend
 * on @property.
 */
function revealWithCover(next: Theme, current: Theme, x: number, y: number) {
  const id = ++revealId;
  clearCover();

  const cover = document.createElement('div');
  cover.className = 'theme-reveal-cover';

  const grain = document.createElement('div');
  grain.className = 'theme-reveal-grain';

  for (const layer of [cover, grain]) {
    layer.style.setProperty('--theme-reveal-x', `${x}px`);
    layer.style.setProperty('--theme-reveal-y', `${y}px`);
    layer.style.setProperty('--theme-reveal-color', BACKGROUND[current]);
  }

  // the cover and the new theme land in the same frame, so there is no flash
  document.body.append(cover, grain);
  commitTheme(next);

  const radius = farthestRadius(x, y) + FEATHER + 32;
  const started = performance.now();
  let frame = 0;

  const stop = () => {
    cancelAnimationFrame(frame);
    cover.remove();
    grain.remove();
    if (id === revealId) stopCover = null;
  };

  const step = (now: number) => {
    const progress = Math.min(1, (now - started) / DURATION);
    // a 0px radius gives a degenerate gradient - keep a minimum of one pixel
    const size = Math.max(1, radius * ease(progress));

    cover.style.setProperty('--theme-reveal-radius', `${size}px`);
    grain.style.setProperty('--theme-reveal-radius', `${size}px`);

    if (progress < 1) frame = requestAnimationFrame(step);
    else stop();
  };

  frame = requestAnimationFrame(step);
  stopCover = stop;
}

function animateTheme(next: Theme, current: Theme, point?: Point) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    clearCover();
    commitTheme(next);
    return;
  }

  const x = point?.x ?? window.innerWidth / 2;
  const y = point?.y ?? window.innerHeight / 2;

  if (supportsViewTransitionReveal()) revealWithTransition(next, x, y);
  else revealWithCover(next, current, x, y);
}

/**
 * Site theme. `null` - the DOM has not been read yet (SSR and the first render),
 * so components show the default theme until initialisation.
 */
export const $theme = atom<Theme | null>(null, 'theme').pipe(
  withAssign((_, name) => ({
    init: action((ctx) => {
      $theme(ctx, readTheme());
    }, `${name}.init`),
    toggle: action((ctx, point?: Point) => {
      const current = ctx.get($theme) ?? readTheme();
      const next: Theme = current === 'dark' ? 'light' : 'dark';

      $theme(ctx, next);
      animateTheme(next, current, point);
    }, `${name}.toggle`),
  })),
);

/** Scope atom: depends on the nullable `$theme`, assume dark while there is no theme. */
export const $isDark = atom((ctx) => (ctx.spy($theme) ?? 'dark') === 'dark', 'isDark');

// read the stored theme as soon as a component subscribes to the state
onConnect($theme, (ctx) => {
  if (ctx.get($theme) === null) $theme.init(ctx);
});
