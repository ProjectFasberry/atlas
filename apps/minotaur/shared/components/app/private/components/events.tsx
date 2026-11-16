import { reatomComponent, useUpdate } from "@reatom/npm-react"
import { Input } from "@/shared/ui/input"
import { createEvent, createEventState, deleteEvent, events } from "../models/event.model"
import { Typography } from "@/shared/ui/typography"
import { DeleteButton } from "./ui"
import { ButtonXSubmit } from "./ui"
import { createPrivatedSectionModel } from "../models/shared.model"
import { Skeleton } from "@/shared/ui/skeleton"
import { ErrorBlock } from "@/shared/ui/error-block"
import { Noop } from "@/shared/ui/noop"
import { translate } from "@/shared/locales/helpers"

const fields = [
  { label: translate["panel.title"](), atom: createEventState.title },
  { label: translate["panel.type"](), atom: createEventState.type, },
  { label: translate["panel.description"](), atom: createEventState.description },
  { label: translate["panel.initiator"](), atom: createEventState.initiator }
]

const CreateEventSubmit = reatomComponent(({ ctx }) => {
  return (
    <ButtonXSubmit
      onClick={() => createEvent.submit(ctx)}
      disabled={ctx.spy(createEvent.submit.statusesAtom).isPending}
    />
  )
}, "CreateEventSubmit")

const CreateEventField = reatomComponent<typeof fields[number]>(({ ctx, label, atom }) => {
  return (
    <Input
      key={label}
      placeholder={label}
      onChange={e => atom(ctx, e.target.value)}
    />
  )
}, "CreateEventField")
const CreateEventForm = () => {
  return (
    <div className="flex flex-col gap-2 w-full h-full">
      {fields.map((field) => <CreateEventField key={field.label} {...field} />)}
    </div>
  )
}

const EventsListSkeleton = () => (
  <div className="flex flex-col w-full gap-2 h-full">
    {Array.from({ length: 6 }).map((_, idx) => <Skeleton key={idx} className="h-16 w-full" />)}
  </div>
)

const EventsList = reatomComponent(({ ctx }) => {
  useUpdate(events.fetch, [])

  if (ctx.spy(events.fetch.statusesAtom).isFirstPending) return <EventsListSkeleton />

  const error = ctx.spy(events.fetch.errorAtom)
  if (error) return <ErrorBlock title={error.message} />

  const data = ctx.spy(events.fetch.dataAtom)
  if (!data) return <Noop />

  return (
    <div className="flex flex-col w-full gap-2 h-full">
      {data.map((event) => (
        <div
          key={event.id}
          className="flex items-center justify-between gap-1 rounded-lg border border-neutral-800 w-full p-2"
        >
          <div className="flex items-center gap-2">
            <Typography className="text-neutral-400">
              [{event.title}]
            </Typography>
            <Typography className="truncate">
              {event.content.description}
            </Typography>
          </div>
          <div className="flex items-center gap-1">
            <DeleteButton
              disabled={ctx.spy(deleteEvent.submit.statusesAtom).isPending}
              onClick={() => deleteEvent.beforeSubmit(ctx, event.id)}
            />
          </div>
        </div>
      ))}
    </div>
  )
}, "EventsList")

export const eventsSection = createPrivatedSectionModel({
  event: "event",
  components: {
    header: {
      create: <CreateEventSubmit />,
      edit: null,
    },
    content: {
      create: <CreateEventForm />,
      edit: null,
      view: <EventsList />
    }
  }
})
