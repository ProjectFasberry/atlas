import { reatomComponent, useUpdate } from "@reatom/npm-react";
import { Typography } from "@/shared/ui/typography"
import { Icon, type IconName } from "@/shared/ui/icon"
import { Button } from "@/shared/ui/button";
import { tv } from "tailwind-variants";
import { Skeleton } from "@/shared/ui/skeleton";
import { connectionsModel, type ConnectionsAvailablePayload } from "../models/settings-connections.model";
import { SettingsContentWrapper } from "./ui";
import { action, onDisconnect, spawn } from "@reatom/framework";
import { SOCIALS_ICONS } from "@/shared/consts/icons";
import { IconLoader } from "@/shared/ui/icon-loader";
import { Dialog } from "@ark-ui/react/dialog";
import { Portal } from "@ark-ui/react/portal";
import { dialogVariant, DialogClose } from "@/shared/ui/dialog";
import type { PlayerSocialsItem } from "../../player/models/socials.model";
import { dayjs } from "@/shared/lib/dayjs";
import { translate } from "@/shared/locales/helpers";
import { toast } from "sonner";
import { ErrorBlock } from "@/shared/ui/error-block";

const {
  getConnectionStatusAtom,
  connections,
  connectionsControl,
  connectionIsProcessingAtom,
  connectionsState
} = connectionsModel()

const connectionsListItemVariant = tv({
  base: `flex items-center justify-between gap-3 border rounded-xl border-neutral-700 p-3 w-full`
})

const SOCIAL_LABEL_KEYS = {
  discord: "settings.connections.socials.discord",
  telegram: "settings.connections.socials.telegram",
} as const

const socialLabel = (social: string) => {
  const key = SOCIAL_LABEL_KEYS[social as keyof typeof SOCIAL_LABEL_KEYS]

  return key ? translate[key]() : social
}

const socialIcon = (social: string): IconName => SOCIALS_ICONS[social] ?? "sprite:language"

onDisconnect(connectionsState.isOpen, (ctx) => {
  connectionsControl.onClose(ctx)
})

const ConnectionsRetry = reatomComponent<{ onRetry: () => void }>(({ ctx, onRetry }) => {
  return (
    <div className="flex flex-col items-start gap-2 rounded-lg bg-red-500/10 px-3 py-2">
      <Typography className="text-sm text-red-300">
        {translate["settings.connections.load-error"]()}
      </Typography>
      <Button background="default" className="h-8 text-xs font-semibold" onClick={onRetry}>
        {translate["shared.retry"]()}
      </Button>
    </div>
  )
}, "ConnectionsRetry")

