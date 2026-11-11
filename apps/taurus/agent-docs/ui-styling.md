# UI, styling and assets

Tailwind CSS v4 + `tailwind-variants` (`tv`) + `cnfast`. Use the existing
primitives and Minecraft CSS; do not add a UI library or a second styling system.

## Classes

- Inline Tailwind classes; `tv({ base, variants, defaultVariants })` for reusable
  variants; `cn` from `shared/lib/utils.ts` for conditionals.
- Match the scale: `gap-2/3/4`, `p-3/4/5`, `text-sm/base/lg`,
  `bg-neutral-900`, `text-neutral-400`, `border-neutral-800`.
- `responsive` is the standard width wrapper. `sectionVariant()` +
  `sectionVariantChild()` build full-page sections.
- `MainWrapperPage variant="with_section"` is the page shell for content pages;
  do not duplicate it.
- Inline `style` only for computed values (width, transform, dynamic URL).

## Minecraft CSS

`shared/styles/minecraft.css` provides 9-slice sprites and block units. Reuse,
never re-implement:

| Class | Use |
| --- | --- |
| `button` | MC button; `Button` already applies it. |
| `panel`, `panel-dark`, `transparent-panel` | Large framed panels. |
| `achievement-panel`, `transparent-achievement-panel` | Cards and glass panels. |
| `raised-slot`, `raised-slot-active`, `raised-slot-button` | Grey slots; active state is darker. |
| `enchanting-slot`, `anvil-textbox`, `transparent-slot` | Inputs/slots. |
| `weather`, `borders_up/down`, `full-screen-section` | Landing effects and section edges. |

- `--block-size: 48px`; border images use `image-rendering: pixelated`.
- On grey slots use **dark** text (`text-neutral-800`). Do not put green text on
  grey; reserve green for dark surfaces.
- Disabled `Button` already dims and blocks pointer events. Add a visible
  “скоро”/reason badge when a disabled action needs explanation.
- Do not change `.full-screen-section` borders globally; the landing’s
  `landing-page`/`section-edge` rules are page-specific.

## Primitives

`shared/ui/`:

- `Button`, `Typography`, `Skeleton`, `Icon`.
- `Dialog` (`dialogVariant`, `DialogClose`) + Ark UI `Dialog.Root`.
- `Accordion` variants; Ark UI `Accordion.Root`.
- `Carousel`, `Menu`, `Select`, `Drawer`, `Overlay`, `WrapperTitle`.
- `MainWrapperPage`.

Extend a primitive’s variants when the change is reusable; otherwise pass
`className`. Do not create a parallel button/panel.

## Icons and images

- Icons: `<Icon name="sprite:arrow-left" />`; symbols come from
  `public/sprites` via `@neodx/svg`. `shared/sprite.gen.ts` and `public/sprites`
  are generated — do not edit.
- Volume art: `getStaticObject(...)`; never hardcode the volume host.
- Always set dimensions/aspect ratio; lazy-load below the fold; use
  `fetchpriority="high"` only for the hero.
- Pixel art gets `image-rendering: pixelated`; photos use `object-cover`.

## Responsive and a11y

- Check 390 px and 1440 px; no horizontal overflow.
- Pixel font is for 16 px+ UI text, not long paragraphs.
- All icon-only controls need `aria-label`; images need `alt` or `alt=""` when
  decorative.
- Keep focus states; do not remove outlines.
