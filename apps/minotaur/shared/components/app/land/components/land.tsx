import { reatomComponent, useUpdate } from "@reatom/npm-react"
import { land, landState, landBannerAtom, landGalleryAtom, landIsOwnerAtom } from "../models/land.model"
import { Avatar } from "@/shared/ui/avatar"
import { Typography } from "@/shared/ui/typography"
import { Link } from "@/shared/components/config/link/link"
import { FormattedText } from "./land-title"
import { Icon } from "@/shared/ui/icon"
import { Button } from "@/shared/ui/button"
import { changesIsExistsAtom, landActionTitleAtom, landEditing, landEditingState } from "../models/edit-land.model"
import { LandBanner, LandBannerWithEditing } from "./land-banner"
import { Carousel } from '@ark-ui/react/carousel'
import { getDataFromSnapshot } from "@/shared/models/app/utils"
import { isEmptyArray } from "@/shared/lib/utils"
import { tv } from "tailwind-variants"
import { carouselVariant } from "@/shared/ui/carousel"
import { createLink } from "@/shared/components/config/link/link.model"
import { Skeleton } from "@/shared/ui/skeleton"
import { pageState } from "@/shared/models/page-context.model"
import { Noop } from "@/shared/ui/noop"
import { SummaryNumber } from "@/shared/ui/summary-number"
import { translate } from "@/shared/locales/helpers"
import type { LandSimilar } from "../../lands/models/lands.model"
import { LandAccess } from "./land-access"
import { ClientOnly } from "vike-react/ClientOnly"

const LandGallery = reatomComponent(({ ctx }) => {
  const landGallery = ctx.spy(landGalleryAtom)
  const editing = ctx.spy(landEditingState.mode) === 1
  const removed = ctx.spy(landEditingState.galleryRemoved)
  const pending = ctx.spy(landEditingState.galleryFiles)

  if (editing) {
    const existing = landGallery.filter((url) => !removed.includes(url))
    const canAdd = existing.length + pending.length < 3

    return (
      <div className="flex flex-col gap-2">
        <Typography className="text-base sm:text-2xl font-semibold">
          {translate["land.gallery.title"]()}
        </Typography>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {existing.map((url) => (
            <div key={url} className="relative aspect-video overflow-hidden rounded-lg bg-neutral-800">
              <img src={url} className="h-full w-full object-cover" alt="" />
              <button
                type="button"
                title={translate["land.gallery.remove"]()}
                className="absolute right-1 top-1 flex size-7 items-center justify-center rounded-lg bg-black/70 text-neutral-200 hover:text-white"
                onClick={() => landEditing.gallery.removeExisting(ctx, url)}
              >
                <Icon name="sprite:x" className="size-4" />
              </button>
            </div>
          ))}
          {pending.map((item, idx) => (
            <div key={item.preview} className="relative aspect-video overflow-hidden rounded-lg bg-neutral-800">
              <img src={item.preview} className="h-full w-full object-cover" alt="" />
              <button
                type="button"
                title={translate["land.gallery.remove-pending"]()}
                className="absolute right-1 top-1 flex size-7 items-center justify-center rounded-lg bg-black/70 text-neutral-200 hover:text-white"
                onClick={() => landEditing.gallery.removePending(ctx, idx)}
              >
                <Icon name="sprite:x" className="size-4" />
              </button>
            </div>
          ))}
          {canAdd && (
            <label className="flex aspect-video items-center justify-center rounded-lg border border-dashed border-neutral-700 text-neutral-500 cursor-pointer hover:border-neutral-500">
              <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              className="hidden"
                onChange={(e) => {
                  landEditing.gallery.add(ctx, e.target.files)
                  e.currentTarget.value = ""
                }}
              />
              <Icon name="sprite:plus" className="size-5" />
            </label>
          )}
        </div>
        <span className="text-[11px] text-neutral-500">
          {translate["land.gallery.hint"]()}
        </span>
      </div>
    )
  }

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
        <Button background="white" onClick={() => {
          if (ctx.get(landEditingState.mode) === 0) landEditing.start(ctx)
          else landEditing.resetFull(ctx)
        }}>
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

  const isOwner = ctx.spy(landIsOwnerAtom);

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
            {land?.members.length === 1
              ? translate["land.member-count"]({ count: land.members.length })
              : translate["land.member-count-other"]({ count: land?.members.length ?? 0 })}
          </Typography>
        )}
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

  const editing = ctx.spy(landEditingState.mode) === 1
  const title = ctx.spy(landEditingState.title)

  return (
    <>
      <Typography className="text-2xl xl:text-3xl font-semibold">
        {land.name}
      </Typography>
      {editing && (
        <div className="flex flex-col gap-1 w-full">
          <textarea
            value={title}
            onChange={(e) => landEditingState.title(ctx, e.target.value)}
            maxLength={300}
            placeholder={translate["land.title-placeholder"]()}
            className="
              px-4 py-2 min-h-20 text-sm rounded-xl placeholder:text-neutral-400
              bg-neutral-800 border outline-none border-transparent resize-y
              focus-within:ring-2 focus-within:ring-inset focus-within:ring-green-500
            "
          />
          <span className="text-[11px] text-neutral-500">
            {translate["land.color-codes"]()}
          </span>
          {title && <FormattedText as="span" text={title} />}
        </div>
      )}
      {!editing && land.title && <FormattedText as="span" text={land.title} />}
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
      </div>
      <div className="flex flex-col gap-6 w-full xl:w-1/4 sticky top-2 h-full">
        <LandLinks />
        <LandMembers />
        <LandSimilar />
      </div>
    </div>
  )
}
