import { client, withJsonBody, withQueryParams } from "@/shared/lib/client-wrapper"
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

export type PrivatedUser = PrivatedUsersPayload["data"][number]
export type PrivatedUsersPayload = ExtractApiData<"getPrivatedUserList">["data"]

type UsersQuery = Partial<ExtractApiParams<"getPrivatedUserList">["query"]>;
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
  return client<PrivatedUsersPayload>("privated/user/list").pipe(withQueryParams(query)).exec()
}

const getParams = action((ctx): UsersQuery => ({
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
      withConcurrency()
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
      onReject: (_, e) => notifyAboutRestrictRole(e)
    }).pipe(
      withStatusesAtom()
    ),
    fetchSingle: reatomAsync(async (ctx, nickname: string) => {
      return await ctx.schedule(() =>
        client<PrivatedUser>(`privated/user/${nickname}`).exec()
      )
    }, `${name}.fetchSingle`).pipe(
      withDataAtom(),
      withCache({ swr: false }),
      withStatusesAtom(),
      withAbort()
    )
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
        .post<UsersControlPayload>("privated/user/restrict/create", { timeout: 20000 })
        .pipe(withJsonBody(body))
        .exec()

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

        if (nicknames.length <= 2) {
          const toUpdate = [
            { k: "status", v: "banned" }
          ]

          updateUsersData(ctx, nicknames, toUpdate)
        } else {
          users.refetchAll(ctx)
        }

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
      return await ctx.schedule(() => client<Role[]>("privated/role/list", { signal: ctx.controller.signal }).exec())
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
        .post<UsersControlPayload>("privated/user/roles")
        .pipe(withJsonBody(body))
        .exec()

      return { nicknames, targetRoleId, result }
    }, {
      name: `${name}.submit`,
      onFulfill: (ctx, res) => {
        if (!res) return;

        const { result, nicknames, targetRoleId } = res;

        if (!result.ok) {
          toast.error("Is not updated")
          return;
        }

        if (nicknames.length <= 2) {
          const targetRoleName = ctx.get(usersRoles.fetch.dataAtom)?.find(role => role.id === targetRoleId)?.name;
          invariant(targetRoleName, "Target role name is not defined")

          const toUpdate = [
            { k: "role_id", v: targetRoleId },
            { k: "role_name", v: targetRoleName }
          ]

          updateUsersData(ctx, nicknames, toUpdate)
        } else {
          users.refetchAll(ctx)
        }

        usersRestrict.resetAll(ctx)
        usersRestrictState.selectedId.reset(ctx)
      },
      onReject: (ctx, e) => {
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
  updates: { k: string, v: string | number | boolean }[]
) => {
  users.fetch.cacheAtom.reset(ctx);

  const results = updates.reduce<Record<string, string | number | boolean>>(
    (acc, { k, v }) => {
      acc[k] = v;
      return acc;
    }, {}
  );

  usersState.data(ctx, (state) => {
    const updated: typeof state = new Map();

    for (const [key, value] of state) {
      const targets = nicknames.includes(value.nickname);
      updated.set(key, targets ? { ...value, ...results } : value);
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
usersListInView.onChange((ctx, state) => {
  if (!state) return;

  const hasNextPage = ctx.get(usersState.meta)?.hasNextPage
  if (!hasNextPage) return;

  users.update(ctx)
})

export const userIsSelectedAtom = (nickname: string) => atom((ctx) => ctx.spy(usersRestrictState.selectedUser) === nickname)
export const isCheckedAtom = (nickname: string) => atom((ctx) => ctx.spy(usersRestrictState.nicknames).has(nickname))

//#region users management
const CREATE_USER_VARIANT = ["game", "profile"] as const;
export type CreateUserVariant = typeof CREATE_USER_VARIANT[number]

// TODO: replace to the roles fetched data
export const CREATE_USER_ROLE_OPTIONS: { label: string, value: number }[] = [
  { label: "Игрок", value: 0 },
  { label: "Модератор", value: 1 }
]

export const usersAuthState = atom(null, "usersAuthState").pipe(
  withAssign((_, name) => ({
    deleteUser: atom(null, `${name}.deleteUser`).pipe(
      withAssign((_, name) => ({
        isOpen: atom(false, `${name}.isOpen`),
        nickname: atom("", `${name}.nickname`).pipe(withReset()),
        reason: atom("", `${name}.reason`).pipe(withReset()),
        isConfirmed: atom(false, `${name}.isConfirmed`)
      }))
    ),
    createUser: atom(null, `${name}.createUser`).pipe(
      withAssign((_, name) => ({
        isOpen: atom(false, `${name}.isOpen`),
        nickname: atom("", `${name}.nickname`).pipe(withReset()),
        password: atom("", `${name}.password`).pipe(withReset()),
        // only 0 or 1
        role: reatomSet<number>(new Set([0]), `${name}.role`).pipe(withReset()),
        options: reatomSet<CreateUserVariant>(new Set(["profile", "game"] as const), `${name}.options`).pipe(withReset())
      }))
    )
  }))
)
export const usersAuth = atom(null, "usersAuth").pipe(
  withAssign((_, name) => ({
    onValueChange: action((ctx, value: string[], field: Extract<CreateUserField, { type: "select" }>) => {
      if (value.length === 0) {
        field.value.reset(ctx);
        return;
      }

      const first = String(value[0]).trim()
      const isNotANumber = first === "" || Number.isNaN(Number(first));

      if (isNotANumber) {
        const state = field.value as typeof usersAuthState.createUser.options
        state(ctx, new Set(value as CreateUserVariant[]));
      } else {
        const state = field.value as typeof usersAuthState.createUser.role
        state(ctx, new Set(value.map(d => Number(d))));
      }
    }),
    deleteUser: atom(null, `${name}.deleteUser`).pipe(
      withAssign((_, name) => ({
        submit: reatomAsync(async (ctx, e?: React.FormEvent) => {
          if (e) {
            e.preventDefault();
          }

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

          return await client
            .post<ExtractApiData<"postPrivatedUserAuthUnregister">["data"]>("privated/user/auth/unregister", {
              json
            })
            .exec()
        }, {
          name: `${name}.submit`,
          onFulfill: (ctx, res) => {
            if (!res) return;

            const { nickname } = res;

            usersAuthState.deleteUser.isOpen(ctx, false);
            usersAuthState.deleteUser.isConfirmed(ctx, false);

            usersState.data.delete(ctx, nickname)
          },
          onReject: (_, e) => logError(e, { type: "combined" })
        }).pipe(
          withStatusesAtom(),
          withErrorAtom()
        )
      }))
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
            // options: Array.from(ctx.get(usersAuthState.createUser.options)),
            // role: Array.from(ctx.get(usersAuthState.createUser.role))[0]
          }

          usersAuth.createUser.submit.errorAtom.reset(ctx);

          return await client
            .post<ExtractApiData<"postPrivatedUserAuthRegister">["data"]>("privated/user/auth/register", {
              json
            })
            .exec()
        }, {
          name: `${name}.submit`,
          onFulfill: (ctx) => {
            usersAuthState.createUser.isOpen(ctx, false)
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

export const CREATE_USER_OPTIONS: { label: string, value: CreateUserVariant }[] = [
  { label: "Игра", value: "game" },
  { label: "Профиль", value: "profile" }
]

export type CreateUserField =
  | { type: "input", placeholder: string, value: AtomMut<string> }
  | {
    type: "select",
    placeholder: string,
    value: (SetAtom<CreateUserVariant> | SetAtom<number>) & { reset: Action<[], Set<any>> },
    maxValues: number,
    options: Array<{ label: string, value: string | number }>,
    multiple: boolean
  }
export const CREATE_USER_FIELDS: CreateUserField[] = [
  {
    placeholder: "Никнейм", type: "input", value: usersAuthState.createUser.nickname
  },
  {
    placeholder: "Пароль", type: "input", value: usersAuthState.createUser.password
  },
  {
    placeholder: "Роль",
    type: "select",
    value: usersAuthState.createUser.role,
    options: CREATE_USER_ROLE_OPTIONS,
    maxValues: 1,
    multiple: false
  },
  {
    placeholder: "Вариант",
    type: "select",
    value: usersAuthState.createUser.options,
    options: CREATE_USER_OPTIONS,
    maxValues: 2,
    multiple: true
  }
]

export type DeleteUserField = {
  placeholder: string
  value: AtomMut<string>
  required?: boolean
}
export const DELETE_USER_FIELDS: DeleteUserField[] = [
  { placeholder: "Никнейм", value: usersAuthState.deleteUser.nickname, required: true },
  { placeholder: "Причина", value: usersAuthState.deleteUser.reason }
]

usersAuthState.deleteUser.isOpen.onChange((ctx, state) => {
  if (!state) {
    usersAuthState.deleteUser.nickname.reset(ctx)
    usersAuthState.deleteUser.reason.reset(ctx)
    usersAuth.deleteUser.submit.errorAtom.reset(ctx)
  }
})

usersAuthState.createUser.isOpen.onChange((ctx, state) => {
  if (!state) {
    usersAuthState.createUser.nickname.reset(ctx)
    usersAuthState.createUser.password.reset(ctx);
    usersAuthState.createUser.role.reset(ctx);
    usersAuthState.createUser.options.reset(ctx);
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