const ConnectionsAddDialog = reatomComponent(({ ctx }) => {
  const isOpen = ctx.spy(connectionsState.isOpen)
  const isPending = ctx.spy(connectionsControl.addWrapper.statusesAtom).isPending
  const error = ctx.spy(connectionsControl.addWrapper.errorAtom)
  const payload = ctx.spy(connectionsState.payload)
  const processingSocial = ctx.spy(connectionsState.processingSocial)
  const target = payload?.target ?? processingSocial ?? ""

  const handleOpenChange = ({ open }: { open: boolean }) => {
    if (!open && isPending) return

    connectionsState.isOpen(ctx, open)
  }

  const copyCode = () => {
    if (!payload) return

    navigator.clipboard.writeText(payload.payload)
      .then(() => toast.success(translate["shared.copy.success"]()))
      .catch(() => toast.error(translate["settings.connections.errors.generic"]()))
  }

  const checkConnection = () => {
    if (!target) return

    spawn(ctx, async (spawnCtx) => {
      connections.fetchList.cacheAtom.reset(spawnCtx)
      const list = await connections.fetchList(spawnCtx)

      if (list?.some((item) => item.social === target)) {
        toast.success(translate["settings.connections.connected"]())
        connectionsState.isOpen(spawnCtx, false)
        return
      }

      toast.error(translate["settings.connections.not-connected"]())
    })
  }

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={handleOpenChange}
    >
      <Portal>
        <Dialog.Backdrop className={dialogVariant.backdrop()} />
        <Dialog.Positioner className={dialogVariant.positioner()}>
          <Dialog.Content className={dialogVariant.content("sm:max-w-md")}>
            <DialogClose />
            <div className="flex w-full flex-col gap-1 pr-10">
              <Dialog.Title className={dialogVariant.title("text-left")}>
                {translate["settings.connections.dialog.title"]({ social: socialLabel(target) })}
              </Dialog.Title>
              <Typography color="gray" className="text-sm">
                {translate["settings.connections.dialog.subtitle"]()}
              </Typography>
            </div>
            <div className="flex w-full flex-col gap-4">
              {isPending && !payload && (
                <div className="flex flex-col items-center gap-2 py-4">
                  <IconLoader />
                  <Typography color="gray" className="text-sm">
                    {translate["settings.connections.dialog.waiting"]()}
                  </Typography>
                </div>
              )}
              {error && !isPending && (
                <div className="flex flex-col gap-2">
                  <ErrorBlock title={error.message} raw />
                  <Button
                    background="default"
                    className="h-8 w-fit text-xs font-semibold"
                    onClick={() => target && connectionsControl.addWrapper(ctx, target)}
                  >
                    {translate["shared.retry"]()}
                  </Button>
                </div>
              )}
              {payload && !isPending && (
                <div className="flex flex-col gap-3 rounded-xl bg-neutral-800/60 p-4">
                  <Typography className="text-sm font-semibold">
                    {translate["settings.connections.dialog.send-code"]()}
                  </Typography>
                  <div className="flex items-center justify-between gap-2">
                    <code className="rounded-lg bg-neutral-950 px-4 py-2 text-2xl font-semibold
                      tracking-[0.3em] text-neutral-50">
                      {payload.payload}
                    </code>
                    <Button
                      background="default"
                      aria-label={translate["settings.connections.dialog.copy"]()}
                      title={translate["settings.connections.dialog.copy"]()}
                      className="size-9 shrink-0 p-0"
                      onClick={copyCode}
                    >
                      <Icon name="sprite:copy" className="size-4" />
                    </Button>
                  </div>
                  <Typography color="gray" className="text-xs">
                    {translate["settings.connections.dialog.expires"]()}
                  </Typography>
                </div>
              )}
            </div>
            <div className="flex w-full items-center justify-end gap-2 border-t border-neutral-800 pt-4">
              <Button
                background="white"
                className="font-semibold"
                onClick={checkConnection}
                disabled={!target || isPending}
              >
                {translate["settings.connections.dialog.check"]()}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}, "ConnectionsAddDialog")

const ConnectionsAvailableItem = reatomComponent<ConnectionsAvailablePayload[number]>(({ ctx, title, social }) => {
  const isProcessing = ctx.spy(connectionIsProcessingAtom(social));

  return (
    <Button
      title={title}
      aria-label={title}
      disabled={isProcessing}
      onClick={() => connectionsControl.addWrapper(ctx, social)}
      className="p-0 overflow-hidden relative bg-neutral-800 aspect-square h-12 max-h-12 gap-2"
    >
      {isProcessing && (
        <div className="absolute flex items-center justify-center w-full h-full inset-0 z-1 bg-black/60">
          <Icon name="sprite:loader-2" className="size-4 animate-spin duration-300 text-neutral-50" />
        </div>
      )}
      <Icon name={socialIcon(social)} className="size-6" />
    </Button>
  )
}, "ConnectionsAvailableItem")

