import { atom, spawn } from "@reatom/framework";
import { tv } from "tailwind-variants";
import { reatomComponent, useUpdate } from "@reatom/npm-react";
import { Skeleton } from "@/shared/ui/skeleton";
import { Typography } from "@/shared/ui/typography"
import React from "react";
import { Icon, type IconName } from "@/shared/ui/icon"
import { pageState } from "@/shared/models/page-context.model";
import { Button } from "@/shared/ui/button";
import { type SkinAnimationType, skinModel, type SkinVariant, type SkinsHistory } from "../models/skin.model";
import { getStaticImage } from "@/shared/lib/helpers";
import { translate } from "@/shared/locales/helpers";
import { dayjs } from "@/shared/lib/dayjs";
import { ReactSkinview3d } from "react-skinview3d"
import { ClientOnly } from "vike-react/ClientOnly"
import { appState } from "@/shared/models/app/index.model";
import { Dialog, DialogTitle } from "@ark-ui/react/dialog";
import { Portal } from "@ark-ui/react/portal";
import { dialogVariant } from "@/shared/ui/dialog";
import { Noop } from "@/shared/ui/noop";

const {
  getIsSelectSkinAtom,
  getSkinVariantIsActiveAtom,
  skinSubmitIsDisabledAtom,
  getIsUploadAvailableAtom,
  skins,
  skinsState,
  skin,
  SKIN_VARIANTS
} = skinModel()

const SkinRenderSkeleton = () => (
  <div className="flex items-center justify-center px-6 w-full rounded-lg h-[390px]">
    <Skeleton className="w-full h-full" />
  </div>
)

const SkinRender = reatomComponent(({ ctx }) => {
  useUpdate(skins.init, []);

  if (!ctx.spy(pageState.isClientside) || ctx.spy(skins.fetch.statusesAtom).isPending) {
    return <SkinRenderSkeleton />;
  }

  const skinData = ctx.spy(skinsState.selected);
  if (!skinData) return (
    <div className="flex items-center h-[390px] justify-center overflow-hidden w-full">
      <Noop title={translate["player.skin.nothing"]()} />
    </div>
  )

  return (
    <div className="flex items-center h-[390px] justify-center overflow-hidden w-full">
      {ctx.spy(appState.inited.hardwaveIsEnabled) ? (
        <ClientOnly fallback={<SkinRenderSkeleton />}>
          {skinData.skin_url && (
            <ReactSkinview3d
              skinUrl={skinData.skin_url}
              height="390"
              width="300"
              options={{ zoom: 0.8 }}
              onReady={({ viewer }) => skin.animation.viewer(ctx, viewer)}
            />
          )}
        </ClientOnly>
      ) : (
        <div className="flex w-full px-2 py-6 items-center justify-center h-full">
          <Typography color="gray" className="text-lg truncate text-center whitespace-pre-wrap">
            {translate["player.skin.hardware-off"]()}
          </Typography>
        </div>
      )}
    </div>
  );
}, "SkinRender")

const skinControlInputAtom = atom<HTMLInputElement | null>(null, "skinControlInput")
const skinControlDragAtom = atom(false, "skinControlDrag")

const skinHeadVariant = tv({
  base: `flex items-center select-none justify-center *:rounded-lg p-0.5 aspect-square rounded-lg overflow-hidden cursor-pointer border-2`,
  variants: {
    status: {
      active: "border-green-600",
      inactive: "border-neutral-600"
    },
    variant: {
      default: "border-2",
      unbordered: "border-none"
    },
    size: {
      small: "w-12 h-12",
      medium: "w-32 h-32"
    }
  },
  defaultVariants: {
    status: "inactive",
    size: "small",
    variant: "default"
  }
})

const SKINS_HISTORY_AVATAR_SIZES = [128, 36]

const SkinsHistoryItem = reatomComponent<SkinsHistory & { variant: "mobile" | "desktop" }>(({
  ctx, variant, skin_head_url, skin_url, skin_identifier: identifier, skin_variant, timestamp
}) => {
  if (!skin_head_url) return null;

  const selectedSkin = ctx.spy(skinsState.selected);

  const handleClick = () => {
    skinsState.selected(ctx, {
      identifier,
      skin_url: skin_url ?? null,
      skin_head_url: skin_head_url ?? null
    })
  }

  const status = selectedSkin?.identifier.toLowerCase() === identifier.toLowerCase()
    ? "active"
    : "inactive"

  const changedAt = dayjs(timestamp * 1000).format("DD.MM.YYYY HH:mm")

  return (
    <button
      type="button"
      className={`${skinHeadVariant({ status, size: "small" })} bg-transparent`}
      onClick={handleClick}
      title={changedAt}
      aria-label={`${identifier}, ${changedAt}`}
    >
      <Avatar
        src={skin_head_url}
        width={variant === 'mobile' ? SKINS_HISTORY_AVATAR_SIZES[0] : SKINS_HISTORY_AVATAR_SIZES[1]}
        height={variant === 'mobile' ? SKINS_HISTORY_AVATAR_SIZES[0] : SKINS_HISTORY_AVATAR_SIZES[1]}
      />
    </button>
  )
}, "SkinsHistoryItem")

