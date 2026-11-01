import { DEFAULT_SOFT_DELAY } from "@/shared/consts";
import { client } from "@/shared/lib/client-wrapper";
import { isError } from "@/shared/lib/utils";
import { invariant } from "@/shared/lib/utils";
import { logError } from "@/shared/lib/log";
import { createWsUrl } from "@/shared/lib/helpers";
import { getApiHost } from "@/shared/lib/helpers";
import { reatomAsync, sleep, withCache, withErrorAtom, withStatusesAtom } from "@reatom/framework";
import { action, atom, batch, type Ctx } from "@reatom/framework";
import { reatomMap, withAssign, withReset } from "@reatom/framework";
import { toast } from "sonner";
import * as z from "zod";

type ChatEventVariant = 'create' | 'edit' | 'delete'

export type ChatItem = {
  id: number
  created_at: string
  edited: boolean
  edited_at: string | null
  message: string
  nickname: string,
  avatar: string,
  views: number
}

type ChatEvent<T = unknown> = {
  event: ChatEventVariant
  data: T
}

const chatState = atom(null).pipe(
  withAssign((_, name) => ({
    ws: atom<WebSocket | null>(null, `${name}.ws`).pipe(withReset()),
    data: reatomMap<number, ChatItem>(new Map(), `${name}.data`)
  }))
)

const url = createWsUrl({
  path: "/privated/chat/subscribe",
  host: getApiHost(),
  isSecure: import.meta.env.PROD,
  port: import.meta.env.DEV ? 5104 : undefined,
});

export const chatWs = atom(null, "chatWs").pipe(
  withAssign(() => ({
    initWs: action((ctx) => {
      chatWs.closeWs(ctx)
      chatState.ws(ctx, new WebSocket(url))
    }),
    closeWs: action((ctx) => {
      const current = ctx.get(chatState.ws)
      if (!current) return;

      current.close()
      chatState.ws.reset(ctx)
    }),
    getWsInstance: action(async (ctx, { withValidation = true } = {}): Promise<WebSocket> => {
      const socket = ctx.get(chatState.ws)
      invariant(socket, 'Socket is not defined')

      if (!withValidation) return socket;

      if (socket.readyState === WebSocket.CLOSING || socket.readyState === WebSocket.CLOSED) {
        throw new Error("SOCKET_DEAD");
      }

      if (socket.readyState === WebSocket.CONNECTING) {
        try {
          await Promise.race([
            new Promise((resolve) => {
              return socket.addEventListener('open', resolve, { once: true })
            }),
            sleep(DEFAULT_SOFT_DELAY).then(() => {
              throw new Error("TIMEOUT");
            })
          ]);
        } catch {
          throw new Error("SOCKET_NOT_READY");
        }
      }

      if (socket.readyState !== WebSocket.OPEN) {
        throw new Error("SOCKET_NOT_READY");
      }

      return socket;
    }),
    deleteItem: action((ctx, data: unknown) => {
      const di = data as { id: number }
      chatState.data.delete(ctx, di.id)
    }),
    addItem: action((ctx, data: unknown) => {
      const ci = data as ChatItem
      chatState.data.set(ctx, ci.id, ci)
    }),
    editItem: action((ctx, data: unknown) => {
      const ei = data as ChatItem
      chatState.data.set(ctx, ei.id, ei)
    })
  }))
)

const EVENTS: Record<ChatEventVariant, (ctx: Ctx, data: unknown) => void> = {
  "create": (ctx, data) => chatWs.addItem(ctx, data),
  "delete": (ctx, data) => chatWs.deleteItem(ctx, data),
  "edit": (ctx, data) => chatWs.editItem(ctx, data)
}

chatState.ws.onChange((ctx, state) => {
  if (!state) return;

  const handleMessage = (event: MessageEvent) => {
    try {
      const msg = JSON.parse(event.data) as ChatEvent;
      const cb = EVENTS[msg.event];

      if (cb) {
        cb(ctx, msg.data);
      }
    } catch (e) {
      console.error("Parse error", e);
    }
  };

  const handleClose = () => { console.log('Socket closed') };
  const handleOpen = () => { console.log('Socket opened') };

  state.addEventListener('message', handleMessage);
  state.addEventListener('close', handleClose);
  state.addEventListener('open', handleOpen);

  return () => {
    state.removeEventListener('message', handleMessage);
    state.removeEventListener('close', handleClose);
    state.removeEventListener('open', handleOpen);
  };
})

