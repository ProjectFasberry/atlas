import { env } from "@/shared/env";
import type { CapWidgetProps } from "@better-captcha/react/provider/cap-widget";
import { action, atom, reatomAsync, withAssign, withReset } from "@reatom/framework";
import { type CapProgressEvent } from "cap-widget";

let Cap: typeof import("cap-widget").Cap | null = null;

if (import.meta.env.DEV) {
  Cap = (await import("cap-widget")).Cap;
  console.log("cap-widget imported");
}

type PofCallback = Partial<Pick<CapWidgetProps, "onSolve" | "onError" | "onReady">>

export const getCapUrl = () => `${env.VITE_CAP_URL}/${env.VITE_CAP_SITE_KEY}/`;

const capInstance = Cap ? new Cap({
  apiEndpoint: getCapUrl(),
}) : null;

export const pof = atom(null, "pof").pipe(
  withAssign((_, name) => ({
    isOpen: atom(false, `${name}.isOpen`),
    data: atom<{ cb: PofCallback, withProgress?: boolean } | null>(null, `${name}.data`).pipe(withReset()),
    resetAll: action((ctx) => {
      pof.isOpen(ctx, false)
      pof.data.reset(ctx)
    }),
    start: reatomAsync(async (_) => {
      if (import.meta.env.DEV && capInstance) {
        const onProgress = (e: CapProgressEvent) => {
          console.log(e.detail.progress)
        }

        capInstance.addEventListener("progress", onProgress)

        const { token } = await capInstance.solve();
        return { result: token, listeners: { onProgress } };
      }
    }, {
      onFulfill: (_, res) => {
        console.log(res);
      },
      onReject: (_, e) => {
        console.error(e)
      }
    })
  })),
);