const SkinsHistoryListSkeleton = () => {
  return (
    <>
      <div className={skinHeadVariant({ status: "active" })}>
        <Skeleton className="h-full w-full" />
      </div>
      <div className={skinHeadVariant({ status: "inactive" })}>
        <Skeleton className="h-full w-full" />
      </div>
      <div className={skinHeadVariant({ status: "inactive" })}>
        <Skeleton className="h-full w-full" />
      </div>
    </>
  )
}

const SkinsHistoryList = reatomComponent<{ variant: "mobile" | "desktop" }>(({ ctx, variant }) => {
  if (!ctx.spy(pageState.isClientside) || ctx.spy(skins.fetch.statusesAtom).isPending) {
    return <SkinsHistoryListSkeleton />
  }

  const data = ctx.spy(skins.fetch.dataAtom)
  if (!data) return null;

  return data.map(item => (
    <SkinsHistoryItem
      key={item.skin_identifier}
      variant={variant}
      skin_head_url={item.skin_head_url}
      skin_identifier={item.skin_identifier}
      skin_url={item.skin_url}
      skin_variant={item.skin_variant}
      timestamp={item.timestamp}
    />
  ))
}, "SkinsHistoryList")

const SkinMainHeadSkeleton = () => (
  <div className={skinHeadVariant({ status: "active", size: "medium", variant: "unbordered" })}>
    <Skeleton className="h-full w-full" />
  </div>
)

const FALLBACK_AVATAR = getStaticImage("fallback/steve_head.png");

const Avatar = reatomComponent<{ width: number, height: number, src: string }>(({ ctx, src, ...props }) => {
  return (
    <img
      src={src || FALLBACK_AVATAR}
      alt=""
      onError={(event) => { event.currentTarget.src = FALLBACK_AVATAR }}
      {...props}
    />
  )
}, "Avatar")

const SkinMainHead = reatomComponent(({ ctx }) => {
  if (!ctx.spy(pageState.isClientside) || ctx.spy(skins.fetch.statusesAtom).isPending) {
    return <SkinMainHeadSkeleton />
  }

  const data = ctx.spy(skinsState.selected)
  if (!data) return null;

  return (
    <div className={skinHeadVariant({ status: "active", size: "medium", variant: "unbordered" })}>
      <Avatar src={data.skin_head_url!} width={128} height={128} />
    </div>
  )
}, "SkinMainHead")

const skinControlVariants = tv({
  base: `flex items-center justify-center cursor-pointer
    border border-neutral-800 rounded-xl min-w-10 min-h-10 h-10 w-10`,
  variants: {
    variant: {
      default: "bg-transparent",
      active: "bg-neutral-700/80"
    }
  },
  defaultVariants: {
    variant: "default"
  }
})

const SkinVariantItem = reatomComponent<{ variant: SkinVariant }>(({ ctx, variant }) => {
  return (
    <Button
      onClick={() => skinsState.control.variant(ctx, variant)}
      background={ctx.spy(getSkinVariantIsActiveAtom(variant)) ? "white" : "default"}
      className="flex items-center h-10 capitalize tracking-6 text-sm justify-center w-full"
      aria-pressed={ctx.spy(getSkinVariantIsActiveAtom(variant))}
    >
      {translate[variant === "classic" ? "player.skin.variants.classic" : "player.skin.variants.slim"]()}
    </Button>
  )
}, "SkinVariantItem")

const va = tv({
  base: `flex items-center flex-col py-6 px-4 duration-300 hover:bg-neutral-800/60 cursor-pointer gap-2
    border-2 border-dashed border-neutral-800 w-full rounded-lg`
})

