import { reatomAsync, spawn, withDataAtom, withStatusesAtom } from "@reatom/framework";
import { action, atom } from "@reatom/framework";
import { sleep, withAssign, withReset } from "@reatom/framework";
import { logError } from "@/shared/lib/log";
import { client } from "@/shared/lib/client-wrapper";
import { translate } from "@/shared/locales/helpers";
import { isIdentityAtom, playerState } from "./player.model";
import { toast } from "sonner";
import { DEFAULT_SOFT_DELAY, DIALOG_DELAY, ENVIRONMENT } from "@/shared/consts";
import { FlyingAnimation, IdleAnimation, RunningAnimation, SkinViewer } from "skinview3d";
import { appState } from "@/shared/models/app/index.model";
import { isEmptyArray } from "@/shared/lib/utils";

type SkinSelected = {
  skin_head_url: string | null,
  skin_url: string | null,
  identifier: string
}

const SKIN_VARIANTS = ["classic", "slim"] as const
const SKIN_DEFAULT_VARIANT = SKIN_VARIANTS[0]

const MAX_SKIN_BYTES = 1024 * 1024
const SKIN_SIZES = new Set(["64x64", "64x32"])

const SKIN_ERROR_MESSAGES: Record<string, () => string> = {
  SKIN_FORBIDDEN: () => translate["player.skin.errors.forbidden"](),
  SKIN_NOT_FOUND: () => translate["player.skin.errors.not-found"](),
  SERVER_OFFLINE: () => translate["player.skin.errors.server-offline"](),
  INVALID_SKIN_FILE: () => translate["player.skin.errors.invalid-file"](),
  RATE_LIMITED: () => translate["player.skin.errors.rate-limited"](),
}

const getSkinErrorMessage = (error: unknown) => {
  const code = error instanceof Error ? error.message : ""

  return SKIN_ERROR_MESSAGES[code]?.() ?? translate["player.skin.errors.generic"]()
}

/** The server validates again; this only avoids a pointless upload. */
const validateSkinFile = async (file: File): Promise<boolean> => {
  if (file.size > MAX_SKIN_BYTES) return false
  if (file.type && file.type !== "image/png") return false

  try {
    const bitmap = await createImageBitmap(file)
    const valid = SKIN_SIZES.has(`${bitmap.width}x${bitmap.height}`)
    bitmap.close()

    return valid
  } catch {
    return false
  }
}

export type SkinVariant = typeof SKIN_VARIANTS[number]
type SkinFileData = { name: string, size: number, url: string }
export type SkinsHistory = NonNullable<ExtractApiData<"getServerSkinHistoryByNickname">["data"]>[number]

const getIsUploadAvailableAtom = atom<boolean>((ctx) => ctx.spy(isIdentityAtom));

const skinSubmitIsDisabledAtom = atom<boolean>((ctx) => {
  if (ctx.spy(skins.control.change.statusesAtom).isPending) return true;
  if (ctx.spy(skinsState.control.fileError)) return true;
  return !ctx.spy(skinsState.control.file);
})

const getSkinVariantIsActiveAtom = (t: string) => atom((ctx) => ctx.spy(skinsState.control.variant) === t)

const getIsSelectSkinAtom = atom<boolean>((ctx) => {
  if (!ctx.spy(isIdentityAtom)) return false;

  const state = ctx.spy(skins.fetch.dataAtom)
  if (!state) return false;

  const current = state[0].skin_identifier.toLowerCase()
  const selected = ctx.spy(skinsState.selected)?.identifier.toLowerCase()

  return current !== selected
})

const skinsState = atom(null, "skinsState").pipe(
  withAssign((_, name) => ({
    selected: atom<Nullable<SkinSelected>>(null, `${name}.selected`).pipe(withReset()),
    control: atom(null, `${name}.state`).pipe(
      withAssign((_, name) => ({
        isOpen: atom(false, `${name}.isOpen`).pipe(withReset()),
        file: atom<Nullable<File>>(null, `${name}.file`).pipe(
          withAssign((target) => ({
            reset: action((ctx) => {
              const url = ctx.get(skinsState.control.fileData)?.url
              if (url) URL.revokeObjectURL(url);

              target(ctx, null);

              skinsState.control.fileData.reset(ctx)
              skinsState.control.fileError.reset(ctx)
            })
          }))
        ),
        fileData: atom<Nullable<SkinFileData>>(null, `${name}.fileData`).pipe(withReset()),
        fileError: atom<Nullable<string>>(null, `${name}.fileError`).pipe(withReset()),
        variant: atom<SkinVariant>(SKIN_DEFAULT_VARIANT, `${name}.variant`).pipe(withReset()),
      }))
    )
  }))
)

const skin = atom(null, "skin").pipe(
  withAssign((_, name) => ({
    animation: atom(null, `${name}.animation`).pipe(
      withAssign((_, name) => ({
        type: atom<SkinAnimationType>("idle", `${name}.type`),
        isRotate: atom<boolean>(false, `${name}.isRotate`),
        viewer: atom<Nullable<SkinViewer>>(null, `${name}.viewer`)
      }))
    )
  }))
)

export type SkinAnimationType = "idle" | "run" | "flying";
type SkinAnimation = typeof FlyingAnimation | typeof IdleAnimation | typeof RunningAnimation

const animationClasses: Record<SkinAnimationType, SkinAnimation> = {
  idle: IdleAnimation,
  run: RunningAnimation,
  flying: FlyingAnimation,
};

