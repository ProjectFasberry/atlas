import { client } from "@/shared/lib/client-wrapper"
import { logError } from "@/shared/lib/log"
import {
  reatomAsync, spawn, withAbort, withCache, withDataAtom, withErrorAtom, withStatusesAtom,
  reatomMap, reatomSet, sleep, withAssign, withConcurrency, withReset,
  action, atom, batch,
  type Action, type AtomMut, type Ctx, type SetAtom
} from "@reatom/framework"
import { withLocalStorage } from "@reatom/persist-web-storage"
import { toast } from "sonner"
import { notifyAboutRestrictRole } from "./actions.model"
import { DEFAULT_SOFT_DELAY } from "@/shared/consts"
import { invariant } from "@/shared/lib/utils"
import { alertDialog } from "@/shared/components/config/alert-dialog/alert-dialog.model"
import { createViewerModel } from "@/shared/models/shared.model"
import { env } from "@/shared/env"

export type PrivatedUser = PrivatedUsersPayload["data"][number]
export type PrivatedUsersPayload = ExtractApiData<"getPrivatedUserList">["data"]

type UsersQuery = ExtractApiParams<"getPrivatedUserList">["query"];
type UsersSort = NonNullable<UsersQuery["sort"]>

export const { Component: UsersViewer, inViewAtom: usersListInView } = createViewerModel({
  name: "users-list",
})

export const usersState = atom(null, "usersState").pipe(
  withAssign((_, name) => ({
    filters: atom(null).pipe(
      withAssign(() => ({
        searchQuery: atom<Nullable<string>>(null),
        asc: atom(false).pipe(withLocalStorage({ key: "privated-users-asc" })),
        sortBy: atom<UsersSort>("created_at").pipe(withLocalStorage({ key: "privated-users-sort" })),
        startCursor: atom<Nullable<string>>(null).pipe(withReset()),
        endCursor: atom<Nullable<string>>(null).pipe(withReset())
      }))
    ),
    data: reatomMap<string, PrivatedUsersPayload["data"][number]>(new Map(), `${name}.data`),
    meta: atom<PrivatedUsersPayload["meta"] | null>(null, `${name}.meta`)
  }))
)

usersState.filters.sortBy.onChange((ctx) => users.refetchAll(ctx))
usersState.filters.asc.onChange((ctx) => users.refetchAll(ctx))

export const usersDataArrAtom = atom<PrivatedUsersPayload["data"]>((ctx) => Array.from(ctx.spy(usersState.data).values()))

async function getUsers(query: UsersQuery) {
  return client.get("/privated/user/list", { params: { query } })
}

const getParams = action((ctx): UsersQuery => ({
  limit: 32,
  searchQuery: ctx.get(usersState.filters.searchQuery) ?? undefined,
  asc: ctx.get(usersState.filters.asc),
  sort: ctx.get(usersState.filters.sortBy),
  startCursor: ctx.get(usersState.filters.startCursor) ?? undefined,
  endCursor: ctx.get(usersState.filters.endCursor) ?? undefined
}))