export type ChatItemViews = {
  created_at: Date;
  id: number;
  nickname: string;
  message_id: number;
  avatar: string
}

export const chatHistoryState = atom(null, "chatHistoryState").pipe(
  withAssign((_, name) => ({
    data: atom<ChatItem[] | null>((ctx) => Array.from(ctx.spy(chatState.data).values()), `${name}.data`),
    meta: atom<PaginatedMeta | null>(null, `${name}.meta`)
  }))
)
export const chatHistory = atom(null, "chatHistory").pipe(
  withAssign((_, name) => ({
    fetch: reatomAsync(async (ctx) => {
      return await ctx.schedule(() =>
        client<{ data: ChatItem[], meta: PaginatedMeta }>("privated/chat/list").exec()
      )
    }, {
      name: `${name}.fetch`,
      onFulfill: (ctx, res) => {
        batch(ctx, () => {
          chatState.data(ctx, new Map(res.data.map((e) => [e.id, e])))
          chatHistoryState.meta(ctx, res.meta)
        })
      },
      onReject: (_, e) => {
        logError(e)

        if (isError(e)) {
          toast.error("Что-то пошло не так", { description: e.message })
        }
      }
    }).pipe(
      withStatusesAtom(),
      withErrorAtom()
    )
  }))
)

export const msgState = atom(null, "msgState").pipe(
  withAssign((_, name) => ({
    create: atom(null, `${name}.create`).pipe(
      withAssign((_, name) => ({
        msg: atom<string>("", `${name}.msg`).pipe(withReset())
      }))
    ),
    edit: atom(null, `${name}.edit`).pipe(
      withAssign((_, name) => ({
        msgId: atom<Nullable<number>>(null, `${name}.msgId`).pipe(withReset()),
        newMsg: atom<Nullable<string>>(null, `${name}.newMsg`).pipe(withReset()),
        oldMsg: atom<string>("", `${name}.oldMsg`).pipe(withReset())
      }))
    )
  }))
)

export const getChatItemIsEditAtom = (id: number) => atom((ctx) => ctx.spy(msgState.edit.msgId) === id);

const equalSchema = z.object({ oldMsg: z.string(), newMsg: z.string() })

const chatItemViewsAtom = reatomMap<number, ChatItemViews[]>()
export const getChatItemViews = (id: number) => atom((ctx) => ctx.spy(chatItemViewsAtom).get(id) ?? [])

