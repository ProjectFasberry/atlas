import { dayjs } from "@/shared/lib/dayjs"
import { reatomComponent } from "@reatom/npm-react";
import { Typography } from "@/shared/ui/typography"
import { eventsState, type EventsSingle } from "../models/events.model";
import { isEmptyArray } from "@/shared/lib/utils";
import { Noop } from "@/shared/ui/noop";

const EventCard = ({ content, id, title }: EventsSingle) => {
  const created_at = dayjs(content.created_at.toString()).fromNow();

  return (
    <div
      id={id}
      className="
        flex flex-col justify-center md:flex-[0_0_calc((100%/3)-0.666rem)] flex-shrink-0 w-full
        h-24 p-2 sm:p-4 bg-neutral-900 gap-2 rounded-xl overflow-hidden
      "
    >
      <div className="flex flex-col items-center justify-center w-full h-full truncate">
        <Typography className="text-base font-semibold truncate">
          {title}
        </Typography>
        {content.description && (
          <Typography className="text-sm leading-4 line-clamp-3">
            {content.description}
          </Typography>
        )}
      </div>
      <div className="flex items-center justify-center w-full">
        <Typography color="gray" className="text-[12px]">
          {created_at}
        </Typography>
      </div>
    </div>
  )
}

export const EventsList = reatomComponent(({ ctx }) => {
  const data = ctx.spy(eventsState.data);
  if (!data || isEmptyArray(data)) return <Noop />

  return data.map(event => <EventCard key={event.id} {...event} />)
}, "EventsList")