export const users = atom(null, "users").pipe(
  withAssign((_, name) => ({
    searchQueryChangeEvent: action(async (ctx, e: React.ChangeEvent<HTMLInputElement>) => {
      usersState.filters.searchQuery(ctx, e.target.value)
      await ctx.schedule(() => sleep(DEFAULT_SOFT_DELAY))
      users.refetchAll(ctx)
    }).pipe(
      // A newer keystroke cancels the pending debounce+fetch of the previous one.
      withConcurrency("last-in-win")
    ),
    fetch: reatomAsync(async (ctx) => {
      return await ctx.schedule(() => getUsers(getParams(ctx)))
    }, {
      name: `${name}.fetch`,
      onFulfill: (ctx, res) => {
        usersState.data(ctx, new Map(res.data.map((d) => [d.nickname, d])))
        usersState.meta(ctx, res.meta)
      },
      onReject: (_, e) => notifyAboutRestrictRole(e)
    }).pipe(
      withStatusesAtom(),
      withCache({ swr: false }),
      withAbort()
    ),
    refetchAll: action((ctx) => {
      // Searching or changing the sort invalidates an in-flight next page:
      // its cursor belongs to the previous query.
      users.update.abort(ctx)
      users.update.errorAtom.reset(ctx)
      usersState.filters.endCursor.reset(ctx)
      usersState.filters.startCursor.reset(ctx)
      users.fetch.cacheAtom.reset(ctx)
      users.fetch(ctx);
    }),
    update: reatomAsync(async (ctx) => {
      return await ctx.schedule(() => getUsers(getParams(ctx)))
    }, {
      name: `${name}.update`,
      onFulfill: (ctx, res) => {
        usersState.data(ctx, (state) => new Map([...state, ...res.data.map(d => [d.nickname, d] as const)]))
        usersState.meta(ctx, res.meta)
      },
      onReject: (ctx, e) => {
        // The cursor is opaque and can outlive a deploy or a sort change.
        // Falling back to the first page is better than a stuck list.
        if (e instanceof Error && e.message === "INVALID_CURSOR") {
          users.refetchAll(ctx)
          return
        }

        notifyAboutRestrictRole(e)
      }
    }).pipe(
      withStatusesAtom(),
      withErrorAtom(),
      withAbort(),
      // A sentinel that stays in view would otherwise fire the same cursor twice.
      withConcurrency("first-in-win")
    ),
    fetchSingle: reatomAsync(async (ctx, nickname: string) => {
      return await ctx.schedule(() =>
        client.get("/privated/user/{nickname}", { params: { path: { nickname } } })
      )
    }, `${name}.fetchSingle`).pipe(
      withDataAtom(),
      withCache({ swr: false }),
      withStatusesAtom(),
      withAbort()
    ),
    rejectSkin: reatomAsync(async (ctx, args: { nickname: string, skinName: string }) => {
      const result = await client.delete("/privated/user/{nickname}/skin", {
        params: { path: { nickname: args.nickname } },
        json: { skinName: args.skinName },
      })

      const data = await client.get("/privated/user/{nickname}", {
        params: { path: { nickname: args.nickname } },
      })
      users.fetchSingle.dataAtom(ctx, data)

      return result
    }, {
      name: `${name}.rejectSkin`,
      onFulfill: () => toast.success("Скин отклонён"),
      onReject: (_, e) => logError(e, { type: "combined" }),
    }).pipe(withStatusesAtom()),
    rejectAllSkins: reatomAsync(async (ctx, nickname: string) => {
      const result = await client.delete("/privated/user/{nickname}/skins", {
        params: { path: { nickname } },
      })

      const data = await client.get("/privated/user/{nickname}", {
        params: { path: { nickname } },
      })
      users.fetchSingle.dataAtom(ctx, data)

      return result
    }, {
      name: `${name}.rejectAllSkins`,
      onFulfill: () => toast.success("Скины отклонены"),
      onReject: (_, e) => logError(e, { type: "combined" }),
    }).pipe(withStatusesAtom())
  }))
)

const USERS_GROUP = ["restricts", "auth"] as const
const USERS_ROLES_TYPE = ["change_role", "reset"] as const;

type UsersControlPayload = ExtractApiData<"postPrivatedUserRestrictCreate">["data"]
type UsersControlRolesType = typeof USERS_ROLES_TYPE[number]
type UsersGroupExtended = typeof USERS_GROUP[number]

