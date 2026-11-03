import { Skeleton } from "@/shared/ui/skeleton"
import { lands, type LandSimilar } from "../models/lands.model"
import { reatomComponent, useUpdate } from "@reatom/npm-react"
import { Link } from "@/shared/components/config/link/link"
import { tv } from 'tailwind-variants'
import { Typography } from "@/shared/ui/typography"
import { FormattedText } from "../../land/components/land-title"
import { LandBanner } from "../../land/components/land-banner"
import { Avatar } from "../../../../ui/avatar"
import { Icon } from "@/shared/ui/icon"
import { pageState } from "@/shared/models/page-context.model"
import { translate } from "@/shared/locales/helpers"
import { atom } from "@reatom/framework"
import { MasonryGrid } from "@/shared/ui/masonry-grid"
import { createLink } from "@/shared/components/config/link/link.model"
import { ErrorBlock } from "@/shared/ui/error-block"

const LandsEmpty = () => (
  <Typography color="gray" className="text-lg">
    {translate["lands.empty"]()}
  </Typography>
)

const landCardVariants = tv({
  base: `flex items-start justify-between gap-6 duration-150 relative w-full rounded-xl p-3 sm:p-4 lg:p-6 bg-neutral-900`,
  slots: {
    child: "flex flex-col gap-3 overflow-hidden",
    stat: "inline-flex items-center gap-2 text-sm sm:text-base"
  }
})

const LandCard = ({ members, name, title, ulid, details: { banner } }: LandSimilar) => {
  const owner = members[0];

  return (
    <Link href={createLink("land", ulid)} className={landCardVariants().base()}>
      <div className={landCardVariants().child()}>
        {owner && (
          <div className="flex items-center gap-2 w-full">
            <Avatar
              nickname={owner.nickname}
              url={owner.avatar}
              className="h-6 w-6"
            />
            <Typography className="text-base sm:text-lg truncate">
              {owner.nickname}
            </Typography>
          </div>
        )}
        <Typography className="text-base sm:text-xl truncate font-semibold">
          {name}
        </Typography>
        {title && <FormattedText text={title} className="text-sm sm:text-base" />}
        <div className="flex flex-col select-none gap-1">
          <Typography className={landCardVariants().stat()}>
            <Icon name="sprite:circle" className="size-2" />
            {members.length} {translate["shared.lands.single.attributes.members"]()}
          </Typography>
          {/*<Typography className={landCardVariants().stat()}>
            <Icon name="sprite:circle" className="size-2" />
            {level} {translate["shared.lands.single.attributes.level"]()}
          </Typography>*/}
        </div>
      </div>
      <LandBanner banner={banner} variant="small" />
    </Link >
  )
}

const masonryOpts = {
  columnConfig: {
    default: 1,
    640: 2,
    1024: 3,
    1280: 3,
  },
  columnGap: 6,
  rowGap: 6
}

const SKELETON_HEIGHTS = ['h-32', 'h-44', 'h-36', 'h-40', 'h-56', 'h-64', 'h-72'];
const SKELETON_COUNT = 12;

const randomHeightsAtom = atom(Array.from({ length: SKELETON_COUNT }).map(() => {
  const randomIdx = Math.floor(Math.random() * SKELETON_HEIGHTS.length);
  return SKELETON_HEIGHTS[randomIdx];
}))

const LandsSkeleton = reatomComponent(({ ctx }) => {
  const randomHeights = ctx.spy(randomHeightsAtom)

  return (
    <MasonryGrid
      {...masonryOpts}
      items={randomHeights}
      renderItem={((height, idx) => <Skeleton key={idx} className={`${height} w-full`} />)}
    />
  )
}, "LandsSkeleton")

const LandsListShortedSkeleton = () => (
  <div className="flex flex-col sm:flex-row rounded-lg scrollbar-h-2 overflow-x-auto gap-4 pb-2">
    <Skeleton className="h-44 w-full" />
    <Skeleton className="h-44 w-full" />
    <Skeleton className="h-44 w-full" />
  </div>
)

export const LandsListShorted = reatomComponent(({ ctx }) => {
  useUpdate((ctx) => lands.fetch(ctx, { limit: 3 }), []);

  if (!ctx.spy(pageState.isClientside) || ctx.spy(lands.fetch.statusesAtom).isPending) {
    return <LandsListShortedSkeleton />
  }

  const error = ctx.spy(lands.fetch.errorAtom)
  if (error) return <ErrorBlock title={error.message} />

  const data = ctx.spy(lands.fetch.dataAtom)
  if (!data || data.length === 0) return <LandsEmpty />

  return (
    <div className="flex flex-col w-full gap-2">
      <div className="flex flex-col sm:flex-row rounded-lg scrollbar-h-2 overflow-x-auto gap-4 pb-2">
        {data.map((land) => <LandCard key={land.ulid} {...land} />)}
      </div>
      {data.length > 3 && (
        <Link href="/lands?from=index" className="flex self-end w-fit">
          <Typography className="font-semibold text-neutral-400">
            {translate["shared.lands.list.showMore"]()}
          </Typography>
        </Link>
      )}
    </div>
  )
}, "LandsListShorted")

export const LandsList = reatomComponent(({ ctx }) => {
  if (!ctx.spy(pageState.isClientside) || ctx.spy(lands.fetch.statusesAtom).isPending) {
    return <LandsSkeleton />
  }

  const error = ctx.spy(lands.fetch.errorAtom)
  if (error) return <ErrorBlock title={error.message} />

  const data = ctx.spy(lands.fetch.dataAtom)
  if (!data || data.length === 0) return <LandsEmpty />

  return (
    <MasonryGrid
      items={data}
      renderItem={(land) => <LandCard key={land.ulid} {...land} />}
      {...masonryOpts}
    />
  )
}, "LandsList")
