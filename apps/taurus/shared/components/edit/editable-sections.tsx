import { For, Show } from "solid-js"
import { Button } from "@/shared/ui/button"
import { reatomComponent } from "@/shared/lib/reatom"
import { siteEdit, type EditSection } from "@/shared/models/site-edit.model"
import { EditableText } from "./editable-text"
import { translate } from "@/shared/locales/helpers"

/**
 * Custom blocks shared by every page. Visitors see only the non-hidden ones;
 * editors see the whole list with controls.
 */
export const EditableSections = reatomComponent<{
  sections: EditSection[]
  editing: boolean
}>(({ ctx, sections, editing }) => {
  const visible = () => sections.filter((section) => !section.hidden)
  const list = () => editing ? sections : visible()

  return (
    <Show when={editing || visible().length > 0}>
      <section class="flex w-full flex-col gap-4 py-8">
        <For each={list()}>
          {(section, index) => (
            <article
              class="transparent-achievement-panel flex flex-col gap-2 p-5 sm:p-6"
              classList={{ "opacity-60": editing && section.hidden }}
            >
              <Show
                when={editing}
                fallback={
                  <h2 class="text-xl text-white text-shadow-lg sm:text-2xl">{section.title}</h2>
                }
              >
                <EditableText
                  class="text-xl sm:text-2xl"
                  placeholder={translate["edit.section-title"]()}
                  value={section.title}
                  onInput={(value) => siteEdit.setSection(ctx, index(), { title: value })}
                />
                <EditableText
                  multiline
                  class="text-sm leading-6 sm:text-base"
                  placeholder={translate["edit.section-body"]()}
                  value={section.body}
                  onInput={(value) => siteEdit.setSection(ctx, index(), { body: value })}
                />
                <div class="flex flex-wrap items-center gap-1">
                  <Button
                    class="px-2 py-1 text-[11px]"
                    onClick={() => siteEdit.moveSection(ctx, index(), -1)}
                  >
                    {translate["edit.up"]()}
                  </Button>
                  <Button
                    class="px-2 py-1 text-[11px]"
                    onClick={() => siteEdit.moveSection(ctx, index(), 1)}
                  >
                    {translate["edit.down"]()}
                  </Button>
                  <Button
                    class="px-2 py-1 text-[11px]"
                    onClick={() => siteEdit.toggleSection(ctx, index())}
                  >
                    {section.hidden ? translate["edit.show-section"]() : translate["edit.hide-section"]()}
                  </Button>
                  <Button
                    class="px-2 py-1 text-[11px]"
                    onClick={() => siteEdit.removeSection(ctx, index())}
                  >
                    {translate["edit.remove"]()}
                  </Button>
                  <Show when={section.hidden}>
                    <span class="text-[11px] text-neutral-400">
                      {translate["edit.section-hidden"]()}
                    </span>
                  </Show>
                </div>
              </Show>
              <Show when={!editing}>
                <p class="whitespace-pre-line text-sm leading-6 text-neutral-300 sm:text-base">
                  {section.body}
                </p>
              </Show>
            </article>
          )}
        </For>
        <Show when={editing}>
          <Button
            class="w-fit px-3 py-1.5 text-xs"
            onClick={() => siteEdit.addSection(ctx)}
          >
            {translate["edit.add-section"]()}
          </Button>
        </Show>
      </section>
    </Show>
  )
}, "EditableSections")
