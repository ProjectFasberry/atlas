import { For, Show, onMount } from "solid-js";
import { tv } from "tailwind-variants";
import { Typography } from "@/shared/ui/typography";
import { Button } from "@/shared/ui/button";
import { Link } from "@/shared/components/link";
import { sectionVariantChild } from "@/shared/styles/variants";
import { env } from "@/shared/env";
import { getLauncherDownloadUrl, getStaticObject } from "@/shared/lib/helpers";
import { translate } from "@/shared/locales/helpers";
import { serverStatus } from "@/shared/models/server-status.model";
import { reatomComponent } from "@/shared/lib/reatom";
import { useAtomAccessor } from "@/shared/lib/utils";

const APP_URL = env.VITE_APP_URL
const WINDOWS_URL = getLauncherDownloadUrl("windows-x86_64")

const joinSection = tv({
  base: `full-screen-section relative flex flex-col items-center justify-center py-16 sm:py-20 lg:py-28`
})

const stepCard = tv({
  base: `transparent-achievement-panel flex items-start gap-3 sm:gap-4 p-3 sm:p-4`
})

const getSteps = () => [
  {
    title: translate["join.steps.1.title"](),
    description: translate["join.steps.1.description"](),
    icon: getStaticObject("minecraft", "icons/chest_closed.webp")
  },
  {
    title: translate["join.steps.2.title"](),
    description: translate["join.steps.2.description"](),
    href: `${APP_URL}/auth`,
    icon: getStaticObject("minecraft", "items/seeking_wolf.png")
  },
  {
    title: translate["join.steps.3.title"](),
    description: translate["join.steps.3.description"](),
    icon: getStaticObject("minecraft", "icons/experience_big.webp")
  }
]