export const usersRestrictState = atom(null, "_usersRestrictState").pipe(
  withAssign((_, name) => ({
    nicknames: reatomSet<string>([], `${name}.nicknames`).pipe(withReset()),
    targetRoleId: atom<Nullable<number>>(null, `${name}.targetRoleId`).pipe(withReset()),
    fields: atom(null, `${name}.fields`).pipe(
      withAssign((_, name) => ({
        reason: atom<Nullable<string>>(null, `${name}.reason`).pipe(withReset()),
        duration: atom<Nullable<string>>(null, `${name}.duration`).pipe(withReset()),
      }))
    ),
    isOpen: atom(false, `${name}.isOpen`),
    selectedId: atom<Nullable<string>>(null, `${name}.selectedId`).pipe(withReset()),
    isCheckedAll: atom(false, `${name}.isCheckedAll`).pipe(withReset()),
    selectedUser: atom<Nullable<string>>(null, `${name}.selectedUser`).pipe(withReset())
  }))
)
export const usersRestrict = atom(null, "_usersRestrict").pipe(
  withAssign((_, name) => ({
    submit: reatomAsync(async (ctx, event: string) => {
      const nicknames = [...ctx.get(usersRestrictState.nicknames)]

      const body: ExtractApiBody<"postPrivatedUserRestrictCreate">["content"]["application/json"] = {
        type: event as "ban" | "unban" | "mute" | "unmute" | "kick",
        nicknames,
        args: {
          reason: ctx.get(usersRestrictState.fields.reason) ?? undefined,
          time: ctx.get(usersRestrictState.fields.duration) ?? undefined
        }
      }

      const result = await client
        .post("/privated/user/restrict/create", { timeout: 20000, json: body  })

      return { nicknames, result }
    }, {
      name: `${name}.submit`,
      onFulfill: (ctx, res) => {
        if (!res) return;

        const { nicknames, result } = res;

        if (!result.ok) {
          console.warn("Is not updated", result)
          return;
        }

        // The list has no restriction column; the badge comes from the API on
        // the next refetch, so there is nothing to patch locally here.
        usersRestrictState.isOpen(ctx, false)
        usersRestrictState.fields.reason.reset(ctx)
        usersRestrictState.fields.duration.reset(ctx)
        usersRestrictState.nicknames.reset(ctx)
      },
      onReject: (ctx, e) => {
        usersRestrictState.nicknames.reset(ctx)
        notifyAboutRestrictRole(e)
        logError(e, { type: "combined" })
      }
    }).pipe(
      withStatusesAtom()
    ),
    handleEvent: action((ctx, event: string, nicknames: string[]) => {
      for (const nickname of nicknames) {
        usersRestrictState.nicknames.add(ctx, nickname);
      }

      spawn(ctx, (spawnCtx) => usersRestrict.submit(spawnCtx, event))
    }),
    resetAll: action((ctx) => {
      usersRestrictState.nicknames.reset(ctx)
      usersRestrictState.targetRoleId.reset(ctx)
    }),
    select: {
      single: action((ctx, value: boolean | string, nickname: string) => {
        if (typeof value !== 'boolean') return;

        if (value) {
          usersRestrictState.nicknames.add(ctx, nickname)
        } else {
          usersRestrictState.nicknames.delete(ctx, nickname)
        }
      }),
      all: action((ctx, value: boolean) => {
        if (value) {
          const users = ctx.get(usersDataArrAtom);
          if (!users || users.length === 0) throw new Error("Users is not defined")

          const nicknames = users.map((user) => user.nickname)

          batch(ctx, () => {
            usersRestrictState.nicknames(ctx, new Set(nicknames))
            usersRestrictState.isCheckedAll(ctx, true);
          })
        } else {
          batch(ctx, () => {
            usersRestrictState.nicknames.reset(ctx)
            usersRestrictState.isCheckedAll.reset(ctx)
          })
        }
      })
    }
  }))
)
export const usersRoles = atom(null, "_usersRoles").pipe(
  withAssign((_, name) => ({
    fetch: reatomAsync(async (ctx) => {
      return await ctx.schedule(() => client.get("/privated/role/list", { signal: ctx.controller.signal }))
    }, {
      name: `${name}.fetch`,
      onReject: (_, e) => notifyAboutRestrictRole(e)
    }).pipe(
      withDataAtom(),
      withCache({ swr: false }),
      withStatusesAtom(),
      withAbort()
    ),
    submit: reatomAsync(async (ctx, type: UsersControlRolesType, targetRoleId: number) => {
      const nicknames = [...ctx.get(usersRestrictState.nicknames)]

      const body: ExtractApiBody<"postPrivatedUserRoles">["content"]["application/json"] = {
        type, nicknames, targetRoleId
      }

      const result = await client
        .post("/privated/user/roles", { json: body })

      return { nicknames, targetRoleId, result }
    }, {
      name: `${name}.submit`,
      onEffect: (ctx, [type, targetRoleId]) => {
        if (type !== "change_role") return;

        const role = ctx.get(usersRoles.fetch.dataAtom)?.find((item) => item.id === targetRoleId);
        if (!role) return;

        updateUsersData(ctx, [...ctx.get(usersRestrictState.nicknames)], { role });
      },
      onFulfill: (ctx, res) => {
        if (!res) return;

        const { result, nicknames, targetRoleId } = res;

        if (!result.ok) {
          toast.error("Is not updated")
          users.refetchAll(ctx)
          return;
        }

        if (nicknames.length <= 2) {
          const targetRoleName = ctx.get(usersRoles.fetch.dataAtom)?.find(role => role.id === targetRoleId)?.name;
          invariant(targetRoleName, "Target role name is not defined")

          updateUsersData(ctx, nicknames, { role: { id: targetRoleId, name: targetRoleName } })
        } else {
          users.refetchAll(ctx)
        }

        usersRestrict.resetAll(ctx)
        usersRestrictState.selectedId.reset(ctx)
      },
      onReject: (ctx, e) => {
        users.refetchAll(ctx)
        notifyAboutRestrictRole(e)
        usersRestrict.resetAll(ctx)
        logError(e, { type: "combined" })
      }
    }).pipe(
      withStatusesAtom()
    ),
    before: action((ctx, nicknames: string[], { type }: { type: UsersControlRolesType }) => {
      for (const nickname of nicknames) {
        usersRestrictState.nicknames.add(ctx, nickname);
      }

      const targetRoleId = ctx.get(usersRestrictState.targetRoleId)
      invariant(targetRoleId, "Target role id is not defined")

      usersRoles.submit(ctx, type, targetRoleId)
    }, `${name}.before`)
  }))
)

