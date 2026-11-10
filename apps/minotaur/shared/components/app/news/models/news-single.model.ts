import { ENVIRONMENT } from "@/shared/consts";
import { getDataFromSnapshot } from "@/shared/models/app/utils";
import { withSsr } from "@/shared/models/ssr";
import { action, atom, withAssign, withReset } from "@reatom/framework";

export type NewsSingle = ExtractApiData<"getNewsById">["data"]

const createEditNewsParams = action(async (ctx) => {
  const id = ctx.get(newsSingleState.data)?.id;
  if (!id) return;

  const { configLink } = await import("../../private/models/actions.model");

  newsSingleState.editParams(ctx, configLink({ parent: "news", type: "edit", target: id }))
}, "createEditNewsParams")

export const defineNewsMeta = action((ctx, snapshot: Snapshot) => {
  const currentUser = getDataFromSnapshot("currentUser", snapshot)
  if (!currentUser) return false;

  const isAllowed = currentUser.meta.permissions.includes("news.update")

  if (isAllowed && ENVIRONMENT === 'client') {
    createEditNewsParams(ctx)
  }

  return isAllowed
}, "defineNewsMeta")

export const newsSingleState = atom(null, "newsSingleState").pipe(
  withAssign((_, name) => ({
    data: atom<Nullable<NewsSingle>>(null, `${name}.data`).pipe(withSsr(`${name}.data`), withReset()),
    editParams: atom("", `${name}.editParams`).pipe(withReset())
  }))
)
