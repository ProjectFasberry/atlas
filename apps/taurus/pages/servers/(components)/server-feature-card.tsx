import { Show } from "solid-js"
import { Typography } from "@/shared/ui/typography"
import { Button } from "@/shared/ui/button"
import { EditableText } from "@/shared/components/edit/editable-text"
import { siteEdit, type EditFeature } from "@/shared/models/site-edit.model"
import { openAssetPicker } from "@/shared/models/storage.model"
import { getStaticAsset } from "@/shared/lib/helpers"
import { translate } from "@/shared/locales/helpers"
import { reatomComponent } from "@/shared/lib/reatom"

export const ServerFeatureCard = reatomComponent<{
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
        <div class="flex flex-col gap-1 sm:flex-row sm:items-center">
          <EditableText
            class="text-xs sm:flex-1"
            placeholder={translate["edit.image-key"]()}
            value={feature.iconKey}
            onInput={(value) => siteEdit.setFeature(ctx, serverId, index, { iconKey: value })}
          />
          <div class="flex gap-1">
            <Button
              class="shrink-0 px-2 py-1 text-[11px]"
              onClick={() => openAssetPicker(ctx, { kind: "feature", serverId, index })}
            >
              {translate["edit.picker.open"]()}
            </Button>
            <Button
              class="shrink-0 px-2 py-1 text-[11px]"
              onClick={() => siteEdit.removeFeature(ctx, serverId, index)}
            >
              {translate["edit.remove"]()}
            </Button>
          </div>
        </div>
      </Show>
    </div>
  </article>
), "ServerFeatureCard")
