# Data, API and assets

All API access goes through the generated OpenAPI client. No raw `fetch`, no
hand-written response types where an operation exists.

## Client

`shared/api/client.ts` exports `mainClient` from `openapi-fetch`:

```ts
const response = await mainClient.GET("/news/list", {
  params: { query: { limit: 3, content: false } },
  signal: ctx.controller.signal,
})
const items = response.data?.data?.data ?? []
```

- Base URL: `PUBLIC_ENV__API_URL`; cookies included (`credentials: "include"`).
- The response envelope is `{ data }` or `{ error }`; unwrap explicitly.
- Paths, query and body are inferred from `shared/types/gen.ts`
  (`@repo/shared/types/gen/main/schema`).
- Use `ExtractApiData<"operationId">` for local type aliases when needed.
- Never hand-edit generated schemas or add a second HTTP client.
- Server data (`+data.tsx`) passes `pageCtx.headers`; client models pass
  `ctx.controller.signal`.

## Endpoints used by taurus

| Route | Used by |
| --- | --- |
| `/rules/list`, `/rules/tags` | `/rules` (SSR) |
| `/news/list` | landing news |
| `/modpack/list` | `/modpack` (SSR) |
| `/server/status` | landing join panel, `/status` |
| `/site/content/{page}` | editable copy for `/` (carousel) and `/servers` |
| `/server/player/{nickname}` | `/status` avatars |

`/modpack/list` may return `[]`; render an empty state, not a blank page.

## Editable content

`shared/api/site.ts` declares the `/site/content/*` and `/privated/content/*`
operations until the checked-in OpenAPI schema is regenerated. A page merges the returned document over its
bundled translations: a missing or `null` field keeps the shipped copy, an empty
string clears it. Image values are keys inside the `static` bucket and are
resolved with `getStaticAsset`; `toStaticKey` reverses it for edit mode.

## Edit mode

`?edit=1` is handled on the server: the page forwards the session cookie to
`/site/access`, and when `canEdit` is true it reads `/site/content/{page}?draft=1`.
The draft is rendered as the usual page, adds `noindex`, and initializes
`shared/models/site-edit.model.ts` with the effective values (defaults merged with
the draft).

Every editable page also carries ordered `sections` (`{ id, title, body, hidden }`):
`EditableSections` renders them at the end of the page and, in edit mode, adds
add/remove/reorder/hide controls. `/start` and `/support` are not prerendered
(`prerender: false`) because the draft depends on the request cookie. The fixed toolbar saves the draft through `/privated/content/*`, where
the API re-checks the permission; publish and discard reload the page.

Editors save cross-origin with cookies, so `https://fasberry.fun` must be listed in
the API `cors-origins` runtime config (`getUrlConfig("cors-origins")`); without it
the browser blocks the write requests.

## Errors

- Server data: catch and return `null` plus a `failed` flag; the page renders a
  fallback.
- Client models: `withErrorAtom`; the section renders an error state and retry.
- Do not log tokens, cookies or full API responses.
- Do not swallow a mutation error silently.

## Assets

Use helpers from `shared/lib/helpers.ts`; never hardcode `volume.fasberry.fun`:

```ts
getStaticObject("arts", "bzzvanet-.jpg")
getStaticObject("minecraft", "icons/experience_big.webp")
getCommunityFolder("offenburg")
getLauncherDownloadUrl("windows-x86_64")
```

- `VITE_VOLUME_URL` + `/static/<folder>/<file>` for volume assets.
- `VITE_APP_URL` for app links, `VITE_MAIN_DOMAIN` for project domain,
  `VITE_LANDING_ENDPOINT` for share/copy links.
- Local files live in `public/` (`/imgs/ui`, `/fonts`, `/sprites`).
- CSS uses the `_VOLUME_URL` placeholder; Vite replaces it at build. Do not
  hardcode the host in CSS.
- Always set `width`/`height` or an aspect ratio to avoid CLS; pixel art gets
  `image-rendering: pixelated`.
