import { reatomComponent, useUpdate } from "@reatom/npm-react"
import { land, landState, landBannerAtom, landGalleryAtom, landIsOwnerAtom } from "../models/land.model"
import { Avatar } from "@/shared/ui/avatar"
import { Typography } from "@/shared/ui/typography"
import { Link } from "@/shared/components/config/link/link"
import { FormattedText } from "./land-title"
import { Icon } from "@/shared/ui/icon"
import { Button } from "@/shared/ui/button"
import { navigate } from "vike/client/router"
import { changesIsExistsAtom, landActionTitleAtom, landEditing, landEditingState } from "../models/edit-land.model"
import { LandBanner, LandBannerWithEditing } from "./land-banner"
import { Carousel } from '@ark-ui/react/carousel'
import { getDataFromSnapshot } from "@/shared/models/app/utils"
import { isEmptyArray } from "@/shared/lib/utils"
import { tv } from "tailwind-variants"
import { carouselVariant } from "@/shared/ui/carousel"
import { appState } from "@/shared/models/app/index.model"
import { createLink } from "@/shared/components/config/link/link.model"
import { Skeleton } from "@/shared/ui/skeleton"
import { pageState } from "@/shared/models/page-context.model"
import { Noop } from "@/shared/ui/noop"
import { SummaryNumber } from "@/shared/ui/summary-number"
import { translate } from "@/shared/locales/helpers"
import type { LandSimilar } from "../../lands/models/lands.model"
import { ENVIRONMENT } from "@/shared/consts"
import { LandAccess } from "./land-access"
import { ClientOnly } from "vike-react/ClientOnly"

const LandGallery = reatomComponent(({ ctx }) => {
  const landGallery = ctx.spy(landGalleryAtom)
  if (!landGallery || isEmptyArray(landGallery)) return null;

  return (
    <Carousel.Root
      id="gallery"
      slideCount={landGallery.length}
      allowMouseDrag={true}
      defaultPage={1}
      autoplay={true}
      loop={true}
      slidesPerPage={1.4}
      className={carouselVariant.root()}
    >
      <Carousel.Control>
        <Carousel.ItemGroup>
          {landGallery.map((image, idx) => (
            <Carousel.Item key={idx} index={idx} className={carouselVariant.item()}>
              <img
                src={image}
                className={carouselVariant.image()}
                width={1920}
                height={1080}
                loading="lazy"
                alt=""
              />
            </Carousel.Item>
          ))}
        </Carousel.ItemGroup>
      </Carousel.Control>
      <Carousel.IndicatorGroup className={carouselVariant.indicators()}>
        <div className="flex gap-2 px-2 rounded-xl py-1 w-fit bg-black/30 backdrop-blur-2xl">
          {landGallery.map((_, idx) => (
            <Carousel.Indicator key={idx} index={idx} className={carouselVariant.indicator()} />
          ))}
        </div>
      </Carousel.IndicatorGroup>
    </Carousel.Root>
  )
}, "LandGallery")

const LandToggleMode = reatomComponent(({ ctx }) => {
  const stage = ctx.spy(appState.options)?.state.stage
  if (stage === 'prod') return null;

  const changesIsExist = ctx.spy(changesIsExistsAtom)

  return (
    <div
      id="toggle-mode"
      className="flex gap-1 w-fit *:h-8 font-semibold min-w-0 text-sm inert:opacity-60 inert:pointer-events-none"
      inert={ctx.spy(landEditing.submit.statusesAtom).isPending}
    >
      {changesIsExist ? (
        <Button background="white" className="aspect-square p-0" onClick={() => landEditing.resetFull(ctx)}>
          <Icon name="sprite:x" className="size-4" />
        </Button>
      ) : (
        <Button background="white" onClick={() => landEditingState.mode(ctx, (state) => state === 0 ? 1 : 0)}>
          <Typography className='text-nowrap truncate'>
            {ctx.spy(landActionTitleAtom)}
          </Typography>
        </Button>
      )}
      {changesIsExist && (
        <Button background="white" onClick={() => landEditing.submit(ctx)}>
          <Typography className="text-nowrap truncate">
            {translate["land.editing.save-changes"]()}
          </Typography>
        </Button>
      )}
    </div>
  )
}, "LandToggleMode")

