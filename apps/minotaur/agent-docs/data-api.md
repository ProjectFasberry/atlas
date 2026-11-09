# Data and API

All remote data goes through the generated OpenAPI clients. No raw `fetch`, no
hand-written response types where an operation exists.

## Clients

| Client | Base URL | Use |
| --- | --- | --- |
| `client` | `VITE_API_URL` (`api.fasberry.fun`) | Public + main API, user data, panel routes under `/privated/*` |
| `panelClient` | `VITE_PANEL_API_URL` (`panel.fasberry.fun`) | Panel-only API (glaux) |

Both live in `shared/api/client.ts`; the ergonomic wrapper is
`shared/lib/client-wrapper.ts`:

```ts
import { client } from "@/shared/lib/client-wrapper";

const users = await client.get("/privated/user/list", {
  params: { query: { limit: 20 } },
});
const user = await client.get("/privated/user/{nickname}", {
  params: { path: { nickname } },
});
const created = await client.post("/privated/things/create", { json: body });
```

- Paths, query, path params and JSON bodies are inferred from the generated
  schema. Do not pass explicit generics; they shadow the path type.
- Calls are plain promises: no `.pipe()` and no `.exec()`.
- `params.query` is URL-encoded; `params.path` fills `{placeholders}` and is
  required when the path declares them.
- The wrapper unwraps `{ data }`, throws `Error` on non-2xx with the API error
  string, and supports `signal` (pass `ctx.controller.signal` from Reatom),
  `headers`, `json`, `body` (FormData), `timeout` and `retry`.
- Cookies are included (`credentials: "include"`); never add auth headers
  manually.

**Undocumented endpoints.** Some routes are missing from the OpenAPI contract
(economy, payments, parts of the store and history). Use the `raw` escape hatch
and keep the type explicit:

```ts
const wallet = await client.raw.get<EconomyWallet>("/privated/economy/wallet", {
  params: { query: { nickname } },
});
```

## Types

The API contract is generated from the backend OpenAPI spec:

- `shared/types/gen/api/main.schema.ts` and `panel.schema.ts` re-export
  `@repo/shared/types/gen/{main,panel}/schema`.
- Regenerate from the repo root with `pnpm openapi:prod` (or `openapi:dev`
  against local services). Never hand-edit these files or their source in
  `pkgs/shared/types/gen`.
- Operation helpers in `declare.d.ts`:
  `ExtractApiData<"operationId">`, `ExtractApiBody`, `ExtractApiParams`,
  `ExtractApiErr`. The operation IDs are the keys of the generated `operations`
  map; copy them exactly from the schema (they may contain hyphens, e.g.
  `getServers-with-map`).
- `ExtractApi*` is bound to the main API schema. For panel-only endpoints use
  `panelClient` and type the result explicitly or infer it from the call.
- Backend changes require a new OpenAPI generation before the frontend type
  check passes; do not patch the frontend types by hand.

## Response envelope

All API routes return `{ data: ... }` or `{ error: "..." }`; the wrapper
handles the envelope. In models use the wrapper, never raw `fetch` or
`res.json()`. For operations without a documented response, `ExtractApiData`
may resolve to `never`; prefer `client.raw` with a local type.

## Errors

- Models handle API errors in `onReject`; views render `ErrorBlock`/toasts.
- `notifyAboutRestrictRole(error)` maps permission/restriction errors to the
  shared alert; use it for mutations that can be denied.
- `toast.success` for a completed mutation; one toast per action, not in both
  the model and the view.
- Never swallow an error silently in a mutation.

## Permissions and auth

- Auth is cookie-based; `/me` is loaded into the SSR snapshot as
  `currentUser`.
- Permission names are lowercase (`servers.read`, `servers.update`,
  `releases.read`, `economy.write`). Use the constants exported by the feature
  model (`RELEASES_READ_PERMISSION`, `SERVERS_READ_PERMISSION`, ...).
- Guards only decide whether the UI renders. The API is the security boundary;
  do not rely on hiding a button.
- A denied mutation must still be safe: the backend re-checks the permission.

## Pagination and filters

- Cursor pagination uses `PaginatedMeta` (`endCursor`, `hasNextPage`).
- Keep query/filter values in atoms; pass them as `params.query` in the model,
  not in the component.
- When a mutation changes the list, update `dataAtom` or reset the fetch cache;
  do not keep a second copy of the list in a component.
