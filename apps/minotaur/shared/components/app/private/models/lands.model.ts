import { alertDialog } from "@/shared/components/config/alert-dialog/alert-dialog.model";
import { createLink } from "@/shared/components/config/link/link.model";
import { client } from "@/shared/lib/client-wrapper";
import { isError } from "@/shared/lib/utils";
import { logError } from "@/shared/lib/log";
import { atom, reatomAsync, withAssign, withErrorAtom, withReset, withStatusesAtom } from "@reatom/framework";
import { toast } from "sonner";
import { navigate } from "vike/client/router";

export const landsState = atom(null, "landsState").pipe(
  withAssign((_, name) => ({
    create: atom(null, `${name}.create`).pipe(
      withAssign((_, name) => ({
        initialChunksSize: atom(4, `${name}.initialChunksSize`).pipe(withReset()),
        landName: atom("", `${name}.landName`).pipe(withReset()),
        title: atom("", `${name}.title`).pipe(withReset()),
      }))
    ),
    delete: atom(null, `${name}.delete`).pipe(
      withAssign((_, name) => ({
        confirmed: atom(false, `${name}.confirmed`).pipe(withReset()),
      }))
    ),
  }))
)

export const lands = atom(null, "lands").pipe(
  withAssign((_, name) => ({
    create: reatomAsync(async (ctx) => {
      type PathType = "postPrivatedLandsCreate"

      const json: ExtractApiBody<PathType>["content"]["application/json"] = {
        initialChunksSize: ctx.get(landsState.create.initialChunksSize),
        name: ctx.get(landsState.create.landName),
        title: ctx.get(landsState.create.title),
      }

      const result = await client
        .post<ExtractApiData<PathType>["data"]>("privated/lands/create", {
          json
        })
        .exec()

      return { result }
    }, {
      name: `${name}.create`,
      onFulfill: (ctx, { result }) => {
        toast.success("Регион создан", {
          action: {
            label: "Перейти",
            onClick() {
              ctx.schedule(() => navigate(createLink("land", result.ulid)))
            }
          }
        })

        landsState.create.initialChunksSize.reset(ctx)
        landsState.create.landName.reset(ctx)
        landsState.create.title.reset(ctx)
      },
      onReject: (_, e) => {
        logError(e, { type: "toast" });

        if (!isError(e)) return;
      }
    }).pipe(
      withErrorAtom(),
      withStatusesAtom()
    ),
    delete: reatomAsync(async (ctx, ulid: string) => {
      const isConfirmed = ctx.get(landsState.delete.confirmed);

      if (!isConfirmed) {
        alertDialog.open(ctx, {
          title: "Подтверждение удаления",
          description: `Вы уверены, что хотите удалить регион?`,
          onConfirm: () => {
            landsState.delete.confirmed(ctx, true)
            return lands.delete(ctx, ulid)
          },
          onCancel: () => {
            landsState.delete.confirmed(ctx, false)
          },
          errorAtom: lands.delete.errorAtom,
        })

        return;
      }

      const result = await client
        .delete<ExtractApiData<"deletePrivatedLandsByUlid">["data"]>(`privated/lands/${ulid}`)
        .exec()

      return { result }
    }, {
      name: `${name}.delete`,
      onFulfill: (ctx, res) => {
        if (!res) return;

        toast.success("Регион удален")

        landsState.delete.confirmed.reset(ctx)
      }
    }).pipe(
      withErrorAtom(),
      withStatusesAtom()
    ),
  }))
)
