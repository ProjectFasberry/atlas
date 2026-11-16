import {
  action, atom, reatomAsync,
  withAssign, withDataAtom, withErrorAtom, withStatusesAtom
} from "@reatom/framework";
import { withLocalStorage } from "@reatom/persist-web-storage";
import { client } from "@/shared/lib/client-wrapper";
import { currentUserState } from "@/shared/models/current-user/index.model";

export type HomeTopPlayer = {
  nickname: string;
  avatar: string;
  total: number;
}

export type HomeStoreItem = {
  id: number;
  title: string;
  imageUrl: string;
  price: number;
  currency: string;
}

export type HomeLand = {
  ulid: string;
  name: string;
  title: string | null;
  level: number;
  members: { uuid: string }[];
}

export const homeState = atom(null, "homeState").pipe(
  withAssign((_, name) => ({
    /** Read markers live in localStorage: no extra API and no SSR work. */
    readNews: atom<string[]>([], `${name}.readNews`).pipe(
      withLocalStorage({ key: "home-read-news" })
    ),
    readEvents: atom<string[]>([], `${name}.readEvents`).pipe(
      withLocalStorage({ key: "home-read-events" })
    ),
  }))
)

export const home = atom(null, "home").pipe(
  withAssign((_, name) => ({
    topPlayers: reatomAsync(async () => {
      const data = await client.get("/server/rating/{by}", {
        params: { path: { by: "playtime" }, query: { limit: 5, server: "bisquite" } }
      })

      return (data.data ?? []) as HomeTopPlayer[]
    }, `${name}.topPlayers`).pipe(
      withDataAtom(null),
      withStatusesAtom(),
      withErrorAtom()
    ),
    storeItems: reatomAsync(async () => {
      const data = await client.get("/store/items", {
        params: { query: { wallet: "ALL", category: "donate" } }
      })

      return (data.data ?? []).slice(0, 3) as HomeStoreItem[]
    }, `${name}.storeItems`).pipe(
      withDataAtom(null),
      withStatusesAtom(),
      withErrorAtom()
    ),
    myLand: reatomAsync(async (ctx) => {
      const uuid = ctx.get(currentUserState)?.uuid
      if (!uuid) return null

      const data = await client.get("/server/lands/list")

      return (data.data as HomeLand[]).find((land) =>
        land.members.some((member) => member.uuid === uuid)
      ) ?? null
    }, `${name}.myLand`).pipe(
      withDataAtom(null),
      withStatusesAtom(),
      withErrorAtom()
    ),
    markNewsRead: action((ctx, ids: string[]) => {
      homeState.readNews(ctx, (state) => [...new Set([...state, ...ids])])
    }, `${name}.markNewsRead`),
    markEventsRead: action((ctx, ids: string[]) => {
      homeState.readEvents(ctx, (state) => [...new Set([...state, ...ids])])
    }, `${name}.markEventsRead`),
  }))
)
