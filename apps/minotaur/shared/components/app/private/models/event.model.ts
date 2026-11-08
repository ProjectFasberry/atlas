import { action, atom, withErrorAtom } from "@reatom/framework"
import { reatomAsync, withAssign, withCache, withDataAtom, withReset, withStatusesAtom } from "@reatom/framework"
import { getEvents, type EventsSingle } from "../../events/models/events.model"
import { client } from "@/shared/lib/client-wrapper"
import { toast } from "sonner"
import { actions, notifyAboutRestrictRole } from "./actions.model"
import { alertDialog } from "@/shared/components/config/alert-dialog/alert-dialog.model"

export const events = atom(null, "events").pipe(
  withAssign((_, name) => ({
    fetch: reatomAsync(async (ctx) => {
      return await ctx.schedule(() =>
        getEvents({ limit: 12 }, { signal: ctx.controller.signal })
      )
    }, `${name}.fetch`).pipe(
      withDataAtom(null),
      withCache({ swr: false }),
      withStatusesAtom(),
      withErrorAtom()
    )
  }))
)

export const createEventState = atom(null, "createEventState").pipe(
  withAssign((_, name) => ({
    title: atom("", `${name}.title`).pipe(withReset()),
    description: atom("", `${name}.description`).pipe(withReset()),
    initiator: atom("", `${name}.initiator`).pipe(withReset()),
    type: atom("", `${name}.type`).pipe(withReset())
  }))
)
export const createEvent = atom(null, "createEvent").pipe(
  withAssign((_, name) => ({
    resetFull: action((ctx) => {
      createEventState.title.reset(ctx)
      createEventState.description.reset(ctx)
      createEventState.initiator.reset(ctx)
      createEventState.type.reset(ctx)
    }),
    submit: reatomAsync(async (ctx) => {
      type EventType = "postPrivatedEventsCreate";
      type Json = ExtractApiBody<EventType>["content"]["application/json"]

      const json: Json = {
        title: ctx.get(createEventState.title),
        description: ctx.get(createEventState.description),
        initiator: ctx.get(createEventState.initiator),
        type: ctx.get(createEventState.type) as Json["type"]
      }

      return await client
        .post("/privated/events/create", { json })
    }, {
      name: `${name}.submit`,
      onFulfill: (ctx, res) => {
        events.fetch.cacheAtom.reset(ctx)
        events.fetch.dataAtom(ctx, (state) => state ? [...state, res] : [res])

        createEvent.resetFull(ctx)
        actions.goBack(ctx);

        toast.success("Ивент создан");
      },
      onReject: (_, e) => notifyAboutRestrictRole(e),
    }).pipe(
      withStatusesAtom(),
      withErrorAtom()
    )
  }))
)
export const deleteEvent = atom(null, "deleteEvent").pipe(
  withAssign((_, name) => ({
    beforeSubmit: action((ctx, id: EventsSingle["id"]) => {
      alertDialog.open(ctx, {
        title: `Удаление события`,
        description: `Вы уверены, что хотите удалить это событие?`,
        onConfirm: () => deleteEvent.submit(ctx, id),
      })
    }),
    submit: reatomAsync(async (_, id: EventsSingle["id"]) => {
      const result = await client
        .delete("/privated/events/{id}", { params: { path: { id } } })

      return { result, id }
    }, {
      name: `${name}.submit`,
      onFulfill: (ctx, res) => {
        events.fetch.cacheAtom.reset(ctx)
        events.fetch.dataAtom(ctx, (state) => state ? state.filter((e) => e.id !== res.id) : null)
      }
    }).pipe(
      withStatusesAtom(),
      withErrorAtom()
    )
  }))
)
