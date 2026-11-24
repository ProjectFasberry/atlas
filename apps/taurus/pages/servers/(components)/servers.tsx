import { For, Show } from "solid-js"
import { useData } from "vike-solid/useData"
import { Typography } from "@/shared/ui/typography"
import { MainWrapperPage } from "@/shared/ui/main-wrapper"
import { reatomComponent } from "@/shared/lib/reatom"
import { useAtomAccessor } from "@/shared/lib/utils"
import { translate } from "@/shared/locales/helpers"
import { createServerProfiles, type ServerProfile } from "../(models)/servers.model"
import { siteEdit, type EditServer } from "@/shared/models/site-edit.model"
import { EditableText } from "@/shared/components/edit/editable-text"
import { EditToolbar } from "@/shared/components/edit/edit-toolbar"
import { EditEntry } from "@/shared/components/edit/edit-entry"
import { EditableSections } from "@/shared/components/edit/editable-sections"
import { toStaticKey } from "@/shared/lib/helpers"
import { asBlocks, asSectionsContent } from "@/shared/api/site"
import { ServerSection } from "./server-section"
import type { Data } from "../+data"

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

  siteEdit.setPublishedBlocks(ctx, asBlocks(pageData?.content))

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
        blocks: asBlocks(pageData.content),
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
      <EditEntry active={editing()} canEdit={Boolean(pageData?.canEdit)} />
      <Show when={editing()}>
        <EditToolbar />
      </Show>
    </MainWrapperPage>
  )
}, "ServersPage")
