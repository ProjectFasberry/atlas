import { Button } from "@/shared/ui/button";
import { reatomComponent, useUpdate } from "@reatom/npm-react";
import { sessions, sessionsState, type SessionPayload } from "../models/settings-security.model";
import { Skeleton } from "@/shared/ui/skeleton";
import { isEmptyArray } from "@/shared/lib/utils";
import { Typography } from "@/shared/ui/typography";
import { Icon, type IconName } from "@/shared/ui/icon";
import { spawn } from "@reatom/framework";
import { translate } from "@/shared/locales/helpers";
import { alertDialog } from "@/shared/components/config/alert-dialog/alert-dialog.model";
import { dayjs } from "@/shared/lib/dayjs";

const PLATFORM_ICONS: Record<string, IconName> = {
  "desktop": "sprite:device-desktop",
  "mobile": "sprite:device-mobile",
  "tablet": "sprite:device-mobile",
  "unknown": "sprite:question-mark"
}

const SessionItemTrigger = ({ session, current }: { session: SessionPayload, current?: boolean }) => {
  const { browser, os, platform, ip, created_at, last_seen, new_device } = session;
  const platformIcon = PLATFORM_ICONS[platform?.type ?? "unknown"] ?? PLATFORM_ICONS["unknown"];
  const browserLabel = [browser.name, browser.version].filter(Boolean).join(" ")
    || translate["settings.devices.sections.sessions.unknown-device"]();
  const osLabel = [os?.name, os?.versionName].filter(Boolean).join(" ");
  const createdAt = dayjs(created_at).format("DD.MM.YYYY HH:mm");
  const lastSeen = dayjs(last_seen).format("DD.MM.YYYY HH:mm");

  return (
    <div className="flex w-full items-center gap-3 overflow-hidden rounded-lg px-2 py-2
      duration-300 hover:bg-neutral-800">
      <div className="flex aspect-square size-11 shrink-0 items-center justify-center
        rounded-full bg-neutral-700">
        <Icon name={platformIcon} className="size-6" />
      </div>
      <div className="flex min-w-0 flex-col justify-center">
        <div className="flex min-w-0 items-center gap-2">
          <Typography className="truncate font-medium leading-5">{browserLabel}</Typography>
          {current && (
            <span className="shrink-0 rounded bg-green-500/15 px-1.5 py-0.5
              text-[10px] font-semibold uppercase text-green-400">
              {translate["settings.devices.sections.sessions.this-device"]()}
            </span>
          )}
          {new_device && (
            <span className="shrink-0 rounded bg-amber-500/15 px-1.5 py-0.5
              text-[10px] font-semibold uppercase text-amber-400">
              {translate["settings.devices.sections.sessions.new-device"]()}
            </span>
          )}
        </div>
        <Typography color="gray" className="truncate text-sm leading-4">
          {osLabel ? `${osLabel} · ${ip}` : ip}
        </Typography>
        <Typography color="gray" className="truncate text-xs leading-4">
          {translate["settings.devices.sections.sessions.created"]({ date: createdAt })}
        </Typography>
        <Typography color="gray" className="truncate text-xs leading-4">
          {translate["settings.devices.sections.sessions.last-seen"]({ date: lastSeen })}
        </Typography>
      </div>
    </div>
  )
}

const SessionsError = reatomComponent(({ ctx }) => {
  return (
    <div className="flex flex-col items-start gap-2 rounded-lg bg-red-500/10 px-3 py-2">
      <Typography className="text-sm text-red-300">
        {translate["settings.devices.sections.sessions.load-error"]()}
      </Typography>
      <Button
        background="default"
        className="h-8 text-xs font-semibold"
        onClick={() => spawn(ctx, (spawnCtx) => sessions.refetchAll(spawnCtx))}
      >
        {translate["shared.retry"]()}
      </Button>
    </div>
  )
}, "SessionsError")