export const JoinSection = reatomComponent(({ ctx }) => {
  const status = useAtomAccessor(serverStatus.fetch.dataAtom)
  const statuses = useAtomAccessor(serverStatus.fetch.statusesAtom)

  onMount(() => {
    if (!status() && !statuses().isPending) serverStatus.fetch(ctx)
  })

  const isOnline = () => status()?.proxy.status === "online"
  const players = () => status()?.proxy.online
  const maxPlayers = () => status()?.proxy.max ?? 0
  const servers = () => Object.entries(status()?.servers ?? {}).slice(0, 3)
  const fillPercent = () => {
    const max = maxPlayers()
    if (!max) return 0

    return Math.min(100, Math.max(0, ((players() ?? 0) / max) * 100))
  }

  return (
    <div id="join" class={joinSection()}>
      <div class="responsive z-1 grid items-center gap-5 lg:grid-cols-[1.05fr_.95fr] lg:gap-3">
        <div class="flex flex-col justify-center gap-4 sm:gap-5">
          <Typography class="text-xs uppercase tracking-[0.2em] text-green-400">
            {translate["join.eyebrow"]()}
          </Typography>
          <div class="flex flex-col gap-2">
            <h2 class={sectionVariantChild().title({ className: "mb-0" })}>
              {translate["join.title"]()}
            </h2>
            <Typography color="gray" class="text-sm sm:text-base leading-6">
              {translate["join.description"]()}
            </Typography>
          </div>
          <ol class="flex flex-col gap-2">
            <For each={getSteps()}>
              {(step, idx) => (
                <li class={stepCard()}>
                  <span class="raised-slot flex h-9 w-9 shrink-0 items-center justify-center text-lg text-neutral-800">
                    {idx() + 1}
                  </span>
                  <div class="flex min-w-0 flex-col gap-1">
                    <Typography color="white" class="text-base sm:text-lg">
                      {step.href ? (
                        <a
                          href={step.href}
                          target="_blank"
                          rel="noreferrer"
                          class="underline-offset-4 hover:underline"
                        >
                          {step.title}
                        </a>
                      ) : step.title}
                    </Typography>
                    <Typography color="gray" class="text-xs leading-5 sm:text-sm">
                      {step.description}
                    </Typography>
                  </div>
                  <img
                    src={step.icon}
                    alt=""
                    width={40}
                    height={40}
                    loading="lazy"
                    draggable={false}
                    class="ml-auto hidden shrink-0 sm:block"
                  />
                </li>
              )}
            </For>
          </ol>
          <div class="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
            <a href={WINDOWS_URL} target="_blank" rel="noreferrer" class="w-full sm:w-auto">
              <Button class="w-full sm:w-auto">
                <Typography color="white" class="text-sm sm:text-base text-nowrap">
                  {translate["join.action-windows"]()}
                </Typography>
              </Button>
            </a>
            <Button
              disabled
              title={translate["shared.soon"]()}
              class="w-full sm:w-auto"
            >
              <Typography color="white" class="text-sm sm:text-base text-nowrap">
                {translate["join.action-macos"]()}
                <span class="ml-2 border border-neutral-400/60 px-1 text-[10px] uppercase tracking-wide text-neutral-200">
                  {translate["shared.soon"]()}
                </span>
              </Typography>
            </Button>
            <Link href="/start" class="text-sm text-neutral-300 underline underline-offset-4 hover:text-white sm:whitespace-nowrap">
              {translate["join.action-guide"]()}
            </Link>
          </div>
        </div>
        <div class="transparent-achievement-panel flex flex-col gap-5 bg-black/30 p-4 backdrop-blur-sm sm:p-6">
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <span
                class="h-2.5 w-2.5 rounded-full"
                classList={{
                  "bg-green-500": isOnline(),
                  "bg-red-500": !!status() && !isOnline(),
                  "bg-neutral-500 animate-pulse": !status()
                }}
              />
              <Typography class="text-xs uppercase tracking-wide text-neutral-300 sm:text-sm">
                {!status()
                  ? translate["join.status.connecting"]()
                  : isOnline()
                    ? translate["join.status.online"]()
                    : translate["join.status.offline"]()}
              </Typography>
            </div>
          </div>
          <div class="flex flex-col gap-1">
            <Typography color="gray" class="text-xs sm:text-sm">
              {translate["join.status.players"]()}
            </Typography>
            <div class="flex items-end gap-2">
              <span class="text-3xl leading-none text-white text-shadow-lg tabular-nums sm:text-4xl">
                {players() ?? "—"}
              </span>
              <span class="mb-1 text-sm text-neutral-400 tabular-nums">
                / {maxPlayers() || "—"}
              </span>
            </div>
            <div class="mt-1 h-2 w-full border border-black/50 bg-neutral-900/80">
              <div
                class="h-full bg-green-500/80 duration-500"
                style={{ width: `${fillPercent()}%` }}
              />
            </div>
          </div>
          <div class="flex flex-col gap-2">
            <For each={servers()}>
              {([key, server]) => (
                <div class="flex items-center justify-between gap-3">
                  <div class="flex min-w-0 items-center gap-2">
                    <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
                    <Typography class="truncate text-sm text-neutral-300">
                      {server.fullname || key}
                    </Typography>
                    <Show when={key === "bisquite"}>
                      <span class="shrink-0 border border-neutral-700 px-1 py-0.5 text-[10px] uppercase tracking-wider text-neutral-500">
                        {translate["join.status.semi-vanilla"]()}
                      </span>
                    </Show>
                  </div>
                  <span class="text-sm text-neutral-400 tabular-nums">{server.online}</span>
                </div>
              )}
            </For>
          </div>
          <div class="mt-auto flex items-center gap-2 text-[11px] leading-4 text-neutral-500">
            <img
              src={getStaticObject("minecraft", "icons/book_big.webp")}
              alt=""
              width={20}
              height={20}
              loading="lazy"
              draggable={false}
            />
            <span>{translate["join.hint"]()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}, "JoinSection")