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
import { client, withJsonBody, withQueryParams } from "@/shared/lib/client-wrapper";

const list = await client.get<Item[]>("privated/servers").exec();
const created = await client.post<Item>("privated/things/create").pipe(withJsonBody(body)).exec();
const page = await client.get<Page>("privated/list").pipe(withQueryParams({ cursor })).exec();
```

- The wrapper unwraps `{ data }`, throws `Error` on non-2xx with the API error
  string, and supports `signal` (pass `ctx.controller.signal` from Reatom).
- `withJsonBody` sets JSON headers/body; `withQueryParams` appends encoded
  query; `withHeaders` adds headers.
- Cookies are included (`credentials: "include"`); never add auth headers
  manually.

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

All API routes return `{ data: ... }` or `{ error: "..." }`; `parseWrappedJson`
handles the envelope. In models use the wrapper, never `res.json()` directly.
For raw header/body access use `mainFetch` only when the wrapper cannot express
it.

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
- Keep query/filter values in atoms; put them into `withQueryParams` in the
  model, not in the component.
- When a mutation changes the list, update `dataAtom` or reset the fetch cache;
  do not keep a second copy of the list in a component.