const Splitter = ({ className }: { className?: string }) => (
  <Icon name="sprite:circle" className={`text-neutral-400 size-2 relative top-0.5 ${className}`} />
);

const sectionTitleVariant = "text-base sm:text-2xl font-semibold"

const membersItemVariant = tv({
  base: `
    flex justify-between py-2 px-4 rounded-lg items-center gap-2 w-full
    border hover:bg-neutral-800 border-neutral-800
  `,
  slots: {
    avatar: `h-6 w-6`,
    nickname: `text-base`,
  }
})

const LandMembers = reatomComponent(({ ctx }) => {
  const land = ctx.spy(landState.data)
  if (!land) return null;

  const { members } = land

  return (
    <div
      id="members"
      className="flex flex-col gap-2"
    >
      <div className="flex items-end gap-2 w-full">
        <Typography className={sectionTitleVariant}>
          {translate["land.members"]()}
        </Typography>
        <SummaryNumber value={members.length} />
      </div>
      <div className="flex flex-col gap-1 w-full">
        {members.length === 0 && (
          <div className={membersItemVariant().base({ className: "border border-yellow-800" })}>
            <Typography className={membersItemVariant().nickname()}>
              {translate["land.test.test-item"]()}
            </Typography>
          </div>
        )}
        {members.map((member, idx) => (
          <Link
            href={createLink("player", member.nickname)}
            key={member.nickname}
            className={membersItemVariant().base()}
          >
            <div className="flex items-center gap-2">
              <Avatar
                nickname={member.nickname}
                className={membersItemVariant().avatar()}
                url={member.avatar}
              />
              <Typography className={membersItemVariant().nickname()}>
                {member.nickname}
              </Typography>
            </div>
            {idx === 0 && (
              <Icon name="sprite:crown" className='size-6 text-gold' />
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}, "LandMembers")

const LandLinks = reatomComponent(({ ctx }) => {
  const banner = ctx.spy(landBannerAtom);
  if (!banner) return null;

  return (
    <div
      id="links"
      className="flex flex-col gap-2"
    >
      <Typography className="text-2xl xl:text-3xl font-semibold">
        {translate["land.links"]()}
      </Typography>
      <div className="flex flex-col gap-1">
        <a target="_blank" href={banner} className="flex items-center gap-2 text-blue-500">
          <Typography className="text-xl">
            {translate["land.banner"]()}
          </Typography>
          <Icon name="sprite:link" className="size-6" />
        </a>
      </div>
    </div>
  )
}, "LandLinks")

const LandDetails = reatomComponent(({ ctx }) => {
  const land = ctx.spy(landState.data)

  const currentUser = getDataFromSnapshot("currentUser")
  const isAccessible = currentUser?.meta.role.id === 3
  console.log(ENVIRONMENT, isAccessible); // server, true

  const isOwner = ctx.spy(landIsOwnerAtom);
  const points = land?.points

  return (
    <div
      id="details"
      className="flex flex-col sm:flex-row items-start min-w-0 sm:items-center gap-1 sm:gap-4 w-full"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 min-w-0">
        {land?.members && (
          <Typography
            className="text-base text-nowrap truncate"
            color='gray'
          >
            {land?.members.length} {land?.members.length === 1 ? "участник" : "участников"}
          </Typography>
        )}
        <Splitter className="hidden sm:inline" />
        <Typography
          className="text-base cursor-pointer hover:text-neutral-50 text-nowrap truncate"
          color='gray'
          onClick={() => navigate("#points", { overwriteLastHistoryEntry: false })}
        >
          {points ? Object.keys(points)?.length : 0} {translate["land.point"]()}
        </Typography>
      </div>
      <div className="flex items-center gap-2 min-w-0">
        {isAccessible && (
          <ClientOnly>
            <LandAccess ulid={land?.ulid ?? ""} />
          </ClientOnly>
        )}
        {isOwner && (
          <LandToggleMode />
        )}
      </div>
    </div>
  )
}, "LandDetails")

const LandHead = reatomComponent(({ ctx }) => {
  const land = ctx.spy(landState.data)
  if (!land) return null;

  return (
    <>
      <Typography className="text-2xl xl:text-3xl font-semibold">
        {land.name}
      </Typography>
      {land.title && (
        <FormattedText as="span" text={land.title} />
      )}
    </>
  )
}, "LandHead")

const LandSimilarSkeleton = () => (
  Array.from({ length: 6 }).map((_, idx) => <Skeleton key={idx} className="h-12 w-full" />)
)

const LandSimilarListItem = ({ ulid, name, details, title }: LandSimilar) => {
  return (
    <Link
      href={createLink("land", ulid)}
      className='flex items-center border border-neutral-800 px-4 py-2 rounded-lg gap-2 w-full'
    >
      <LandBanner banner={details.banner} variant="xs" />
      <div className="flex flex-col w-full">
        <Typography className="text-base">
          {name}
        </Typography>
        {title && (
          <FormattedText as="span" text={title} />
        )}
      </div>
    </Link>
  )
}

const LandSimilarList = reatomComponent(({ ctx }) => {
  if (!ctx.spy(pageState.isClientside) || ctx.spy(land.fetchSimilar.statusesAtom).isPending) {
    return <LandSimilarSkeleton />
  }

  const error = ctx.spy(land.fetchSimilar.errorAtom)
  if (error) return null;

  const data = ctx.spy(land.fetchSimilar.dataAtom)
  if (!data) return <Noop />

  return data.map((land) => <LandSimilarListItem key={land.ulid} {...land} />)
}, "LandSimilarList")

const LandSimilar = () => {
  useUpdate(land.fetchSimilar, [landState.data]);

  return (
    <div className="flex flex-col gap-2 w-full">
      <Typography className={sectionTitleVariant}>
        {translate["land.similar-lands"]()}
      </Typography>
      <div className='flex flex-col gap-1 w-full'>
        <LandSimilarList />
      </div>
    </div>
  )
}

const LandPoints = reatomComponent(({ ctx }) => {
  const land = ctx.spy(landState.data);
  if (!land) return null;

  const points = land?.points
  if (!points) return null;

  const pointsCount = Object.keys(points).length
  if (pointsCount === 0) return null;

  return (
    <div id="points" className="flex flex-col gap-2">
      <div className="flex items-center gap-2 w-full">
        <Typography className={sectionTitleVariant}>
          {translate["land.points"]()}
        </Typography>
        <SummaryNumber value={pointsCount} />
      </div>
      <div className="grid grid-cols-2 w-full h-full gap-4">
        {Object.entries(points).map(([key, value]) => (
          <div key={key} className="flex flex-col p-4 rounded-lg border border-neutral-800">
            <Typography className="text-base">
              {key}
            </Typography>
            <Typography color="gray" className="text-sm">
              {value.x} {value.y}
            </Typography>
          </div>
        ))}
      </div>
    </div>
  )
}, "LandPoints")

export const Land = () => {
  return (
    <div className="flex flex-col xl:flex-row items-start gap-6 w-full h-full relative">
      <div className="flex flex-col gap-6 w-full xl:w-3/4 h-full">
        <div className="flex items-start gap-3 xl:gap-6 w-full h-full">
          <LandBannerWithEditing />
          <div className="flex flex-col gap-2 w-full h-full">
            <LandHead />
            <LandDetails />
          </div>
        </div>
        <LandGallery />
        <LandPoints />
      </div>
      <div className="flex flex-col gap-6 w-full xl:w-1/4 sticky top-2 h-full">
        <LandLinks />
        <LandMembers />
        <LandSimilar />
      </div>
    </div>
  )
}
