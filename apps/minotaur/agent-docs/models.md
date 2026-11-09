# Models

State, async work and forms live in Reatom models (`*.model.ts`). Views only read
atoms and call actions.

## Hard rules

- **State and hooks.** The React baseline is in
  [`atlas/AGENTS.md`](../../../AGENTS.md#react-apps). Use `atom`, `action`,
  `reatomAsync`, `withAssign`, `withReset`, `withDataAtom`, `withStatusesAtom`,
  `withErrorAtom`, `withAbort`, `withCache`, `withSsr`. In components use
  `reatomComponent`, `useAtom`, `useUpdate` from `@reatom/npm-react`.
  Vike/TipTap/`useInView` integration hooks are the only exception, at the
  integration boundary.
- **One model per feature**, under
  `shared/components/app/<feature>/models/<feature>.model.ts` or
  `shared/models/` for cross-feature state.
- **Name every atom/action** with the second `atom(..., "<name>")` argument and
  derived names (`${name}.fetch`). Names are used by the devtools and SSR.
- **Server calls go through the model.** Components never call `client`
  directly; models expose `fetch`/`submit`/`update` async actions.
- **No side effects at module scope.** No `fetch`, timers or browser APIs on
  import; use `onConnect`/`onDisconnect` or actions.

## Shape

```ts
import { reatomAsync, withDataAtom, withErrorAtom, withStatusesAtom } from "@reatom/framework";
import { atom, withAssign } from "@reatom/framework";
import { client } from "@/shared/lib/client-wrapper";

type Item = ExtractApiData<"getPrivatedSomething">["data"][number];

export const something = atom(null, "something").pipe(
  withAssign((_, name) => ({
    fetch: reatomAsync(async (ctx) => {
      return await ctx.schedule(() =>
        client.get("/privated/something", { signal: ctx.controller.signal })
      );
    }, `${name}.fetch`).pipe(
      withDataAtom(null),
      withStatusesAtom(),
      withErrorAtom(),
      withAbort(),
    ),
  })),
);
```

- `ctx.schedule` moves the promise to the action context (abort/status aware).
- `withDataAtom` holds the last successful value; `statusesAtom.isFirstPending`
  drives `PageLoader`; `errorAtom` drives `ErrorBlock`.
- `withAbort` cancels in-flight requests when the page/model disconnects or a
  new request supersedes the old one.
- `withCache` is for repeated list requests; reset the cache after mutations.

## Async mutations

```ts
export const createThing = reatomAsync(async (ctx) => {
  const body: ExtractApiBody<"postPrivatedThingsCreate">["content"]["application/json"] = {
    title: ctx.get(formState.title),
  };

  return await client.post("/privated/things/create", { json: body });
}, {
  name: "createThing",
  onFulfill: (ctx, created) => {
    const current = ctx.get(things.fetch.dataAtom) ?? [];
    things.fetch.dataAtom(ctx, [...current, created]);
    formState.reset(ctx);
    toast.success("Created");
  },
  onReject: (_, error) => notifyAboutRestrictRole(error),
}).pipe(withStatusesAtom(), withErrorAtom());
```

Use `onFulfill` to update/invalidate the list and show a toast; use `onReject`
for a single error path. Do not duplicate error toasts in the component.

## Forms

- One atom per field, grouped in a `formState` atom, each with `withReset()`.
- A `reset` action clears the group after submit.
- Validate with a `validator`/computed atom before calling the API.
- Submit via `reatomAsync` with the wrapper's `json` option.
- The submit button reads `submit.statusesAtom.isPending`; do not add a local
  `isSubmitting` flag.

## SSR state

- Wrap atoms that must be serialized with `withSsr("stable-key")`.
- Read them on the server with `getDataFromSnapshot("stable-key", snapshot)`.
- Keys are strings; keep them stable and unique.
- Do not store secrets or large objects in the snapshot.

## Page lifecycle

For route-local effects use `createPageModel` from `shared/lib/events`:

```ts
const page = createPageModel({
  name: "private.config",
  spyedAtom: pageState.urlParsed,
  hooks: {
    onSpy: (ctx, _, urlParsed) => {
      listState.search(ctx, urlParsed?.search ?? "");
    },
  },
});
```

`onConnect`/`onDisconnect`/`onAfterDisconnect` handle subscriptions and cleanup;
never leak timers/listeners from a page.

## Naming

- group atom: `thing` / `thingState`; children: `thing.fetch`, `thing.dataAtom`.
- actions: verbs (`submit`, `update`, `toggle`, `reset`).
- booleans: `isX`, `hasX`.
- Keep models free of presentation strings except toast texts; UI copy belongs
  to paraglide.