skin.animation.isRotate.onChange((ctx, state) => {
  let viewer = ctx.get(skin.animation.viewer)
  if (!viewer) return;

  viewer.autoRotate = state
  skin.animation.viewer(ctx, viewer)
})

skin.animation.type.onChange((ctx, state) => {
  let viewer = ctx.get(skin.animation.viewer)
  if (!viewer) return;

  viewer.animation = new animationClasses[state]();
  skin.animation.viewer(ctx, viewer)
})

const skins = atom(null, "skins").pipe(
  withAssign((_, name) => ({
    control: atom(null, `${name}.control`).pipe(
      withAssign(() => ({
        setupSkinData: reatomAsync(async (ctx) => {
          const target = ctx.get(skinsState.control.file)
          if (!target) return null;

          skinsState.control.fileError.reset(ctx)
          skinsState.control.fileData.reset(ctx)

          if (!await validateSkinFile(target)) {
            skinsState.control.fileError(ctx, "invalid-file")
            return null
          }

          const url = URL.createObjectURL(target)

          const info = {
            name: target.name,
            size: target.size,
            url
          }

          skinsState.control.fileData(ctx, info)
        }, {
          name: `${name}.setupSkinData`,
          onReject: (_, e) => logError(e)
        }).pipe(
          withStatusesAtom()
        ),
        set: reatomAsync(async (ctx) => {
          const selectedSkin = ctx.get(skinsState.selected)
          if (!selectedSkin) return null;

          const id = selectedSkin.identifier

          return await ctx.schedule(() => client.put("/server/skin/current", {
            json: { skinName: id },
            retry: 1
          }))
        }, {
          name: `${name}.set`,
          onFulfill: (ctx) => {
            toast.success(translate["player.skin.toast.updated"](), {
              description: translate["player.skin.toast.rejoin"](),
            })
            skins.updateSkinAndHead(ctx)
          },
          onReject: (_, e) => {
            logError(e, { type: "combined" })
            toast.error(getSkinErrorMessage(e))
          }
        }).pipe(
          withStatusesAtom()
        ),
        change: reatomAsync(async (ctx) => {
          const file = ctx.get(skinsState.control.file)
          if (!file || ctx.get(skinsState.control.fileError)) return null

          const payloadFormData = new FormData()

          payloadFormData.append("file", file)
          payloadFormData.append("variant", ctx.get(skinsState.control.variant))

          const result = await client
            .post("/server/skin/upload", {
              body: payloadFormData,
              timeout: 10000
            })

          await ctx.schedule(() => sleep(DEFAULT_SOFT_DELAY));

          return { result }
        }, {
          name: `${name}.change`,
          onFulfill: async (ctx, res) => {
            if (res?.result?.url) {
              toast.success(translate["player.skin.toast.updated"](), {
                description: translate["player.skin.toast.rejoin"](),
              })
            } else {
              toast.info(translate["player.skin.toast.processing"]())
              await sleep(5000)
            }

            skins.updateSkinAndHead(ctx)
            skinsState.control.isOpen.reset(ctx)

            await sleep(DIALOG_DELAY)

            skinsState.control.file.reset(ctx)
            skinsState.control.variant.reset(ctx)
          },
          onReject: (_, e) => {
            logError(e, { type: "combined" })
            toast.error(getSkinErrorMessage(e))
          }
        }).pipe(
          withStatusesAtom()
        )
      }))
    ),
    fetch: reatomAsync(async (ctx, nickname: string) => {
      skins.fetch.dataAtom.reset(ctx);

      return await ctx.schedule(() =>
        client.get("/server/skin/history/{nickname}", { signal: ctx.controller.signal, params: { path: { nickname } } })
      )
    }, {
      name: `${name}.fetch`,
      onFulfill: (ctx, res) => {
        if (!res) return;

        const first = res[0]
        if (!first) return;

        skinsState.selected(ctx, {
          skin_url: first.skin_url!,
          skin_head_url: first.skin_head_url!,
          identifier: first.skin_identifier
        })
      },
      onReject: (_, e) => logError(e)
    }).pipe(
      withDataAtom(null, (_, data) => isEmptyArray(data) ? null : data),
      withStatusesAtom(),
    ),
    updateSkinAndHead: action((ctx) => {
      if (ENVIRONMENT === 'server') return;

      const nickname = ctx.get(playerState.nickname);
      if (!nickname) return;

      spawn(ctx, (sCtx) => skins.fetch(sCtx, nickname));
    }),
    init: action((ctx) => {
      if (ENVIRONMENT === 'server') return;

      const nickname = ctx.get(playerState.nickname)
      if (!nickname) return;

      const isHardwareAccEnabled = ctx.get(appState.inited.hardwaveIsEnabled)
      if (!isHardwareAccEnabled) return;

      skinsState.selected.reset(ctx);

      spawn(ctx, (sCtx) => skins.fetch(sCtx, nickname));
    }, `${name}.init`)
  }))
)

playerState.nickname.onChange((ctx, state) => state && skins.init(ctx))
skinsState.control.file.onChange((ctx, state) => state && skins.control.setupSkinData(ctx))

export const skinModel = () => ({
  skin,
  SKIN_VARIANTS,
  skinsState,
  skins,
  getIsUploadAvailableAtom,
  skinSubmitIsDisabledAtom,
  getSkinVariantIsActiveAtom,
  getIsSelectSkinAtom
})
