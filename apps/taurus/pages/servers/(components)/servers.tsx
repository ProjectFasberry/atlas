import { For, onMount, Show } from "solid-js"
import { useData } from "vike-solid/useData"
import { Typography } from "@/shared/ui/typography"
import { Button } from "@/shared/ui/button"
import { MainWrapperPage } from "@/shared/ui/main-wrapper"
import { serverStatus } from "@/shared/models/server-status.model"
import { reatomComponent } from "@/shared/lib/reatom"
import { useAtomAccessor } from "@/shared/lib/utils"
import { translate } from "@/shared/locales/helpers"
import { createServerProfiles, type ServerProfile } from "../(models)/servers.model"
import { siteEdit, type EditFeature, type EditServer } from "@/shared/models/site-edit.model"
import { EditableText } from "@/shared/components/edit/editable-text"
import { EditToolbar } from "@/shared/components/edit/edit-toolbar"
import { EditableSections } from "@/shared/components/edit/editable-sections"
import { getStaticAsset, toStaticKey } from "@/shared/lib/helpers"
import { asSectionsContent } from "@/shared/api/site"
import type { Data } from "../+data"

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

const FeatureCard = reatomComponent<{
  serverId: string
  index: number
  feature: EditFeature
  editing: boolean
}>(({ ctx, serverId, index, feature, editing }) => (
  <article class="transparent-achievement-panel flex items-start gap-3 p-4">
    <span class="raised-slot flex size-12 shrink-0 items-center justify-center">
      <Show
        when={feature.iconKey}
        fallback={<span class="size-8 rounded-sm bg-neutral-700/40" />}
      >
        <img
          src={getStaticAsset(feature.iconKey)}
          alt=""
          width={32}
          height={32}
          loading="lazy"
          draggable={false}
          class="size-8 object-contain"
        />
      </Show>
    </span>
    <div class="flex min-w-0 flex-1 flex-col gap-1">
      <Show
        when={editing}
        fallback={
          <>
            <Typography color="white" class="text-base">{feature.title}</Typography>
            <Typography color="gray" class="text-sm leading-5">{feature.description}</Typography>
          </>
        }
      >
        <EditableText
          class="text-base"
          value={feature.title}
          onInput={(value) => siteEdit.setFeature(ctx, serverId, index, { title: value })}
        />
        <EditableText
          multiline
          class="text-sm leading-5"
          value={feature.description}
          onInput={(value) => siteEdit.setFeature(ctx, serverId, index, { description: value })}
        />
        <div class="flex items-center gap-1">
          <EditableText
            class="text-xs"
            placeholder={translate["edit.image-key"]()}
            value={feature.iconKey}
            onInput={(value) => siteEdit.setFeature(ctx, serverId, index, { iconKey: value })}
          />
          <Button
            class="shrink-0 px-2 py-1 text-[11px]"
            onClick={() => siteEdit.removeFeature(ctx, serverId, index)}
          >
            {translate["edit.remove"]()}
          </Button>
        </div>
      </Show>
    </div>
  </article>
), "ServerFeatureCard")

