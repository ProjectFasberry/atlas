import { action, reatomAsync, withAssign, withDataAtom, withErrorAtom, withStatusesAtom } from "@reatom/framework";
import { atom } from "@reatom/framework";
import { withReset } from "@reatom/framework";
import { currentUserState } from "@/shared/models/current-user/index.model";
import { withHistory } from "@/shared/lib/reatom/helpers";
import { withSsr } from "@/shared/models/ssr";
import { logError } from "@/shared/lib/log";
import { client, withQueryParams } from "@/shared/lib/client-wrapper";
import { isEmpty, isEmptyArray } from "@/shared/lib/utils";
import type { PageContextServer } from "vike/types";
import { render } from "vike/abort";
import { getNotExistUrlByEntity } from "@/shared/lib/helpers";

export type Land = ExtractApiData<"getServerLandsByUlid">["data"]
type LandExtended = Land & {
  points?: { [key: string]: { x: number, y: number } }
}

export const landState = atom(null, "landState").pipe(
  withAssign((_, name) => ({
    data: atom<LandExtended | null>(null, `${name}.data`).pipe(withReset(), withSsr(`${name}.data`))
  }))
)

export const landParamAtom = atom<string | null>((ctx) => ctx.spy(landState.data)?.ulid ?? null, "landParamAtom").pipe(
  withHistory()
);

export const landOwnerAtom = atom<string | null>((ctx) => {
  const members = ctx.spy(landState.data)?.members;
  if (!members || isEmpty(members)) return null;
  return members[0].nickname;
}, "landOwner")

export const landIsMemberAtom = atom<boolean>((ctx) => {
  const currentUser = ctx.spy(currentUserState);
  if (!currentUser) return false;

  const members = ctx.spy(landState.data)?.members;
  if (!members || isEmpty(members)) return false;

  return members.some((exist) => exist.nickname === currentUser.nickname);
}, "landIsMemberAtom")

export const landIsOwnerAtom = atom<boolean>((ctx) => {
  const currentUser = ctx.spy(currentUserState);
  if (!currentUser) return false;

  const owner = ctx.spy(landOwnerAtom)
  if (!owner) return false;

  return currentUser.nickname === owner;
}, "landIsOwnerAtom")

export const landBannerAtom = atom<string | null>((ctx) => ctx.spy(landState.data)?.details.banner ?? null, "landBanner")
export const landGalleryAtom = atom<string[]>((ctx) => ctx.spy(landState.data)?.details.gallery ?? [], "landGalleryAtom")

export const land = atom(null, "lands").pipe(
  withAssign((_, name) => ({
    /**
     * Server-side only
     */
    init: action(async (ctx, pageCtx: PageContextServer) => {
      const headers = pageCtx.headers ?? undefined;
      const ulid = pageCtx.routeParams.id;

      const land = await client<Land>(`server/lands/${ulid}`, { headers }).exec().catch(e => {
        console.error("Land error", e);
        return null;
      })

      if (!land) throw render(getNotExistUrlByEntity("land"))

      const item = {
        ...land,
        points: { ["init"]: { x: 412.12, y: 65.6 } }
      };

      landState.data(ctx, item)
      return item
    }),
    fetchSimilar: reatomAsync(async (ctx) => {
      const nickname = ctx.get(landOwnerAtom)
      if (!nickname) return;

      const exclude = ctx.get(landParamAtom);
      if (!exclude) return;

      return await ctx.schedule(() => client
        .get<ExtractApiData<"getServerLandsList">["data"]>(`server/lands/similar`, {
          signal: ctx.controller.signal
        })
        .pipe(withQueryParams({ exclude }))
        .exec(),
      );
    }, {
      name: `${name}.fetchSimilar`,
      onReject: (_, e) => {
        logError(e, { type: "combined" });
      },
    }).pipe(
      withDataAtom(null, (_, data) => data?.data ? isEmptyArray(data.data) ? null : data.data : null),
      withStatusesAtom(),
      withErrorAtom()
    )
  }))
)
