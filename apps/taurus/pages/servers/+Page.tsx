import { For, Show, type Accessor } from "solid-js"
import { useData } from "vike-solid/useData"
import { Typography } from "@/shared/ui/typography"
import { Button } from "@/shared/ui/button"
import { Link } from "@/shared/components/link"
import { MainWrapperPage } from "@/shared/ui/main-wrapper"
import { reatomComponent } from "@/shared/lib/reatom"
import { useAtomAccessor } from "@/shared/lib/utils"
import { translate } from "@/shared/locales/helpers"
import { createServerProfiles, type ServerProfile } from "./(models)/servers.model"
import { siteEdit, type EditServer } from "@/shared/models/site-edit.model"
import { EditableText } from "@/shared/components/edit/editable-text"
import { toStaticKey } from "@/shared/lib/helpers"
import { asBlocks, asServersContent, asSectionsContent } from "@/shared/api/site"
import { EditProvider } from "@/shared/components/edit/edit-provider"
import { PageEdit } from "@/shared/components/edit/page-edit"
import { ServerSection } from "./(components)/server-section"
import type { Data } from "./+data"

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

const ConnectBlock = () => (
  <section class="transparent-achievement-panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
    <div class="flex flex-col gap-1">
      <Typography color="white" class="text-lg font-semibold">
        {translate["servers.connect.title"]()}
      </Typography>
      <Typography color="gray" class="text-sm">
        {translate["servers.connect.description"]()}
      </Typography>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <code class="rounded-lg bg-neutral-800 px-3 py-2 text-sm text-green-300">play.fasberry.fun</code>
      <Link href="/start">
        <Button class="px-4 py-1">
          <Typography color="white" class="text-sm font-semibold">
            {translate["servers.connect.launch"]()}
          </Typography>
        </Button>
      </Link>
    </div>
  </section>
)

const ServersView = reatomComponent<{ pageData: Data, editing: Accessor<boolean> }>(({ ctx, ...props }) => {
  const editContent = useAtomAccessor(siteEdit.content)
  const profiles = () => createServerProfiles(props.pageData?.content)

  const view = () => {
    const content = editContent()

    if (props.editing() && content?.kind === "servers") return content

    return {
      title: props.pageData.content?.title ?? translate["servers.page.title"](),
      description: props.pageData.content?.description ?? translate["servers.page.description"](),
      servers: toEditServers(profiles()),
    }
  }

  return (
    <>
      <div class="flex flex-col gap-2">
        <Show
          when={props.editing()}
          fallback={
            <>
              <Typography color="white" class="text-xl sm:text-3xl lg:text-4xl">{view().title}</Typography>
              <Typography color="gray" class="text-sm sm:text-base">{view().description}</Typography>
            </>
          }
        >
          <EditableText
            class="text-xl sm:text-3xl lg:text-4xl"
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
      <ConnectBlock />
      <div class="grid gap-4 lg:grid-cols-3">
        <For each={view().servers}>
          {(server) => <ServerSection server={server} editing={props.editing()} />}
        </For>
      </div>
    </>
  )
}, "ServersView")

export default function Page() {
  const pageData = useData<Data>()
  const editing = useAtomAccessor(siteEdit.active)

  return (
    <MainWrapperPage class={`flex flex-col gap-10 ${editing() ? "pb-24" : ""}`}>
      <EditProvider
        page="servers"
        locale={pageData.locale}
        canEdit={Boolean(pageData.canEdit)}
        canPublish={Boolean(pageData.canPublish)}
        build={(content) => {
          const parsed = asServersContent(content)

          return {
            kind: "servers",
            title: parsed?.title ?? translate["servers.page.title"](),
            description: parsed?.description ?? translate["servers.page.description"](),
            servers: toEditServers(createServerProfiles(parsed)),
            sections: asSectionsContent(content),
            blocks: asBlocks(content),
          }
        }}
      />
      <ServersView pageData={pageData} editing={editing} />
      <PageEdit page="servers" kind="servers" content={pageData.content} canEdit={pageData.canEdit} editing={editing} />
    </MainWrapperPage>
  )
}
