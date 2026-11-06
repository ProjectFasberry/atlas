import { client, withQueryParams } from "@/shared/lib/client-wrapper"
import {
  atom, reatomAsync, withAbort, withAssign, withDataAtom, withErrorAtom, withStatusesAtom,
} from "@reatom/framework"
import { withLocalStorage } from "@reatom/persist-web-storage"
import { notifyAboutRestrictRole } from "./actions.model"

export type ReleaseChannel = "prod" | "dev"

export type ReleaseFile = {
  name: string
  size: number
  checksum: Nullable<string>
}

export type ReleasePlatform = {
  platform: string
  files: ReleaseFile[]
}

export type Release = {
  channel: ReleaseChannel
  version: string
  pub_date: Nullable<string>
  notes: string
  latest: boolean
  platforms: ReleasePlatform[]
}

export const RELEASE_CHANNELS: { label: string, value: ReleaseChannel }[] = [
  { label: "Prod", value: "prod" },
  { label: "Dev", value: "dev" },
]

export const releasesState = atom(null, "releasesState").pipe(
  withAssign((_, name) => ({
    channel: atom<ReleaseChannel>("prod", `${name}.channel`).pipe(
      withLocalStorage({ key: "privated-releases-channel" })
    )
  }))
)

export const releases = atom(null, "releases").pipe(
  withAssign((_, name) => ({
    fetch: reatomAsync(async (ctx) => {
      const channel = ctx.get(releasesState.channel)

      return await ctx.schedule(() =>
        client<Release[]>("privated/releases")
          .pipe(withQueryParams({ channel }))
          .exec()
      )
    }, {
      name: `${name}.fetch`,
      onReject: (_, e) => notifyAboutRestrictRole(e),
    }).pipe(
      withDataAtom(null),
      withStatusesAtom(),
      withErrorAtom(),
      withAbort()
    )
  }))
)

releasesState.channel.onChange((ctx) => {
  // The feed belongs to one channel: an in-flight response and the old list
  // must not leak into the other tab.
  releases.fetch.abort(ctx)
  releases.fetch.dataAtom.reset(ctx)
  releases.fetch(ctx)
})

/** Direct link to the permission-checked download route (302 -> presigned S3). */
export function releaseDownloadUrl(
  base: string | undefined,
  channel: ReleaseChannel,
  version: string,
  platform: string,
  file: string
) {
  const root = (base ?? "").replace(/\/$/, "")
  const path = [channel, version, platform, file].map(encodeURIComponent).join("/")

  return `${root}/privated/releases/${path}`
}
