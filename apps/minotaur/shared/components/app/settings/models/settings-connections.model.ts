import { currentUserState } from "@/shared/models/current-user/index.model";
import {
  action, atom, reatomAsync, reatomMap, spawn, withAssign,
  withCache, withDataAtom, withErrorAtom, withReset, withStatusesAtom,
  type AsyncCtx,
} from "@reatom/framework";
import { isEmptyArray } from "@/shared/lib/utils";
import { client } from "@/shared/lib/client-wrapper";
import { toast } from "sonner";
import { env } from "@/shared/env";
import { alertDialog } from "@/shared/components/config/alert-dialog/alert-dialog.model";
import { translate } from "@/shared/locales/helpers";

const connectionsStatusAtom = reatomMap<string, boolean>()

const getConnectionStatusAtom = (type: string) => atom((ctx) => ctx.spy(connectionsStatusAtom).get(type) ?? false)

export type ConnectionsAvailablePayload = ExtractApiData<"getServerSocialsAvailable">["data"]
type ConnectionAddPayload = ExtractApiData<"postServerSocialsAdd">["data"]
type AddWrapperResult = { social: string, payload: ConnectionAddPayload } | undefined
type ConnectionFlow = "link" | "dialog"

const CONNECTION_FLOWS: Record<string, ConnectionFlow> = {
  discord: "link",
  telegram: "dialog",
}

const ADD_ERROR_MESSAGES: Record<string, () => string> = {
  SAVED_SOCIAL_EXISTS: () => translate["settings.connections.errors.exists"](),
  SOCIAL_REQUEST_EXISTS: () => translate["settings.connections.errors.request-exists"](),
  SOCIAL_NOT_FOUND: () => translate["settings.connections.errors.not-found"](),
}

const getAddErrorMessage = (error: unknown) => {
  const code = error instanceof Error ? error.message : ""

  return ADD_ERROR_MESSAGES[code]?.() ?? translate["settings.connections.errors.generic"]()
}

const connectionsState = atom(null, "connectionsState").pipe(
  withAssign((_, name) => ({
    isOpen: atom(false, `${name}.isOpen`),
    isProcessing: atom(false, `${name}.isProcessing`),
    processingSocial: atom<Nullable<string>>(null, `${name}.processingSocial`).pipe(withReset()),
    warningIsConfirmed: atom(false, `${name}.warningIsConfirmed`).pipe(withReset()),
    payload: atom<Nullable<ConnectionAddPayload>>(null, `${name}.payload`).pipe(withReset())
  }))
)

const connectionIsProcessingAtom = (social: string) => atom((ctx) =>
  (ctx.spy(connectionsState.processingSocial) === social) && ctx.spy(connectionsState.isProcessing)
)

const addSocial = reatomAsync(async (ctx, social: string) => {
  return await ctx.schedule(() => client
    .post("/server/socials/add", { json: { social } })
  )
}, "connections.add")

const addWrapper = reatomAsync<[AsyncCtx, social: string], AddWrapperResult>(async (ctx, social) => {
  const flow = CONNECTION_FLOWS[social]
  if (!flow) return;

  const processingSocial = ctx.get(connectionsState.processingSocial)
  const isProcessing = ctx.get(connectionsState.isProcessing)

  if (isProcessing && processingSocial !== social) return

  const warningIsConfirmed = ctx.get(connectionsState.warningIsConfirmed)

  if (!warningIsConfirmed) {
    alertDialog.open(ctx, {
      title: flow === "link"
        ? translate["settings.connections.discord-warning"]()
        : translate["settings.connections.continue-confirm"](),
      onConfirm: action((ctx) => {
        connectionsState.warningIsConfirmed(ctx, true)
        addWrapper(ctx, social)
      }),
      confirmLabel: translate["settings.connections.go"]()
    })

    return
  }

  if (flow === "link") {
    const opened = window.open(`${env.VITE_API_URL}/server/socials/add/${social}`)

    connectionsState.warningIsConfirmed.reset(ctx)

    if (!opened) toast.error(translate["settings.connections.popup-blocked"]())
    return
  }

  connectionsState.isOpen(ctx, true)
  connectionsState.isProcessing(ctx, true)
  connectionsState.processingSocial(ctx, social)

  return {
    social,
    payload: await addSocial(ctx, social),
  }
}, {
  name: "connections.addWrapper",
  onFulfill: (ctx, res) => {
    if (!res) return

    connectionsState.isProcessing(ctx, false)
    connectionsState.warningIsConfirmed.reset(ctx)
    connectionsState.payload(ctx, res.payload)

    spawn(ctx, (spawnCtx) => {
      connections.fetchList.cacheAtom.reset(spawnCtx)
      connections.fetchList(spawnCtx)
      connections.fetchAvailable.cacheAtom.reset(spawnCtx)
      connections.fetchAvailable(spawnCtx)
    })
  },
  onReject: (ctx, e) => {
    connectionsState.isProcessing(ctx, false)

    const message = getAddErrorMessage(e)
    addWrapper.errorAtom(ctx, new Error(message))

    if (!ctx.get(connectionsState.isOpen)) toast.error(message)
  },
}).pipe(
  withStatusesAtom(),
  withErrorAtom()
)

