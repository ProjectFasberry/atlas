import { action, atom, reatomAsync, withAssign } from "@reatom/framework";
import { withCache, withDataAtom, withStatusesAtom } from "@reatom/framework";
import { mainClient } from "@/shared/api/client";

export type LauncherArtifact = {
  platform: "windows-x86_64" | "darwin-aarch64";
  url: string | null;
};

/**
 * Launcher builds come from the api: the bucket path lives in the backend url
 * registry, so a new build is published without touching the landing page.
 */
export const launcher = atom(null, "launcher").pipe(
  withAssign((_, name) => ({
    fetch: reatomAsync(async (ctx) => {
      return await ctx.schedule(() =>
        mainClient
          .GET("/launcher", { signal: ctx.controller.signal })
          .then((response) => response.data?.data ?? null)
      );
    }, `${name}.fetch`).pipe(
      withDataAtom(null, (_, data) => data),
      withCache({ swr: false }),
      withStatusesAtom()
    )
  }))
);

export const launcherArtifact = (ctx: { artifacts?: LauncherArtifact[] } | null, platform: string) =>
  ctx?.artifacts?.find((item) => item.platform === platform)?.url ?? null;