export type Role = { name: string, id: number }

export const usersLengthAtom = atom((ctx) => ctx.spy(usersDataArrAtom)?.length ?? 0)
export const usersSelectedLengthAtom = atom((ctx) => ctx.spy(usersRestrictState.nicknames).size ?? 0)

const updateUsersData = action((
  ctx,
  nicknames: string[],
  updates: Partial<PrivatedUser>
) => {
  users.fetch.cacheAtom.reset(ctx);

  usersState.data(ctx, (state) => {
    const updated: typeof state = new Map();

    for (const [key, value] of state) {
      const targets = nicknames.includes(value.nickname);
      updated.set(key, targets ? { ...value, ...updates } : value);
    }

    return updated
  })
})

export const usersSelectedOverAtom = atom((ctx) => ctx.spy(usersSelectedLengthAtom) >= 2)

usersRestrictState.selectedId.onChange((ctx, state) => !state &&
  usersRestrictState.targetRoleId.reset(ctx)
)
usersState.meta.onChange((ctx, state) => state &&
  usersState.filters.endCursor(ctx, (prev) => state.endCursor ? state.endCursor : prev)
)
export const userIsSelectedAtom = (nickname: string) => atom((ctx) => ctx.spy(usersRestrictState.selectedUser) === nickname)
export const isCheckedAtom = (nickname: string) => atom((ctx) => ctx.spy(usersRestrictState.nicknames).has(nickname))

