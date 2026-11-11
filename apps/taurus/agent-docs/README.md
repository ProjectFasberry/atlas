# Agent-readable docs — taurus

Taurus is the public Fasberry landing and content site: Vike + Solid + Reatom,
deployed as a Cloudflare Worker (`landing`). Read the root
[`AGENTS.md`](../../../AGENTS.md) first; its rules win over this folder.

| File | Read it when |
| --- | --- |
| [`pages.md`](./pages.md) | Adding a page, section, `+data`, metadata or SSR behavior. |
| [`models.md`](./models.md) | Adding state, async data, actions or lifecycle work. |
| [`data-api.md`](./data-api.md) | Calling the API, using generated types or loading assets. |
| [`ui-styling.md`](./ui-styling.md) | Choosing primitives, Minecraft CSS classes, icons or layout. |
| [`i18n.md`](./i18n.md) | Adding user-facing text or changing locales. |
| [`checks-deploy.md`](./checks-deploy.md) | Running checks, e2e, build, size or deploy. |
| [`examples.md`](./examples.md) | Copying a canonical page/model/component shape. |

## Non-negotiables

- No state in Solid signals, stores or context. Use Reatom atoms/actions and
  read them with `useAtom`/`useCtx`.
- Do not hardcode user-facing text, domains, API URLs or asset hosts.
- Do not edit generated output: `paraglide/`, `dist/`, `.wrangler/`,
  `public/sprites/`, `shared/sprite.gen.ts`.
- Do not commit, push or deploy without an explicit request.
