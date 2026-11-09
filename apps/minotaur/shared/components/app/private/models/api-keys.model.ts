import { DIALOG_DELAY } from "@/shared/consts";
import { client } from "@/shared/lib/client-wrapper";
import { logError } from "@/shared/lib/log";
import {
  action, atom, reatomAsync, sleep,
  withAssign, withErrorAtom, withReset, withStatusesAtom,
  type Ctx
} from "@reatom/framework";
import { actions } from "./actions.model";

export const apiKeysState = atom(null, "apiKeysState").pipe(
  withAssign((_, name) => ({
    data: atom<ApiKeys | null>(null, `${name}.data`).pipe(withReset()),
    duration: atom(2592000, `${name}.duration`).pipe(withReset()),
    description: atom("", `${name}.description`).pipe(withReset()),
    afterCreate: atom(null, `${name}.afterCreate`).pipe(
      withAssign((_, name) => ({
        isOpen: atom(false, `${name}.isOpen`),
        state: atom<ApiKeyCreatePayload | null>(null, `${name}.state`).pipe(withReset()),
      }))
    )
  }))
)

type ApiKeysResponse = ExtractApiData<"getPrivatedApiKeysList">["data"]
export type ApiKey = Omit<ApiKeysResponse[number], "duration"> & { duration: number | null }
type ApiKeys = ApiKey[]

type ApiKeyCreatePayload = ExtractApiData<"postPrivatedApiKeysCreate">["data"];

export const apiKeys = atom(null, "apiKeys").pipe(
  withAssign((_, name) => ({
    fetch: reatomAsync(async (ctx) => {
      return await ctx.schedule(() =>
        client.get("/privated/api/keys/list", { signal: ctx.controller.signal })
      )
    }, {
      name: `${name}.fetch`,
      onFulfill: (ctx, res) => {
        apiKeysState.data(ctx, res)
      },
    }).pipe(
      withStatusesAtom(),
      withErrorAtom(),
    ),
    create: reatomAsync(async (ctx) => {
      const json: ExtractApiBody<"postPrivatedApiKeysCreate">["content"]["application/json"] = {
        duration: ctx.get(apiKeysState.duration),
        description: ctx.get(apiKeysState.description),
      }

      const result = await client
        .post("/privated/api/keys/create", { json })

      return { result };
    }, {
      name: `${name}.create`,
      onFulfill: (ctx, res) => {
        apiKeysState.data(ctx, (state) => state ? [...state, res.result] : [res.result])

        apiKeysState.description.reset(ctx);
        apiKeysState.duration.reset(ctx);

        apiKeysState.afterCreate.isOpen(ctx, true)
        apiKeysState.afterCreate.state(ctx, res.result)
      },
      onReject: (_, e) => {
        logError(e, { type: "toast" })
      },
    }).pipe(
      withStatusesAtom(),
      withErrorAtom()
    ),
    delete: reatomAsync(async (_, id: ApiKey["id"], cb?: (ctx: Ctx) => void) => {
      const result = await client
        .delete("/privated/api/keys/{id}", { params: { path: { id } } })

      return { result, id, cb };
    }, {
      name: `${name}.delete`,
      onFulfill: (ctx, res) => {
        apiKeysState.data(ctx, (state) => {
          if (!state) return null;
          return state.filter((key) => key.id !== res.id)
        })

        res.cb?.(ctx)
      },
      onReject: (_, e) => {
        logError(e, { type: "toast" })
      },
    }).pipe(
      withStatusesAtom(),
      withErrorAtom()
    ),
    afterCreate: atom(null, `${name}.afterCreate`).pipe(
      withAssign((_, name) => ({
        close: action(async (ctx) => {
          apiKeysState.afterCreate.isOpen(ctx, false)
          await sleep(DIALOG_DELAY)
          apiKeysState.afterCreate.state.reset(ctx)
        }, `${name}.close`),
        handle: action((ctx, value: boolean) => {
          if (!value) {
            apiKeys.afterCreate.close(ctx);
            apiKeysState.afterCreate.isOpen(ctx, value)
            actions.goBack(ctx);
          } else {
            apiKeysState.afterCreate.isOpen(ctx, value)
          }
        })
      }))
    )
  }))
)