//#region users management
export const usersAuthState = atom(null, "usersAuthState").pipe(
  withAssign((_, name) => ({
    deleteUser: atom(null, `${name}.deleteUser`).pipe(
      withAssign((_, name) => ({
        isOpen: atom(false, `${name}.isOpen`),
        nickname: atom("", `${name}.nickname`).pipe(withReset()),
        isConfirmed: atom(false, `${name}.isConfirmed`)
      }))
    ),
    createUser: atom(null, `${name}.createUser`).pipe(
      withAssign((_, name) => ({
        isOpen: atom(false, `${name}.isOpen`),
        nickname: atom("", `${name}.nickname`).pipe(withReset()),
        password: atom("", `${name}.password`).pipe(withReset()),
      }))
    ),
    invite: atom(null, `${name}.invite`).pipe(
      withAssign((_, name) => ({
        isOpen: atom(false, `${name}.isOpen`),
        nickname: atom("", `${name}.nickname`).pipe(withReset()),
        link: atom<Nullable<string>>(null, `${name}.link`).pipe(withReset()),
      }))
    )
  }))
)

export const usersAuth = atom(null, "usersAuth").pipe(
  withAssign((_, name) => ({
    /** Opens the delete dialog for one row from the context menu. */
    requestDelete: action((ctx, nickname: string) => {
      usersAuthState.deleteUser.nickname(ctx, nickname);
      usersAuthState.deleteUser.isConfirmed(ctx, false);
      usersAuthState.deleteUser.isOpen(ctx, true);
    }, `${name}.requestDelete`),
    deleteUser: atom(null, `${name}.deleteUser`).pipe(
      withAssign((_, name) => ({
        submit: reatomAsync(async (ctx, e?: React.FormEvent) => {
          if (e) e.preventDefault();

          const isConfirmed = ctx.get(usersAuthState.deleteUser.isConfirmed)

          if (!isConfirmed) {
            alertDialog.open(ctx, {
              title: "Вы точно хотите удалить этого игрока?",
              onConfirm: () => {
                usersAuthState.deleteUser.isConfirmed(ctx, true)
                return usersAuth.deleteUser.submit(ctx, e)
              },
              errorAtom: usersAuth.deleteUser.submit.errorAtom,
            })

            return
          }

          usersAuth.deleteUser.submit.errorAtom.reset(ctx);

          const nickname = ctx.get(usersAuthState.deleteUser.nickname);

          const json: ExtractApiBody<"postPrivatedUserAuthUnregister">["content"]["application/json"] = {
            nickname,
            strict: false
          }

          return await client.post("/privated/user/auth/unregister", { json })
        }, {
          name: `${name}.submit`,
          // The row disappears right away; a failure refetches the real list.
          onEffect: (ctx) => {
            const nickname = ctx.get(usersAuthState.deleteUser.nickname);
            if (nickname) usersState.data.delete(ctx, nickname);
          },
          onFulfill: (ctx, res) => {
            if (!res) return;

            const { nickname } = res;

            usersAuthState.deleteUser.isOpen(ctx, false);
            usersAuthState.deleteUser.isConfirmed(ctx, false);

            usersState.data.delete(ctx, nickname)
          },
          onReject: (ctx, e) => {
            users.refetchAll(ctx)
            logError(e, { type: "combined" })
          }
        }).pipe(
          withStatusesAtom(),
          withErrorAtom()
        )
      }))
    ),
    invite: reatomAsync(async (ctx, e: React.FormEvent) => {
      e.preventDefault()

      const nickname = ctx.get(usersAuthState.invite.nickname)

      return await client.raw.post<{ token: string }>("/privated/user/auth/invite", {
        json: { nickname },
      })
    }, {
      name: `${name}.invite`,
      onFulfill: (ctx, res) => {
        if (!res) return

        usersAuthState.invite.link(ctx, `${env.VITE_APP_URL}/auth?callback_query=${res.token}`)
        users.refetchAll(ctx)
      },
      onReject: (_, e) => logError(e, { type: "combined" })
    }).pipe(
      withStatusesAtom(),
      withErrorAtom()
    ),
    handleEvent: action((ctx, type: string) => {
      spawn(ctx, (spawnCtx) => {
        if (type === 'unregister') {
          const nicknames: string[] = [];
          if (nicknames.length === 0) return;

          usersAuthState.deleteUser.nickname(spawnCtx, nicknames[0])
          usersAuth.deleteUser.submit(spawnCtx)
        }
      })
    }),
    createUser: atom(null, 'createUser').pipe(
      withAssign((_, name) => ({
        submit: reatomAsync(async (ctx, e: React.FormEvent) => {
          e.preventDefault()

          const json: ExtractApiBody<"postPrivatedUserAuthRegister">["content"]["application/json"] = {
            nickname: ctx.get(usersAuthState.createUser.nickname),
            password: ctx.get(usersAuthState.createUser.password),
          }

          usersAuth.createUser.submit.errorAtom.reset(ctx);

          return await client.post("/privated/user/auth/register", { json })
        }, {
          name: `${name}.submit`,
          onFulfill: (ctx) => {
            usersAuthState.createUser.isOpen(ctx, false)
            toast.success("Пользователь создан")
            users.refetchAll(ctx)
          },
          onReject: (_, e) => logError(e, { type: "combined" })
        }).pipe(
          withStatusesAtom(),
          withErrorAtom()
        )
      }))
    )
  }))
)

