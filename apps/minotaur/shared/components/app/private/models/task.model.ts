import {
  action, atom, reatomAsync,
  withCache, withDataAtom, withErrorAtom, withStatusesAtom,
} from "@reatom/framework"
import { toast } from "sonner"
import { client } from "@/shared/lib/client-wrapper"
import { translate } from "@/shared/locales/helpers"
import { alertDialog } from "@/shared/components/config/alert-dialog/alert-dialog.model"
import { actions, notifyAboutRestrictRole } from "./actions.model"

export type TasksPanelPayload = ExtractApiData<"getPrivatedTasksList">["data"]
export type TaskItem = TasksPanelPayload[number]
export type TaskCurrency = "BELKOIN" | "CHARISM"
type TaskUpdate = ExtractApiBody<"postPrivatedTasksByIdEdit">["content"]["application/json"]

const tasksFetch = reatomAsync(async (ctx) => {
  return await ctx.schedule(() => client.get("/privated/tasks/list", {
    signal: ctx.controller.signal,
  }))
}, "tasksPanel.fetch").pipe(
  withDataAtom(null),
  withStatusesAtom(),
  withCache({ swr: false }),
  withErrorAtom(),
)

const toLocalInput = (value: string | null): string => {
  if (!value) return ""

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""

  const pad = (part: number) => String(part).padStart(2, "0")
  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  ].join("T")
}

const toIso = (value: string): string | null => {
  if (!value) return null

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

/** One form drives both the inline create section and the edit dialog. */
const mode = atom<"create" | "edit">("create", "taskForm.mode")
const id = atom<number | null>(null, "taskForm.id")
const isOpen = atom(false, "taskForm.isOpen")
const original = atom<TaskItem | null>(null, "taskForm.original")
const title = atom("", "taskForm.title")
const description = atom("", "taskForm.description")
const link = atom("", "taskForm.link")
const currency = atom<TaskCurrency>("BELKOIN", "taskForm.currency")
const reward = atom("", "taskForm.reward")
const expires = atom("", "taskForm.expires")

const reset = action((ctx) => {
  title(ctx, "")
  description(ctx, "")
  link(ctx, "")
  currency(ctx, "BELKOIN")
  reward(ctx, "")
  expires(ctx, "")
  original(ctx, null)
}, "taskForm.reset")

const openCreate = action((ctx) => {
  mode(ctx, "create")
  id(ctx, null)
  reset(ctx)
  isOpen(ctx, false)
}, "taskForm.openCreate")

const openEdit = action((ctx, item: TaskItem) => {
  mode(ctx, "edit")
  id(ctx, item.id)
  original(ctx, item)
  title(ctx, item.title)
  description(ctx, item.description)
  link(ctx, item.action_value ?? "")
  currency(ctx, item.reward_currency === "CHARISM" ? "CHARISM" : "BELKOIN")
  reward(ctx, String(item.reward_value))
  expires(ctx, toLocalInput(item.expires))
  isOpen(ctx, true)
}, "taskForm.openEdit")

const close = action((ctx) => {
  isOpen(ctx, false)
}, "taskForm.close")

const isValid = atom((ctx) => {
  const rewardValue = Number(ctx.spy(reward))
  return ctx.spy(title).trim().length > 0
    && ctx.spy(description).trim().length > 0
    && Number.isFinite(rewardValue)
    && rewardValue >= 1
}, "taskForm.isValid")

type TaskFields = {
  title: string
  description: string
  action_value: string | null
  reward_currency: TaskCurrency
  reward_value: number
  expires: string | null
}

const collectChanges = (item: TaskItem | null, fields: TaskFields): TaskUpdate => {
  if (!item) return []

  const changes: TaskUpdate = []
  if (fields.title !== item.title) changes.push({ field: "title", value: fields.title })
  if (fields.description !== item.description) changes.push({ field: "description", value: fields.description })
  if (fields.action_value !== (item.action_value ?? null)) {
    changes.push({ field: "action_value", value: fields.action_value })
  }
  if (fields.reward_currency !== item.reward_currency) {
    changes.push({ field: "reward_currency", value: fields.reward_currency })
  }
  if (fields.reward_value !== item.reward_value) {
    changes.push({ field: "reward_value", value: fields.reward_value })
  }
  if (fields.expires !== (item.expires ?? null)) {
    changes.push({ field: "expires", value: fields.expires })
  }

  return changes
}

const submit = reatomAsync(async (ctx) => {
  const fields: TaskFields = {
    title: ctx.get(title).trim(),
    description: ctx.get(description).trim(),
    action_value: ctx.get(link).trim() || null,
    reward_currency: ctx.get(currency),
    reward_value: Number(ctx.get(reward)),
    expires: toIso(ctx.get(expires)),
  }

  const targetId = ctx.get(id)
  if (!targetId) {
    const data = await client.post("/privated/tasks/create", {
      json: { ...fields, action_type: "link" },
    })
    return { mode: "create" as const, id: data.id, data }
  }

  const data = await client.post("/privated/tasks/{id}/edit", {
    params: { path: { id: targetId } },
    json: collectChanges(ctx.get(original), fields),
  })

  return { mode: "edit" as const, id: targetId, data }
}, {
  name: "taskForm.submit",
  onFulfill: (ctx, result) => {
    tasksFetch.dataAtom(ctx, (state) => {
      if (!state) return [result.data]
      if (result.mode === "create") return [result.data, ...state]

      return state.map((item) => item.id === result.id ? result.data : item)
    })

    toast.success(result.mode === "create"
      ? translate["private.tasks.created"]()
      : translate["private.tasks.updated"]())
    close(ctx)
    reset(ctx)

    if (result.mode === "create") actions.goBack(ctx)
  },
  onReject: (_, error) => {
    notifyAboutRestrictRole(error)
  },
}).pipe(
  withStatusesAtom(),
  withErrorAtom(),
)

export const taskForm = {
  mode,
  id,
  isOpen,
  original,
  title,
  description,
  link,
  currency,
  reward,
  expires,
  reset,
  openCreate,
  openEdit,
  close,
  submit,
  isValid,
}

const deleteSubmit = reatomAsync(async (_, targetId: number) => {
  await client.delete("/privated/tasks/{id}", { params: { path: { id: targetId } } })
  return targetId
}, {
  name: "taskDelete.submit",
  onFulfill: (ctx, targetId) => {
    tasksFetch.dataAtom(ctx, (state) => state?.filter((item) => item.id !== targetId) ?? null)
    toast.success(translate["private.tasks.deleted"]())
  },
  onReject: (_, error) => {
    notifyAboutRestrictRole(error)
  },
}).pipe(
  withStatusesAtom(),
  withErrorAtom(),
)

const confirmDelete = action((ctx, item: TaskItem) => {
  alertDialog.open(ctx, {
    title: translate["private.tasks.deleteTitle"]({ title: item.title }),
    onConfirm: () => deleteSubmit(ctx, item.id),
    errorAtom: deleteSubmit.errorAtom,
  })
}, "taskDelete.confirm")

export const taskDelete = {
  confirm: confirmDelete,
  submit: deleteSubmit,
}

export const tasksPanel = {
  fetch: tasksFetch,
}
