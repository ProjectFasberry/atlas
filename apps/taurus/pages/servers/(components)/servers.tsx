import { For, onMount, Show } from "solid-js"
import { Typography } from "@/shared/ui/typography"
import { MainWrapperPage } from "@/shared/ui/main-wrapper"
import { serverStatus } from "@/shared/models/server-status.model"
import { reatomComponent } from "@/shared/lib/reatom"
import { useAtomAccessor } from "@/shared/lib/utils"
import { translate } from "@/shared/locales/helpers"
import { createServerProfiles, type ServerFeature, type ServerProfile } from "../(models)/servers.model"

const ServerStatus = reatomComponent<{ id: string }>(({ ctx, id }) => {
  const status = useAtomAccessor(serverStatus.fetch.dataAtom)
  const statuses = useAtomAccessor(serverStatus.fetch.statusesAtom)

  onMount(() => {
    if (!status() && !statuses().isPending) serverStatus.fetch(ctx)
  })

  const server = () => status()?.servers?.[id]
  const available = () => server()?.available ?? false
  const label = () => {
    const current = server()

    if (!current) return translate["servers.status.unknown"]()
    if (!available()) return translate["servers.status.offline"]()

    return translate["servers.status.online"]({ count: current.online ?? 0 })
  }

  return (
    <span class="flex w-fit items-center gap-2 transparent-slot px-3 py-1">
      <span
        class="h-2 w-2 rounded-full"
        classList={{
          "bg-green-500": available(),
          "bg-red-500": Boolean(server()) && !available(),
          "bg-neutral-500": !server(),
        }}
      />
      <Typography class="text-xs text-neutral-200 sm:text-sm">{label()}</Typography>
    </span>
  )
}, "ServerStatus")

const FeatureCard = (props: { feature: ServerFeature }) => (
  <article class="transparent-achievement-panel flex items-start gap-3 p-4">
    <span class="raised-slot flex size-12 shrink-0 items-center justify-center">
      <img
        src={props.feature.icon}
        alt=""
        width={32}
        height={32}
        loading="lazy"
        draggable={false}
        class="size-8 object-contain"
      />
    </span>
    <div class="flex flex-col gap-1">
      <Typography color="white" class="text-base">
        {props.feature.title}
      </Typography>
      <Typography color="gray" class="text-sm leading-5">
        {props.feature.description}
      </Typography>
    </div>
  </article>
)

const ServerSection = (props: { server: ServerProfile }) => (
  <section id={props.server.id} class="flex flex-col gap-4">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div class="flex flex-col gap-1">
        <Typography color="white" class="text-2xl sm:text-3xl">
          {props.server.name}
        </Typography>
        <Typography color="gray" class="text-sm sm:text-base">
          {props.server.tagline}
        </Typography>
      </div>
      <ServerStatus id={props.server.id} />
    </div>
    <Show when={props.server.description}>
      <div class="relative overflow-hidden transparent-achievement-panel">
        <img
          src={props.server.image}
          alt=""
          loading="lazy"
          class="absolute inset-0 size-full object-cover brightness-45"
        />
        <div class="absolute inset-0 bg-linear-to-r from-black/85 via-black/60 to-black/25" />
        <Typography color="white" class="relative z-1 max-w-3xl p-5 text-sm leading-6 text-shadow-lg sm:p-6 sm:text-base">
          {props.server.description}
        </Typography>
      </div>
    </Show>
    <div class="grid gap-3 sm:grid-cols-2">
      <For each={props.server.features}>
        {(feature) => <FeatureCard feature={feature} />}
      </For>
    </div>
  </section>
)

export const ServersPage = () => {
  return (
    <MainWrapperPage class="flex flex-col gap-10">
      <div class="flex flex-col gap-2">
        <Typography color="white" class="text-3xl sm:text-4xl">
          {translate["servers.page.title"]()}
        </Typography>
        <Typography color="gray" class="text-sm sm:text-base">
          {translate["servers.page.description"]()}
        </Typography>
      </div>
      <For each={createServerProfiles()}>
        {(server) => <ServerSection server={server} />}
      </For>
    </MainWrapperPage>
  )
}
