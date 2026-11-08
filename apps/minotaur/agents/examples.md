# Canonical examples

Copy the shape, not the wording. All examples follow the no-React-hooks rule.

## Private page + guard + title

```tsx
// pages/private/widgets/+Page.tsx
import { Widgets } from "@/shared/components/app/private/components/widgets";
import { SectionWrapper, WithHeader } from "@/shared/components/app/private/components/ui";

export default function Page() {
  return (
    <SectionWrapper className="flex flex-col gap-3 w-full h-full">
      <WithHeader title="Widgets" />
      <Widgets />
    </SectionWrapper>
  );
}
```

```ts
// pages/private/widgets/+title.ts
import { wrapTitle } from "@/shared/lib/helpers";
export default wrapTitle("Widgets");
```

```ts
// pages/private/widgets/+guard.ts
import { type PageContextServer } from "vike/types";
import { redirect } from "vike/abort";
import { WIDGETS_READ_PERMISSION } from "@/shared/components/app/private/models/widgets.model";
import { getDataFromSnapshot } from "@/shared/models/app/utils";

export function guard(pageCtx: PageContextServer) {
  const user = getDataFromSnapshot("currentUser", pageCtx.snapshot);
  if (!user) throw redirect("/");
  if (!user.meta.permissions.includes(WIDGETS_READ_PERMISSION)) throw redirect("/private/");
}
```

## Model: list + mutation

```ts
import {
  action, atom, reatomAsync, withAbort, withAssign, withDataAtom, withErrorAtom,
  withReset, withStatusesAtom,
} from "@reatom/framework";
import { client, withJsonBody } from "@/shared/lib/client-wrapper";
import { notifyAboutRestrictRole } from "./actions.model";
import { toast } from "sonner";

type Widget = ExtractApiData<"getPrivatedWidgets">["data"][number];

export const WIDGETS_READ_PERMISSION = "widgets.read";

export const widgets = atom(null, "widgets").pipe(
  withAssign((_, name) => ({
    fetch: reatomAsync(async (ctx) =>
      await ctx.schedule(() =>
        client.get<Widget[]>("privated/widgets", { signal: ctx.controller.signal }).exec()
      ),
      `${name}.fetch`
    ).pipe(withDataAtom(null), withStatusesAtom(), withErrorAtom(), withAbort()),
  })),
);

export const form = atom(null, "widgetForm").pipe(
  withAssign((_, name) => ({
    name: atom("", `${name}.name`).pipe(withReset()),
    reset: action((ctx) => form.name.reset(ctx), `${name}.reset`),
  })),
);

export const createWidget = reatomAsync(async (ctx) => {
  const body: ExtractApiBody<"postPrivatedWidgetsCreate">["content"]["application/json"] = {
    name: ctx.get(form.name),
  };

  return await client.post<Widget>("privated/widgets").pipe(withJsonBody(body)).exec();
}, {
  name: "createWidget",
  onFulfill: (ctx, created) => {
    const current = ctx.get(widgets.fetch.dataAtom) ?? [];
    widgets.fetch.dataAtom(ctx, [...current, created]);
    form.reset(ctx);
    toast.success("Widget created");
  },
  onReject: (_, error) => notifyAboutRestrictRole(error),
}).pipe(withStatusesAtom(), withErrorAtom());
```

## Component: list + dialog

```tsx
import { reatomComponent, useUpdate } from "@reatom/npm-react";
import { Dialog } from "@ark-ui/react/dialog";
import { Portal } from "@ark-ui/react/portal";
import { Button } from "@/shared/ui/button";
import { DialogClose, dialogVariant } from "@/shared/ui/dialog";
import { ErrorBlock } from "@/shared/ui/error-block";
import { PageLoader } from "@/shared/ui/page-loader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { widgets, widgetEditor } from "../models/widgets.model";

export const Widgets = reatomComponent(({ ctx }) => {
  useUpdate(widgets.fetch, []);

  const status = ctx.spy(widgets.fetch.statusesAtom);
  const error = ctx.spy(widgets.fetch.errorAtom);
  const data = ctx.spy(widgets.fetch.dataAtom);

  if (status.isFirstPending) return <PageLoader />;
  if (error) return <ErrorBlock title={String(error)} />;

  return (
    <Table>
      <TableHeader>
        <TableRow><TableHead>Name</TableHead><TableHead /></TableRow>
      </TableHeader>
      <TableBody>
        {(data ?? []).map((item) => (
          <TableRow key={item.id}>
            <TableCell>{item.name}</TableCell>
            <TableCell>
              <Dialog.Root onOpenChange={({ open }) => { if (!open) widgetEditor.close(ctx); }}>
                <Dialog.Trigger asChild>
                  <Button onPointerDown={() => widgetEditor.open(ctx, item)}>Edit</Button>
                </Dialog.Trigger>
                <Portal>
                  <Dialog.Backdrop className={dialogVariant.backdrop()} />
                  <Dialog.Positioner>
                    <Dialog.Content className={dialogVariant.content()}>
                      <DialogClose />
                      <Dialog.Title className={dialogVariant.title()}>Edit widget</Dialog.Title>
                      {/* fields read widgetEditor.form and call widgetEditor.set */}
                    </Dialog.Content>
                  </Dialog.Positioner>
                </Portal>
              </Dialog.Root>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}, "Widgets");
```

## Model rules in one line

- Async: `reatomAsync` + `ctx.schedule` + `statuses/error/data` atoms.
- Mutations: `onFulfill` updates state and toasts; `onReject` maps restrictions.
- Forms: field atoms + `withReset`; submit reads atoms, never component state.
- Views: `reatomComponent` reads atoms; `useUpdate` triggers a fetch; no hooks.