const removeSocial = reatomAsync(async (ctx, type: string) => {
  connectionsStatusAtom.getOrCreate(ctx, type, () => true)

  try {
    await ctx.schedule(() => client.delete("/server/socials/{social}", {
      params: { path: { social: type } },
    }))

    return { social: type }
  } catch {
    connectionsStatusAtom.delete(ctx, type)
    toast.error(translate["settings.connections.remove-error"]())

    return null
  }
}, {
  name: "connections.remove",
  onFulfill: (ctx, res) => {
    if (!res) return

    connectionsStatusAtom.delete(ctx, res.social)
    connections.fetchList.cacheAtom.reset(ctx)
    connections.fetchList.dataAtom(ctx, (state) => state.filter(t => t.social !== res.social))

    spawn(ctx, (spawnCtx) => {
      connections.fetchAvailable.cacheAtom.reset(spawnCtx)
      connections.fetchAvailable(spawnCtx)
    })
  },
}).pipe(
  withStatusesAtom()
)

const removeBefore = reatomAsync(async (ctx, type: string) => {
  alertDialog.open(ctx, {
    title: translate["settings.connections.remove-confirm"](),
    description: translate["settings.connections.remove-description"](),
    confirmLabel: translate["settings.connections.remove"](),
    onConfirm: action((ctx) => {
      spawn(ctx, (spawnCtx) => removeSocial(spawnCtx, type))
    }),
    withPending: false,
  })
}, "connections.removeBefore")

const onClose = action((ctx) => {
  if (ctx.get(connectionsState.isProcessing)) return

  connectionsState.warningIsConfirmed.reset(ctx)
  connectionsState.processingSocial.reset(ctx)
  connectionsState.payload.reset(ctx)
  addWrapper.errorAtom.reset(ctx)
}, "connections.onClose")

const connectionsControl = atom(null, "connectionsControl").pipe(
  withAssign(() => ({
    addWrapper,
    add: addSocial,
    remove: removeSocial,
    removeBefore,
    onClose,
  }))
)

const connections = atom(null, "connections").pipe(
  withAssign((_, name) => ({
    fetchList: reatomAsync(async (ctx) => {
      const currentUser = ctx.get(currentUserState);
      if (!currentUser) return [];

      return await ctx.schedule(() => client
        .get("/server/socials/list/{nickname}", {
          params: {
            query: { variant: "private" },
            path: { nickname: currentUser.nickname }
          },
          signal: ctx.controller.signal
        })
      );
    }, {
      name: `${name}.fetchList`
    }).pipe(
      withDataAtom([]),
      withCache({ swr: false }),
      withStatusesAtom(),
      withErrorAtom()
    ),
    fetchAvailable: reatomAsync(async (ctx) => {
      return await ctx.schedule(() => client
        .get("/server/socials/available", {
          signal: ctx.controller.signal
        })
      )
    }, {
      name: `${name}.fetchAvailable`
    }).pipe(
      withDataAtom([], (_, data) => isEmptyArray(data) ? null : data),
      withCache({ swr: false }),
      withStatusesAtom(),
      withErrorAtom()
    ),
  }))
)

connectionsState.isOpen.onChange((ctx, state) => !state && connectionsControl.onClose(ctx))

export const connectionsModel = () => {
  return {
    connectionsControl,
    connections,
    connectionIsProcessingAtom,
    getConnectionStatusAtom,
    connectionsState
  }
}
