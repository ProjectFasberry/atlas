import { For, Show } from "solid-js"
import { Typography } from "@/shared/ui/typography"
import { Button } from "@/shared/ui/button"
import { Link } from "@/shared/components/link"
import { EditableText } from "@/shared/components/edit/editable-text"
import { siteEdit, type EditServer } from "@/shared/models/site-edit.model"
import { openAssetPicker } from "@/shared/models/storage.model"
import { getStaticAsset } from "@/shared/lib/helpers"
import { translate } from "@/shared/locales/helpers"
import { reatomComponent } from "@/shared/lib/reatom"
import { ServerStatusBadge } from "./server-status-badge"
import { ServerFeatureCard } from "./server-feature-card"

const chipVariant = `inline-flex max-w-full items-center gap-1.5 rounded-lg bg-neutral-800/80
  px-2 py-1 text-[11px] font-medium text-neutral-300 sm:text-xs`

export const ServerSection = reatomComponent<{ server: EditServer, editing: boolean }>(({ ctx, server, editing }) => {
  const isComingSoon = () => server.id === "muffin"
  const chips = () => server.features.slice(0, 3)
  const hasDetails = () => Boolean(server.description) || server.features.length > 3

  return (
    <section
      id={server.id}
      class={`group flex flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900
        ${isComingSoon() ? "opacity-80" : ""}`}
    >
      <div class="relative h-40 shrink-0 sm:h-48">
        <Show
          when={server.imageKey}
          fallback={
            <div class="absolute inset-0 bg-linear-to-br from-green-950 via-neutral-900 to-neutral-950" />
          }
        >
          <img
            src={getStaticAsset(server.imageKey)}
            alt=""
            loading="lazy"
            class="absolute inset-0 size-full object-cover brightness-55 duration-300 group-hover:scale-[1.02]"
          />
          <div class="absolute inset-0 bg-linear-to-r from-black/85 via-black/55 to-black/15" />
        </Show>
        <div class="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          <ServerStatusBadge id={server.id} />
          <Show when={isComingSoon()}>
            <span class="rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
              {translate["shared.soon"]()}
            </span>
          </Show>
        </div>
        <div class="absolute inset-x-0 bottom-0 flex flex-col gap-0.5 p-4">
          <Show
            when={editing}
            fallback={
              <Typography color="white" class="text-xl text-shadow-lg sm:text-3xl">{server.name}</Typography>
            }
          >
            <EditableText
              class="text-xl sm:text-3xl"
              value={server.name}
              onInput={(value) => siteEdit.setServer(ctx, server.id, { name: value })}
            />
          </Show>
          <Show
            when={editing}
            fallback={
              <Typography color="gray" class="text-sm text-shadow-lg sm:text-base">{server.tagline}</Typography>
            }
          >
            <EditableText
              class="text-sm sm:text-base"
              value={server.tagline}
              onInput={(value) => siteEdit.setServer(ctx, server.id, { tagline: value })}
            />
          </Show>
        </div>
      </div>

      <div class="flex flex-1 flex-col gap-3 p-4">
        <Show when={chips().length > 0}>
          <div class="flex flex-wrap gap-1.5">
            <For each={chips()}>
              {(feature) => (
                <span class={chipVariant}>
                  <Show when={feature.iconKey}>
                    <img
                      src={getStaticAsset(feature.iconKey)}
                      alt=""
                      width={16}
                      height={16}
                      loading="lazy"
                      draggable={false}
                      class="size-4 object-contain"
                    />
                  </Show>
                  {feature.title}
                </span>
              )}
            </For>
            <Show when={server.features.length > 3}>
              <span class={chipVariant}>+{server.features.length - 3}</span>
            </Show>
          </div>
        </Show>

        <Show when={editing || hasDetails()}>
          <details class="group/details" open={editing}>
            <summary class="flex w-fit cursor-pointer list-none items-center gap-1 text-xs font-semibold text-green-400 hover:text-green-300">
              {translate["servers.details"]()}
              <span class="transition-transform group-open/details:rotate-180">⌄</span>
            </summary>
            <div class="flex flex-col gap-3 pt-3">
              <Show when={editing || Boolean(server.description)}>
                <div class="relative overflow-hidden rounded-xl bg-black/20 p-3 sm:p-4">
                  <Show
                    when={editing}
                    fallback={
                      <Typography color="gray" class="text-sm leading-6">{server.description}</Typography>
                    }
                  >
                    <div class="flex flex-col gap-1">
                      <EditableText
                        multiline
                        class="text-sm leading-6"
                        placeholder={translate["edit.empty-description"]()}
                        value={server.description}
                        onInput={(value) => siteEdit.setServer(ctx, server.id, { description: value })}
                      />
                      <div class="flex flex-col gap-1 sm:flex-row sm:items-center">
                        <EditableText
                          class="text-xs sm:flex-1"
                          placeholder={translate["edit.image-key"]()}
                          value={server.imageKey}
                          onInput={(value) => siteEdit.setServer(ctx, server.id, { imageKey: value })}
                        />
                        <Button
                          class="w-fit px-2 py-1 text-[11px]"
                          onClick={() => openAssetPicker(ctx, { kind: "server", id: server.id })}
                        >
                          {translate["edit.picker.open"]()}
                        </Button>
                      </div>
                    </div>
                  </Show>
                </div>
              </Show>
              <div class="grid gap-2 sm:grid-cols-2">
                <For each={server.features}>
                  {(feature, index) => (
                    <ServerFeatureCard
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
            </div>
          </details>
        </Show>

        <div class="mt-auto flex items-center gap-2 pt-1">
          <Show
            when={isComingSoon()}
            fallback={
              <Link href="/start" class="w-full sm:w-auto">
                <Button class="w-full px-5 py-1 sm:w-auto">
                  <Typography color="white" class="text-sm font-semibold">{translate["servers.play"]()}</Typography>
                </Button>
              </Link>
            }
          >
            <span class="flex h-9 items-center rounded-xl bg-neutral-800 px-4 text-sm text-neutral-500">
              {translate["shared.soon"]()}
            </span>
          </Show>
        </div>
      </div>
    </section>
  )
}, "ServerSection")