const ServerSection = reatomComponent<{ server: EditServer, editing: boolean }>(({ ctx, server, editing }) => (
  <section id={server.id} class="flex flex-col gap-4">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div class="flex min-w-0 flex-1 flex-col gap-1">
        <Show
          when={editing}
          fallback={
            <Typography color="white" class="text-2xl sm:text-3xl">{server.name}</Typography>
          }
        >
          <EditableText
            class="text-2xl sm:text-3xl"
            value={server.name}
            onInput={(value) => siteEdit.setServer(ctx, server.id, { name: value })}
          />
        </Show>
        <Show
          when={editing}
          fallback={
            <Typography color="gray" class="text-sm sm:text-base">{server.tagline}</Typography>
          }
        >
          <EditableText
            class="text-sm sm:text-base"
            value={server.tagline}
            onInput={(value) => siteEdit.setServer(ctx, server.id, { tagline: value })}
          />
        </Show>
      </div>
      <ServerStatus id={server.id} />
    </div>
    <Show when={editing || Boolean(server.description)}>
      <div class="relative overflow-hidden transparent-achievement-panel">
        <Show when={server.imageKey}>
          <img
            src={getStaticAsset(server.imageKey)}
            alt=""
            loading="lazy"
            class="absolute inset-0 size-full object-cover brightness-45"
          />
          <div class="absolute inset-0 bg-linear-to-r from-black/85 via-black/60 to-black/25" />
        </Show>
        <Show
          when={editing}
          fallback={
            <Typography color="white" class="relative z-1 max-w-3xl p-5 text-sm leading-6 text-shadow-lg sm:p-6 sm:text-base">
              {server.description}
            </Typography>
          }
        >
          <div class="relative z-1 flex max-w-3xl flex-col gap-1 p-5 sm:p-6">
            <EditableText
              multiline
              class="text-sm leading-6 sm:text-base"
              placeholder={translate["edit.empty-description"]()}
              value={server.description}
              onInput={(value) => siteEdit.setServer(ctx, server.id, { description: value })}
            />
            <EditableText
              class="text-xs"
              placeholder={translate["edit.image-key"]()}
              value={server.imageKey}
              onInput={(value) => siteEdit.setServer(ctx, server.id, { imageKey: value })}
            />
          </div>
        </Show>
      </div>
    </Show>
    <div class="grid gap-3 sm:grid-cols-2">
      <For each={server.features}>
        {(feature, index) => (
          <FeatureCard
            serverId={server.id}
            index={index()}
            feature={feature}
            editing={editing}
          />
        )}
      </For>
    </div>
    <Show when={editing}>
      <Button
        class="w-fit px-3 py-1.5 text-xs"
        onClick={() => siteEdit.addFeature(ctx, server.id)}
      >
        {translate["edit.add-feature"]()}
      </Button>
    </Show>
  </section>
), "ServerSection")

const toEditServers = (profiles: ServerProfile[]): EditServer[] => profiles.map((profile) => ({
  id: profile.id,
  name: profile.name,
  tagline: profile.tagline,
  description: profile.description,
  imageKey: toStaticKey(profile.image),
  features: profile.features.map((feature) => ({
    iconKey: toStaticKey(feature.icon),
    title: feature.title,
    description: feature.description,
  })),
}))

export const ServersPage = reatomComponent(({ ctx }) => {
  const pageData = useData<Data>()
  const edit = pageData?.edit
  const profiles = () => createServerProfiles(pageData?.content)

  if (edit?.active) {
    siteEdit.init(ctx, {
      page: "servers",
      locale: edit.locale,
      version: edit.version,
      canPublish: edit.canPublish,
      content: {
        kind: "servers",
        title: pageData.content?.title ?? translate["servers.page.title"](),
        description: pageData.content?.description ?? translate["servers.page.description"](),
        servers: toEditServers(profiles()),
        sections: asSectionsContent(pageData.content),
      },
    })
  }

  const editing = () => Boolean(edit?.active)
  const editContent = useAtomAccessor(siteEdit.content)

  const view = () => {
    const content = editContent()

    if (editing() && content?.kind === "servers") return content

    return {
      title: pageData.content?.title ?? translate["servers.page.title"](),
      description: pageData.content?.description ?? translate["servers.page.description"](),
      servers: toEditServers(profiles()),
    }
  }

  return (
    <MainWrapperPage class={`flex flex-col gap-10 ${editing() ? "pb-24" : ""}`}>
      <div class="flex flex-col gap-2">
        <Show
          when={editing()}
          fallback={
            <>
              <Typography color="white" class="text-3xl sm:text-4xl">{view().title}</Typography>
              <Typography color="gray" class="text-sm sm:text-base">{view().description}</Typography>
            </>
          }
        >
          <EditableText
            class="text-3xl sm:text-4xl"
            value={view().title}
            onInput={(value) => siteEdit.setServersPage(ctx, { title: value })}
          />
          <EditableText
            multiline
            class="text-sm sm:text-base"
            value={view().description}
            onInput={(value) => siteEdit.setServersPage(ctx, { description: value })}
          />
        </Show>
      </div>
      <For each={view().servers}>
        {(server) => <ServerSection server={server} editing={editing()} />}
      </For>
      <EditableSections
        sections={editing() && editContent() ? editContent()!.sections : asSectionsContent(pageData.content)}
        editing={editing()}
      />
      <Show when={editing()}>
        <EditToolbar />
      </Show>
    </MainWrapperPage>
  )
}, "ServersPage")
