# Look and feel: theme, header, favicons

## Palette and fonts

`app/global.css` starts with three imports: `tailwindcss`, `fumadocs-ui/css/neutral.css`,
`fumadocs-ui/css/preset.css`. Then `:root` and `.dark` override the Fumadocs variables
(`--color-fd-*`): the light theme is a white background with green `#0d9373`; the dark one uses
`#0a0d0d` background and `#4ade80` accent. The dark sidebar is adjusted separately
(`.dark #nd-sidebar`).

The project name font is `PIXY` (`@font-face` from `/fonts/PIXY.ttf`), all other text is
`Inter` via `next/font/google` in `app/layout.tsx`.

## Header

The goal is to match `app.fasberry.fun`: 80px tall.

```css
#nd-notebook-layout:has(#nd-subnav) { --fd-header-height: 5rem; }
#nd-subnav [data-header-body] { height: 5rem; }
```

The right side of the header is `shared/ui/header-controls.tsx`: the language switch, the theme
switch and, for a signed-in user, the skin-head badge (`shared/components/app/user-menu.tsx`) whose
dropdown holds the "Editor" chip. The badge is filled from the server through `$viewer`.

`lib/ui/layout.tsx` defines `nav.title`: the `/favicon.svg` image at 40x40, the name
`Fasberry` in PIXY and a small `wiki` under it (`subscript`), like on the main site. The same
file holds the Fumadocs translations (`i18nProvider(translations)`).

## Favicons

The same set as on `app.fasberry.fun`, stored in `public/`:
`favicon.ico`, `favicon.svg`, `favicon-96x96.png`, `apple-touch-icon.png`, `site.webmanifest`,
`web-app-manifest-192x192.png`, `web-app-manifest-512x512.png`.

Wired up in `metadata` (`app/layout.tsx`): `icons.icon` (ico + 96 png + svg),
`icons.shortcut`, `icons.apple`, `manifest`, `appleWebApp.title = 'Fasberry'`.

## Theme switch

The theme is custom, Fumadocs is disabled: `<RootProvider theme={{ enabled: false }}>`. The
`light`/`dark` class is rendered by the server on `<html>`: `lib/theme.ts` reads the `theme`
cookie (dark by default) and the layout puts it into `className` and `color-scheme`. No script
runs before paint, and the switch writes the same cookie. The model is
`shared/models/theme.model.ts`, the button is `shared/components/theme/theme-toggle.tsx`.

The button passes the click coordinates (for keyboard activation - the button centre). Then
`animateTheme` picks a path:

### Chromium - View Transitions

Gate `supportsViewTransitionReveal()`: `document.startViewTransition` exists and the UA contains
`chrome|chromium|crios|edg/|opr/`. Firefox is filtered out explicitly.

`revealWithTransition` writes `--theme-reveal-x/y/radius` on `:root` (the radius reaches the
farthest corner of the window + 24px), calls `startViewTransition(() => commitTheme(next))` and
removes the variables on `finished`. `revealId` guards against races on a repeated click.

CSS:
- `::view-transition-old(root)` - `animation: none` (the old snapshot sits under the new one);
- `::view-transition-new(root)` - `animation: fd-theme-reveal 620ms cubic-bezier(.33,0,.2,1) both`
  and a mask of three layers:
  1. a disc with a feathered edge (`--theme-reveal-feather: 150px`);
  2. a ring at the border;
  3. noise (`feTurbulence`, 120px tile);
  `mask-composite: add, intersect, add` - the noise is intersected with the ring only, so the
  grain lives on the circle edge instead of the whole page.

Geometry is animated by the registered property `@property --theme-reveal-size` (`<length>`)
in `@keyframes fd-theme-reveal` (from `0px` to `--theme-reveal-radius`), the radii are used
inside gradient stops. **Do not animate `mask-size`/`mask-position`** - that is exactly what used
to flicker: the mask disappeared for a frame. `mask-size` is static: `100% 100%` for the
gradients and `120px` for the noise.

### Firefox and others - the cover

In Gecko `mask-image` and `clip-path` on `::view-transition-*` do not render (verified), so Safari
and Firefox take the other path: `revealWithCover` creates two `fixed` layers.

- `.theme-reveal-cover` (z-index 9997) - a `radial-gradient` in the old theme colour with the
  circle cut out (transparent inside, so the already switched content shows through), the edge is
  blurred by `--theme-reveal-feather`.
- `.theme-reveal-grain` (z-index 9998) - a ring in the old theme colour cut out by the noise mask;
  it adds grain along the edge.

Both layers are appended to `body` **before** `commitTheme(next)`, so the cover and the new theme
land in the same frame and there is no flash. The radius is updated every frame by
`requestAnimationFrame` (the easing is a `cubic-bezier` computed in `createEasing`), and the
layers are removed at the end. `stopCover`/`revealId` cancel the previous animation.

### Common

- `prefers-reduced-motion: reduce` -> the theme changes instantly, no animation and no layers.
- `body::after` - a constant, barely visible film of noise over the page (`opacity: 0.07`,
  180px tile), `pointer-events: none`, z-index 9999.

## Content typography

`.wiki-editor-content` reproduces the article look inside TipTap: spacing, h2/h3, lists, quote,
code, links, images with a border and rounding. The same rules for `article img`, `article table`
apply in read mode, because an article is plain HTML rather than a component.