export const msg = atom(null, "msg").pipe(
  withAssign((_, name) => ({
    views: atom(null, `${name}.views`).pipe(
      withAssign((_, name) => ({
        fetch: reatomAsync(async (ctx, id: number) => {
          return await ctx.schedule(() =>
            client<{ data: ChatItemViews[], meta: PaginatedMeta }>(`privated/chat/${id}/views`).exec()
          )
        }, {
          name: `${name}.fetch`,
          onFulfill: (ctx, res) => {
            chatItemViewsAtom(ctx, new Map(res.data.map(e => [e.message_id, res.data])))
          },
          onReject: (_, e) => {
            logError(e);

            if (isError(e)) {
              toast.error("Что-то пошло не так", { description: e.message })
            }
          }
        }).pipe(
          withStatusesAtom(),
          withErrorAtom(),
          withCache({ swr: false })
        )
      }))
    ),
    utils: atom(null, `${name}.utils`).pipe(
      withAssign((_, name) => ({
        copyText: action(async (ctx, id: number) => {
          const history = ctx.get(chatHistoryState.data)
          if (!history) {
            console.warn("Chat history not found")
            return;
          }

          const msg = history.find(m => m.id === id);
          if (!msg) {
            console.warn("Message not found")
            return;
          }

          await navigator.clipboard.writeText(msg.message);
          toast.success("Сообщение скопировано")
        }, `${name}.copyText`)
      }))
    ),
    create: atom(null, `${name}.create`).pipe(
      withAssign((_, name) => ({
        submit: reatomAsync(async (ctx) => {
          const socket = await chatWs.getWsInstance(ctx);

          const payload: ChatEvent<{ message: string }> = {
            event: "create",
            data: { message: ctx.get(msgState.create.msg) }
          }

          const payloadStr = JSON.stringify(payload)
          socket.send(payloadStr)
        }, {
          name: `${name}.submit`,
          onFulfill: (ctx) => {
            msg.delete.atomsReset(ctx)
          },
          onReject: (_, e) => {
            logError(e);

            if (isError(e)) {
              toast.error("Сообщение не отправлено", { description: e.message })
            }
          }
        }).pipe(
          withStatusesAtom(),
          withErrorAtom()
        )
      }))
    ),
    edit: atom(null, `${name}.edit`).pipe(
      withAssign((_, name) => ({
        start: action((ctx, id) => {
          const currentMessage = ctx.get(chatHistoryState.data)?.find(d => d.id === id)?.message
          invariant(currentMessage, "Current message is not defined")

          msgState.edit.msgId(ctx, id)
          msgState.edit.oldMsg(ctx, currentMessage)
        }),
        end: action((ctx) => {
          msgState.edit.msgId.reset(ctx)
          msgState.edit.newMsg.reset(ctx)
          msgState.edit.oldMsg.reset(ctx)
        }),
        msgIsValid: atom<boolean>((ctx) =>
          equalSchema.safeParse({
            oldMsg: ctx.spy(msgState.edit.oldMsg),
            newMsg: ctx.spy(msgState.edit.newMsg)
          }).success
        ),
        submitIsValid: atom((ctx): boolean => {
          const isIdentity = ctx.spy(msg.edit.msgIsValid)

          if (!isIdentity) {
            const newMsg = ctx.get(msgState.edit.newMsg);
            return z.string().min(1).safeParse(newMsg).success
          }

          return false
        }),
        atomsReset: action((ctx) => {
          msgState.edit.msgId.reset(ctx)
          msgState.edit.newMsg.reset(ctx)
          msgState.edit.oldMsg.reset(ctx)
        }),
        submit: reatomAsync(async (ctx) => {
          const id = ctx.get(msgState.edit.msgId);
          if (!id) throw new Error("Id is not defined");

          const message = ctx.get(msgState.edit.newMsg)
          if (!message) throw new Error("message is not defined");

          const socket = await chatWs.getWsInstance(ctx)

          const payload: ChatEvent<{ id: number, message: string }> = {
            event: "edit",
            data: { id, message }
          }

          const payloadStr = JSON.stringify(payload)
          socket.send(payloadStr)
        }, {
          name: `${name}.submit`,
          onFulfill: (ctx) => {
            msg.edit.atomsReset(ctx)
          },
          onReject: (_, e) => {
            logError(e);

            if (isError(e)) {
              toast.error("Сообщение не отправлено", { description: e.message })
            }
          }
        }).pipe(
          withStatusesAtom(),
          withErrorAtom()
        )
      }))
    ),
    delete: atom(null, `${name}.delete`).pipe(
      withAssign((_, name) => ({
        atomsReset: action((ctx) => {
          msgState.create.msg.reset(ctx)
        }, `${name}.atomsReset`),
        submit: reatomAsync(async (ctx, id: number) => {
          const socket = await chatWs.getWsInstance(ctx)

          const payload: ChatEvent<{ id: number }> = {
            event: "delete",
            data: { id }
          }

          const payloadStr = JSON.stringify(payload)
          socket.send(payloadStr)
        }, {
          name: `${name}.submit`,
          onReject: (_, e) => {
            if (isError(e)) {
              toast.error("Сообщение не удалено", { description: e.message })
            }
          }
        }).pipe(
          withStatusesAtom(),
          withErrorAtom()
        )
      }))
    )
  }))
)