usersAuthState.deleteUser.isOpen.onChange((ctx, state) => {
  if (!state) {
    usersAuthState.deleteUser.nickname.reset(ctx)
    usersAuth.deleteUser.submit.errorAtom.reset(ctx)
  }
})

usersAuthState.createUser.isOpen.onChange((ctx, state) => {
  if (!state) {
    usersAuthState.createUser.nickname.reset(ctx)
    usersAuthState.createUser.password.reset(ctx);
    usersAuth.createUser.submit.errorAtom.reset(ctx);
  }
})
//#endregion

type UserActionField = {
  label: string,
  value: string
}
type UserActionBase = {
  fields?: UserActionField[],
  childs?: UserActionChilds[],
  label: string,
}
export type UserActionChilds = UserActionBase & {
  event: string,
}
export type UserAction = UserActionBase & {
  group: string,
}

export const USER_ACTIONS: UserAction[] = [
  {
    group: "restricts",
    label: "Рестрикты",
    childs: [
      {
        label: "Бан",
        event: "ban",
        fields: [
          { label: "Срок", value: "duration" },
          { label: "Причина", value: "reason" }
        ]
      },
      {
        label: "Разбан",
        event: "unban",
      },
      {
        label: "Мут",
        event: "mute",
        fields: [
          { label: "Срок", value: "duration" },
          { label: "Причина", value: "reason" }
        ]
      },
      {
        label: "Размут",
        event: "unmute"
      },
      {
        label: "Кик",
        event: "kick",
        fields: [
          { label: "Причина", value: "reason" }
        ]
      },
      {
        label: "Выйти из сессии",
        event: "unlogin",
      },
    ]
  },
  {
    group: "auth",
    label: "Удалить",
    childs: [
      {
        label: "Удалить",
        event: "unregister",
      }
    ]
  }
]

const CALLBACKS: Record<UsersGroupExtended, (ctx: Ctx, event: string, nicknames: string[]) => void> = {
  "auth": (ctx, event) => usersAuth.handleEvent(ctx, event),
  "restricts": (ctx, event, nicknames) => usersRestrict.handleEvent(ctx, event, nicknames),
}

export const usersControl = atom(null, "usersControl").pipe(
  withAssign((_, name) => ({
    start: action((ctx, event: string, group: string, nickname?: string) => {
      const cb = CALLBACKS[group as UsersGroupExtended]

      if (cb) {
        cb(ctx, event, nickname ? [nickname] : [])
      } else {
        console.warn(`No callback for group: ${group}`)
      }
    })
  }))
)