const SessionItem = reatomComponent<{ session: SessionPayload, type: "current" | "active" }>(({
  ctx, type, session
}) => {
  const isLoading = ctx.spy(sessions.terminateAll.statusesAtom).isPending
    || ctx.spy(sessions.terminateById.statusesAtom).isPending
  const isCurrent = type === "current"

  const terminate = () => alertDialog.open(ctx, {
    title: translate["settings.devices.sections.sessions.end-session-confirm"](),
    description: translate["settings.devices.sections.sessions.end-session-description"](),
    confirmLabel: translate["settings.devices.sections.sessions.end-this-session"](),
    onConfirm: () => sessions.terminateById(ctx, session.id),
    errorAtom: sessions.terminateById.errorAtom,
  })

  const terminateAll = () => spawn(ctx, (spawnCtx) => sessions.terminateAll(spawnCtx))

  return (
    <div
      className="flex flex-col gap-3 w-full inert:opacity-60 inert:pointer-events-none"
      inert={isLoading}
    >
      {isCurrent ? (
        <>
          <SessionItemTrigger session={session} current />
          <Button
            variant="danger"
            className="self-start text-sm font-semibold w-fit"
            onClick={terminateAll}
          >
            {translate["settings.devices.sections.sessions.end-all-sessions"]()}
          </Button>
        </>
      ) : (
        <div className="flex items-center gap-2 w-full">
          <div className="min-w-0 flex-1">
            <SessionItemTrigger session={session} />
          </div>
          <Button
            background="default"
            aria-label={translate["settings.devices.sections.sessions.end-this-session"]()}
            title={translate["settings.devices.sections.sessions.end-this-session"]()}
            className="size-9 shrink-0 p-0 text-neutral-400 hover:text-red-400"
            onClick={terminate}
          >
            <Icon name="sprite:logout" className="size-4" />
          </Button>
        </div>
      )}
    </div>
  )
}, "SessionItem")

const SessionsListActive = reatomComponent(({ ctx }) => {
  if (ctx.spy(sessions.fetchActive.errorAtom)) return <SessionsError />

  if (ctx.spy(sessions.fetchActive.statusesAtom).isFirstPending) {
    return Array.from({ length: 2 }).map((_, idx) => <Skeleton key={idx} className="h-16 w-full" />)
  }

  const data = ctx.spy(sessionsState.activeList);
  if (!data || isEmptyArray(data)) {
    return (
      <Typography color="gray" className="text-sm">
        {translate["settings.devices.sections.sessions.empty"]()}
      </Typography>
    )
  }

  return data.map((session) => <SessionItem key={session.id} session={session} type="active" />)
}, "SessionsListActive")

const SessionsListCurrent = reatomComponent(({ ctx }) => {
  if (ctx.spy(sessions.fetchCurrent.errorAtom)) return <SessionsError />

  if (ctx.spy(sessions.fetchCurrent.statusesAtom).isFirstPending) {
    return <Skeleton className="h-16 w-full" />
  }

  const current = ctx.spy(sessionsState.current)
  if (!current) return null

  return <SessionItem session={current} type="current" />
}, "SessionsListCurrent")

const LoginHistory = reatomComponent(({ ctx }) => {
  if (ctx.spy(sessions.fetchHistory.errorAtom)) {
    return (
      <Typography color="gray" className="text-sm">
        {translate["settings.devices.sections.sessions.history.load-error"]()}
      </Typography>
    )
  }

  if (ctx.spy(sessions.fetchHistory.statusesAtom).isFirstPending) {
    return Array.from({ length: 3 }).map((_, idx) => <Skeleton key={idx} className="h-14 w-full" />)
  }

  const data = ctx.spy(sessionsState.history);
  if (!data || isEmptyArray(data)) {
    return (
      <Typography color="gray" className="text-sm">
        {translate["settings.devices.sections.sessions.history.empty"]()}
      </Typography>
    )
  }

  return (
    <div className="flex flex-col gap-1 w-full">
      {data.map((event) => (
        <div key={event.id} className="flex items-start justify-between gap-3 rounded-lg
          bg-neutral-900 px-3 py-2">
          <div className="flex min-w-0 flex-col">
            <Typography className="truncate text-sm font-medium leading-5">
              {event.browser}
            </Typography>
            <Typography color="gray" className="truncate text-xs leading-4">
              {event.os} · {event.ip} · {
                event.client === "launcher"
                  ? translate["settings.devices.sections.sessions.history.client-launcher"]()
                  : translate["settings.devices.sections.sessions.history.client-web"]()
              }
            </Typography>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <Typography color="gray" className="text-xs leading-4">
              {dayjs(event.created_at).format("DD.MM.YYYY HH:mm")}
            </Typography>
            {event.new_device && (
              <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px]
                font-semibold uppercase text-amber-400">
                {translate["settings.devices.sections.sessions.new-device"]()}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}, "LoginHistory")

export const SessionsList = () => {
  useUpdate(sessions.init, []);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2 w-full">
        <p className="text-sm font-medium leading-4">
          {translate["settings.devices.sections.sessions.current-session"]()}
        </p>
        <SessionsListCurrent />
      </div>
      <div className="flex flex-col gap-2 w-full">
        <p className="text-sm font-medium leading-4">
          {translate["settings.devices.sections.sessions.active-sessions"]()}
        </p>
        <SessionsListActive />
      </div>
      <div className="flex flex-col gap-2 w-full">
        <p className="text-sm font-medium leading-4">
          {translate["settings.devices.sections.sessions.history.title"]()}
        </p>
        <LoginHistory />
      </div>
    </div>
  )
}
