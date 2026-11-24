import { Show } from "solid-js"
import { translate } from "@/shared/locales/helpers"
import { BlockControls, BlockSubtitle, BlockTitle, useBlockHidden } from "@/shared/components/edit/section-block"
import { ModpackList } from "./modpack-list"
import type { Data } from "../+data"

export const ModpackManual = (props: { data: Data["data"]; failed: Data["failed"] }) => {
  const hidden = useBlockHidden("modpack-manual")
  const count = () => props.data?.length ?? 0

  return (
    <Show when={!hidden()}>
      <section id="modpacks" class="flex scroll-mt-24 flex-col gap-3">
        <div class="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div class="flex flex-col gap-1">
            <BlockTitle
              id="modpack-manual"
              fallback={translate["modpack.manual.title"]()}
              class="text-2xl sm:text-3xl"
            />
            <BlockSubtitle
              id="modpack-manual"
              fallback={translate["modpack.manual.description"]()}
              class="text-sm sm:text-base"
            />
            <BlockControls id="modpack-manual" />
          </div>
          <Show when={count() > 0}>
            <span class="text-xs text-neutral-500 sm:text-sm">
              {translate["modpack.manual.count"]({ count: count() })}
            </span>
          </Show>
        </div>
        <ModpackList data={props.data} failed={props.failed} />
      </section>
    </Show>
  )
}