const SelectedSkinData = reatomComponent(({ ctx }) => {
  if (ctx.spy(skins.control.setupSkinData.statusesAtom).isPending) {
    return (
      <div className={va()}>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9" />
            <div className='flex flex-col gap-1'>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-2 w-16" />
            </div>
          </div>
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    )
  }

  const data = ctx.spy(skinsState.control.fileData)
  if (!data) return null;

  return (
    <div className={va()}>
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9">
            <img src={data.url} draggable={false} width={36} height={36} alt="" />
          </div>
          <div className='flex flex-col gap-1 min-w-0'>
            <Typography className='leading-3 truncate font-semibold text-sm'>
              {data.name}
            </Typography>
            <Typography className="text-neutral-400 text-sm">
              {data.size >= 1024 * 1024
                ? `${(data.size / 1024 / 1024).toFixed(1)} MB`
                : `${Math.max(1, Math.round(data.size / 1024))} KB`}
            </Typography>
          </div>
        </div>
        <Icon
          name='sprite:x'
          className="text-neutral-400 size-5"
          onClick={() => skinsState.control.file.reset(ctx)}
        />
      </div>
    </div>
  )
}, "SelectedSkinData")

const SkinControlInput = reatomComponent(({ ctx }) => {
  const drag = ctx.spy(skinControlDragAtom);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    skinControlDragAtom(ctx, true);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    skinControlDragAtom(ctx, false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    void spawn(ctx, (spawnCtx) => skinsState.control.file(spawnCtx, file))
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target || !e.target.files) return;

    const file = e.target.files[0];
    if (!file) return;

    spawn(ctx, (spawnCtx) => skinsState.control.file(spawnCtx, file))
  }

  return (
    <>
      <input ref={(element) => { skinControlInputAtom(ctx, element) }} onChange={onChange} type="file" accept="image/png" className="hidden" />
      <button
        type="button"
        onClick={() => ctx.get(skinControlInputAtom)?.click()}
        onDragOver={onDragOver}
        onDragLeave={() => skinControlDragAtom(ctx, false)}
        onDrop={onDrop}
        aria-label={translate["player.skin.upload.drop"]()}
        className={va({ className: `${drag && "bg-neutral-800"}` })}
      >
        <div className='flex items-center justify-center rounded-lg h-10 w-10 border border-neutral-800'>
          <Icon name="sprite:upload" className="size-6 text-neutral-400" />
        </div>
        <Typography className="font-semibold tracking-6">
          {translate["player.skin.upload.drop"]()}
        </Typography>
      </button>
    </>
  )
}, 'SkinControlInput')

const SkinControlContent = reatomComponent(({ ctx }) => {
  const error = ctx.spy(skinsState.control.fileError)

  return (
    <div className="flex flex-col gap-2 w-full">
      {ctx.spy(skinsState.control.file) ? <SelectedSkinData /> : <SkinControlInput />}
      {error && (
        <Typography role="alert" className="text-sm text-red-400">
          {translate["player.skin.errors.invalid-file"]()}
        </Typography>
      )}
    </div>
  )
}, "SkinControlContent")

const SkinControlChangeSubmit = reatomComponent(({ ctx }) => {
  return (
    <Button
      disabled={ctx.spy(skinSubmitIsDisabledAtom)}
      onClick={() => spawn(ctx, (spawnCtx) => skins.control.change(spawnCtx))}
      background="default"
      className="text-sm font-semibold"
      withSpinner={true}
      isLoading={ctx.spy(skins.control.change.statusesAtom).isPending}
    >
      {translate["player.skin.upload.submit"]()}
    </Button>
  )
}, "SkinControlChangeSubmit")

const SkinSelectVariant = () => {
  return (
    <div className="flex gap-2 items-center justify-between w-full">
      {SKIN_VARIANTS.map((d) => <SkinVariantItem key={d} variant={d} />)}
    </div>
  )
}