const ConnectionsAvailableList = reatomComponent(({ ctx }) => {
  if (ctx.spy(connections.fetchAvailable.errorAtom)) {
    return (
      <ConnectionsRetry
        onRetry={() => spawn(ctx, (spawnCtx) => {
          connections.fetchAvailable.cacheAtom.reset(spawnCtx)
          connections.fetchAvailable(spawnCtx)
        })}
      />
    )
  }

  if (ctx.spy(connections.fetchAvailable.statusesAtom).isPending) {
    return Array.from({ length: 2 }).map((_, idx) => <Skeleton key={idx} className="size-12" />)
  }

  const data = ctx.spy(connections.fetchAvailable.dataAtom)

  if (!data) {
    return (
      <Typography color="gray" className="text-sm">
        {translate["settings.connections.all-connected"]()}
      </Typography>
    )
  }

  return data.map((item) => <ConnectionsAvailableItem key={item.social} {...item} />)
}, "ConnectionsAvailableList")

const ConnectionsListItem = reatomComponent<PlayerSocialsItem>(({ ctx, social, created_at, value }) => {
  const isLoading = ctx.spy(getConnectionStatusAtom(social));

  return (
    <div className={connectionsListItemVariant()}>
      <div className="flex min-w-0 items-center gap-3">
        <Icon name={socialIcon(social)} className="size-8 shrink-0" />
        <div className="flex min-w-0 flex-col">
          <Typography className="truncate text-base font-semibold leading-4!">
            {socialLabel(social)}
          </Typography>
          <Typography color="gray" className="truncate text-sm leading-4">
            {value}
          </Typography>
          {created_at && (
            <Typography color="gray" className="truncate text-xs leading-4">
              {translate["settings.connections.connected-at"]({
                date: dayjs(created_at).format("DD.MM.YYYY")
              })}
            </Typography>
          )}
        </div>
      </div>
      <Button
        background="default"
        aria-label={translate["settings.connections.remove"]()}
        title={translate["settings.connections.remove"]()}
        className="h-8 w-8 shrink-0 rounded-lg p-0 aspect-square *:size-4"
        onClick={() => connectionsControl.removeBefore(ctx, social)}
        disabled={isLoading}
      >
        {isLoading
          ? <Icon name="sprite:loader-2" className="animate-spin duration-300" />
          : <Icon name="sprite:x" />
        }
      </Button>
    </div>
  )
}, "ConnectionsListItem")

const ConnectionsList = reatomComponent(({ ctx }) => {
  if (ctx.spy(connections.fetchList.errorAtom)) {
    return (
      <ConnectionsRetry
        onRetry={() => spawn(ctx, (spawnCtx) => {
          connections.fetchList.cacheAtom.reset(spawnCtx)
          connections.fetchList(spawnCtx)
        })}
      />
    )
  }

  if (ctx.spy(connections.fetchList.statusesAtom).isPending) {
    return Array.from({ length: 2 }).map((_, idx) => <Skeleton key={idx} className="h-20 w-full" />)
  }

  const data = ctx.spy(connections.fetchList.dataAtom)

  if (!data.length) {
    return (
      <Typography color="gray" className="text-sm">
        {translate["settings.connections.empty"]()}
      </Typography>
    )
  }

  return data.map((social) => <ConnectionsListItem key={social.social} {...social} />)
}, "ConnectionsList")

const onMainConnections = action((ctx) => {
  connections.fetchAvailable(ctx)
  connections.fetchList(ctx)
})

export const SettingsMainConnections = () => {
  useUpdate(onMainConnections, []);

  return (
    <SettingsContentWrapper
      title={translate["settings.connections.title"]()}
      description={translate["settings.connections.description"]()}
    >
      <div className="flex flex-col gap-3 w-full">
        <Typography className="text-lg leading-5 font-semibold">
          {translate["settings.connections.sections.add-connection.title"]()}
        </Typography>
        <ConnectionsAddDialog />
        <div className="flex items-center justify-start w-full gap-2 flex-wrap">
          <ConnectionsAvailableList />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 auto-rows-auto gap-2">
        <ConnectionsList />
      </div>
    </SettingsContentWrapper>
  )
}
