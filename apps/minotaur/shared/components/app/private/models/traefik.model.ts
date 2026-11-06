import { panelClient, withJsonBody } from "@/shared/lib/client-wrapper";
import {
  action, atom, reatomAsync, withDataAtom, withErrorAtom, withStatusesAtom,
} from "@reatom/framework";
import { toast } from "sonner";

export const configAtom = atom("", "traefik.config");
export const lastSavedConfigAtom = atom("", "traefik.lastSaved");
export const isDirtyAtom = atom(
  (ctx) => ctx.spy(configAtom) !== ctx.spy(lastSavedConfigAtom),
  "traefik.isDirty"
);

type ConfigPayload = { yaml: string };

export const traefikConfig = reatomAsync(async (ctx) => {
  const data = await panelClient<ConfigPayload>("traefik").exec();

  configAtom(ctx, data.yaml);
  lastSavedConfigAtom(ctx, data.yaml);

  return data.yaml;
}, "traefikConfig").pipe(
  withStatusesAtom(),
  withDataAtom(),
  withErrorAtom(),
);

export const resetConfig = action((ctx) => {
  configAtom(ctx, ctx.get(lastSavedConfigAtom));
}, "traefik.reset");

/**
 * The previous flow set `lastSaved` before the request, so a failed save still
 * looked clean and the editor had no dirty state at all. Keep the last
 * confirmed content and only clear the dirty flag after the server accepted it.
 */
export const saveConfig = reatomAsync(async (ctx) => {
  const current = ctx.get(configAtom);

  await panelClient
    .post("traefik")
    .pipe(withJsonBody({ yaml: current }))
    .exec();

  return current;
}, {
  name: "saveConfig",
  onFulfill: (ctx, saved) => {
    lastSavedConfigAtom(ctx, saved);
    toast.success("Сохранено");
  },
  onReject: (_, error) => {
    toast.error("Ошибка при сохранении", {
      description: error instanceof Error ? error.message : String(error),
    });
  },
}).pipe(
  withStatusesAtom(),
  withErrorAtom(),
);
