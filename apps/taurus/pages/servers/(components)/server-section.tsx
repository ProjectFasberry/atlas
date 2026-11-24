import { For, Show } from "solid-js"
import { Typography } from "@/shared/ui/typography"
import { Button } from "@/shared/ui/button"
import { EditableText } from "@/shared/components/edit/editable-text"
import { siteEdit, type EditServer } from "@/shared/models/site-edit.model"
import { openAssetPicker } from "@/shared/models/storage.model"
import { getStaticAsset } from "@/shared/lib/helpers"
import { translate } from "@/shared/locales/helpers"
import { reatomComponent } from "@/shared/lib/reatom"
import { ServerStatusBadge } from "./server-status-badge"
import { ServerFeatureCard } from "./server-feature-card"

export const ServerSection = reatomComponent<{ server: EditServer, editing: boolean }>(({ ctx, server, editing }) => (
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
      <ServerStatusBadge id={server.id} />
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
            <div class="flex items-center gap-1">
              <EditableText
                class="flex-1 text-xs"
                placeholder={translate["edit.image-key"]()}
                value={server.imageKey}
                onInput={(value) => siteEdit.setServer(ctx, server.id, { imageKey: value })}
              />
              <Button
                class="px-2 py-1 text-[11px]"
                onClick={() => openAssetPicker(ctx, { kind: "server", id: server.id })}
              >
                {translate["edit.picker.open"]()}
              </Button>
            </div>
          </div>
        </Show>
      </div>
    </Show>
    <div class="grid gap-3 sm:grid-cols-2">
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
  </section>
), "ServerSection")