const SkinControlChangeSkin = reatomComponent(({ ctx }) => {
  const isVisible = ctx.spy(getIsUploadAvailableAtom)
  if (!isVisible) return null;

  const steps = [
    {
      title: translate["player.skin.upload.step-file"](),
      description: translate["player.skin.upload.step-file-desc"](),
      content: <SkinControlContent />,
    },
    {
      title: translate["player.skin.upload.step-variant"](),
      description: null,
      content: <SkinSelectVariant />,
    },
  ]

  return (
    <Dialog.Root
      open={ctx.spy(skinsState.control.isOpen)}
      onOpenChange={v => skinsState.control.isOpen(ctx, v.open)}
    >
      <Dialog.Trigger asChild>
        <Button
          className={skinControlVariants({ variant: "default", className: "p-0 hover:bg-neutral-800" })}
          aria-label={translate["player.skin.upload.title"]()}
          title={translate["player.skin.upload.title"]()}
        >
          <Icon name="sprite:upload" className="size-4" />
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop className={dialogVariant.backdrop()} />
        <Dialog.Positioner className={dialogVariant.positioner()}>
          <Dialog.Content className={dialogVariant.content("sm:max-w-1/3 sm:max:h-2/3")}>
            <DialogTitle className={dialogVariant.title()}>
              {translate["player.skin.upload.title"]()}
            </DialogTitle>
            <div className="flex flex-col gap-6 w-full">
              {steps.map((step, idx) => (
                <div key={idx} className='flex flex-col items-start gap-2 w-full'>
                  <div className="flex flex-col">
                    <Typography className="font-bold leading-4 tracking-6">
                      {step.title}
                    </Typography>
                    {step.description && (
                      <Typography color="gray" className="text-sm">
                        {step.description}
                      </Typography>
                    )}
                  </div>
                  {step.content}
                </div>
              ))}
              <SkinControlChangeSubmit />
            </div>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}, 'SkinControlChangeSkin')

const SkinSetButton = reatomComponent(({ ctx }) => {
  const isVisible = ctx.spy(getIsSelectSkinAtom)
  if (!isVisible) return null;

  return (
    <Button
      className={skinControlVariants({ variant: "default", className: "p-0 hover:bg-neutral-800" })}
      onClick={() => skins.control.set(ctx)}
      disabled={ctx.spy(skins.control.set.statusesAtom).isPending}
      aria-label={translate["player.skin.select"]()}
      title={translate["player.skin.select"]()}
    >
      <Icon name="sprite:plus" className="size-4" />
    </Button>
  )
}, "SkinSetButton")

const SkinControlRotate = reatomComponent(({ ctx }) => {
  const variant = ctx.spy(skin.animation.isRotate) ? "active" : "default"

  return (
    <button
      type="button"
      key="rotate"
      onClick={() => skin.animation.isRotate(ctx, (state) => !state)}
      aria-label={translate["player.skin.controls.rotate"]()}
      className={skinControlVariants({ variant })}
    >
      <Icon name="sprite:rotate" className="size-4" />
    </button>
  )
}, "SkinControlRotate")

const SKIN_ANIMATIONS: { animation: SkinAnimationType; icon: IconName }[] = [
  { animation: "idle", icon: "sprite:man" },
  { animation: "run", icon: "sprite:run", },
  { animation: "flying", icon: "sprite:butterfly" },
];

const SkinControlsListItem = reatomComponent<typeof SKIN_ANIMATIONS[number]>(({ ctx, animation, icon }) => {
  const variant = (animation: typeof SKIN_ANIMATIONS[number]["animation"]) => ctx.spy(skin.animation.type) === animation
    ? "active" : "default"

  return (
    <button
      type="button"
      onClick={() => skin.animation.type(ctx, animation)}
      aria-label={translate[
        animation === "idle"
          ? "player.skin.controls.idle"
          : animation === "run"
            ? "player.skin.controls.run"
            : "player.skin.controls.flying"
      ]()}
      className={skinControlVariants({ variant: variant(animation) })}
    >
      <Icon name={icon} className="size-4" />
    </button>
  )
}, "SkinControlsListItem")

const SkinControlsList = () =>
  SKIN_ANIMATIONS.map((control, i) => <SkinControlsListItem key={i} {...control} />)

export const PlayerSkin = () => {
  return (
    <div className="flex flex-col h-full gap-4 w-full">
      <div className="flex flex-col justify-between w-full lg:min-h-[450px] lg:border lg:border-neutral-600 rounded-xl">
        <div className="flex flex-col order-last lg:order-first py-4 items-center gap-2 w-full h-full">
          <div className="hidden lg:flex w-full">
            <SkinRender />
          </div>
          <div className="flex items-center justify-center gap-2 w-full h-full">
            <SkinsHistoryList variant="desktop" />
          </div>
        </div>
        <div className="flex lg:hidden lg:order-last justify-center items-center w-full">
          <SkinMainHead />
        </div>
      </div>
      <div className="hidden lg:flex flex-col items-center w-full justify-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center gap-1 w-full">
            <SkinControlsList />
            <SkinControlRotate />
          </div>
          <div className='flex items-center gap-1'>
            <SkinControlChangeSkin />
            <SkinSetButton />
          </div>
        </div>
      </div >
    </div>
  )
}
