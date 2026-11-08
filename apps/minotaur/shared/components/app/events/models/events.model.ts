import { client } from "@/shared/lib/client-wrapper";
import { atom } from "@reatom/framework";
import { withAssign } from "@reatom/framework";
import { withSsr } from "@/shared/models/ssr";

export type EventsList = ExtractApiData<"getServerEventsList">["data"]
export type EventsSingle = EventsList[number]

type EventsParams = ExtractApiParams<"getServerEventsList">["query"]

export async function getEvents(params: Partial<EventsParams>, init?: RequestInit) {
  return client.raw.get<EventsList>("/server/events/list", { ...init, params: { query: params } })
}

export const eventsState = atom(null, "eventsState").pipe(
  withAssign((_, name) => ({
    data: atom<EventsList>([], `${name}.data`).pipe(withSsr(`${name}.data`))
  }))
)
