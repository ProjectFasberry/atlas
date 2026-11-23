import { Show } from "solid-js";
import { useData } from "vike-solid/useData";
import { Link } from "@/shared/components/link"
import { MainWrapperPage } from "@/shared/ui/main-wrapper";
import { Button } from "@/shared/ui/button";
import { Typography } from "@/shared/ui/typography";
import { sectionVariant, sectionVariantChild } from "@/shared/styles/variants";
import { For } from "solid-js";
import { SpawnCarousel } from "./(components)/spawn-carousel";
import { IdeaPreviewCard, IdeasNav } from "./(components)/gameplay";
import { getStaticObject } from "@/shared/lib/helpers";
import { translate } from "@/shared/locales/helpers";
import { appState } from "@/shared/models/app.model";
import { OnlineBadge } from "./(components)/online-badge";
import { JoinSection } from "./(components)/join";
import { NewsSection } from "./(components)/news";
import { CommunitySection } from "./(components)/community";
import { FaqSection } from "./(components)/faq";
import { useAtomAccessor } from "@/shared/lib/utils";
import { reatomComponent } from "@/shared/lib/reatom";
import { siteEdit } from "@/shared/models/site-edit.model";
import { EditToolbar } from "@/shared/components/edit/edit-toolbar";
import { createSpawnEditSlides } from "./(models)/spawn-carousel.model";
import { asSectionsContent } from "@/shared/api/site";
import { EditableSections } from "@/shared/components/edit/editable-sections";
import type { Data } from "./+data";

const introImage = getStaticObject("arts", "server-status-widget.webp")
const shareImage = getStaticObject("arts", "bzzvanet-.jpg")

const socialsImage = getStaticObject("arts", "bzzvanet-newyork.webp")

const createSocialItems = () => [
  {
    name: "Discord",
    href: "/discord",
    description: translate["contacts.items.discord.description"](),
  },
  {
    name: "Telegram",
    href: "/telegram",
    description: translate["contacts.items.telegram.description"](),
  },
];

const Weather = () => {
  const data = useAtomAccessor(appState.selectedWeather)
  return <div class={`weather ${data()} absolute z-1 w-full h-full top-0 right-0 left-0`} />
}

export default reatomComponent(({ ctx }) => {
  const pageData = useData<Data>()
  const edit = pageData?.edit
  const editContent = useAtomAccessor(siteEdit.content)

  if (edit?.active) {
    siteEdit.init(ctx, {
      page: "home",
      locale: edit.locale,
      version: edit.version,
      canPublish: edit.canPublish,
      content: {
        kind: "home",
        slides: createSpawnEditSlides(pageData.content),
        sections: asSectionsContent(pageData.content),
      },
    })
  }

  return (
    <MainWrapperPage variant="with_section" class={edit?.active ? "landing-page pb-24" : "landing-page"}>
      <div id="title" class={sectionVariant()}>
        <div class="absolute top-0 right-0 left-0 overflow-hidden h-full">
          <img
            src={introImage}
            alt=""
            fetchpriority="high"
            loading="eager"
            class="w-full h-full absolute top-0 right-0 left-0 object-cover brightness-65"
          />
          <div class="absolute inset-0
          bg-[linear-gradient(180deg,rgba(13,13,13,.5)_0%,rgba(13,13,13,.88)_65%,rgba(13,13,13,.95)_100%)]
          lg:bg-[linear-gradient(90deg,rgba(13,13,13,.92)_0%,rgba(13,13,13,.62)_45%,rgba(13,13,13,.12)_100%)]"
          />
          <Weather />
        </div>
        <div class="flex items-center justify-start responsive z-1 mx-auto h-full">
          <div
            class="flex flex-col z-2 w-full px-2 sm:px-0 lg:w-[55%] gap-2
            sm:gap-4 justify-start items-start rounded-xl py-4 lg:py-6"
          >
            <OnlineBadge />
            <div class="flex flex-col items-start justify-center w-full">
              <h1 class={sectionVariantChild().title({ className: "text-pink-300" })}>
                Fasberry Project
              </h1>
              <h2 class={sectionVariantChild().subtitle({ className: "mb-4 text-balance" })}>
                {translate["welcome.subtitle"]()}
              </h2>
              <h3 class={sectionVariantChild().description({ className: "text-shadow-lg text-pretty" })}>
                {translate["welcome.description"]()}
              </h3>
              <div class="mt-2">
                <span class="text-sm text-neutral-300">{translate["welcome.simple"]()}</span>
              </div>
            </div>
            <div class="flex w-full flex-col items-stretch gap-2 pt-1 sm:flex-row sm:items-center">
              <Link href="/start" class="w-full sm:w-auto">
                <Button class="w-full px-8 py-1 sm:py-1">
                  <Typography color="white" class="text-nowrap text-sm sm:text-base text-shadow-xl">
                    {translate["welcome.action-text"]()}
                  </Typography>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      <JoinSection />
      <div id="features" class={sectionVariant()}>
        <div class="flex flex-col items-center mx-auto responsive gap-6 justify-center relative">
          <Typography color="white" class="text-xl text-center sm:text-3xl lg:text-4xl">
            {translate["features.title"]()}
          </Typography>
          <IdeasNav />
          <IdeaPreviewCard />
          <Link href="/servers" class="w-fit">
            <span class="button inline-flex items-center px-4 py-2 text-sm font-semibold text-white">
              {translate["features.more"]()}
            </span>
          </Link>
        </div>
      </div>
      <NewsSection />
      <div id="spawn" class={sectionVariant()}>
        <div class="flex flex-col items-center z-1 mx-auto responsive justify-center relative">
          <div class="flex flex-col gap-4 items-center justify-center h-full sm:overflow-hidden relative w-full">
            <div class="flex items-center justify-center h-full w-full">
              <SpawnCarousel />
            </div>
            <div
              class="flex flex-col backdrop-blur-sm p-4 transparent-achievement-panel w-full gap-2 z-21 lg:w-[60%] xl:w-[70%]"
            >
              <Typography class="text-base sm:text-lg leading-6 text-center">
                {translate["spawn-server.title"]()}
              </Typography>
              <Typography color="gray" class="leading-5! text-sm sm:text-base text-center">
                {translate["spawn-server.subtitle"]()}
              </Typography>
            </div>
          </div>
        </div>
      </div>
      <CommunitySection />
      <FaqSection />
      <div id="share" class={sectionVariant()}>
        <div class="absolute top-0 right-0 left-0 overflow-hidden h-full">
          <img
            src={socialsImage}
            alt=""
            loading="lazy"
            class="w-full h-full object-cover object-center brightness-70"
          />
          <div class="absolute inset-0
            bg-[linear-gradient(180deg,rgba(13,13,13,.72)_0%,rgba(13,13,13,.35)_45%,rgba(13,13,13,.88)_100%)]" />
        </div>
        <div class="responsive z-1 flex flex-col gap-6 sm:gap-8">
          <div class="flex flex-col gap-1">
            <Typography color="white" class="text-2xl sm:text-3xl lg:text-4xl">
              {translate["contacts.title"]()}
            </Typography>
            <Typography color="gray" class="text-sm sm:text-base">
              {translate["contacts.subtitle"]()}
            </Typography>
          </div>
          <div class="grid w-full gap-3 sm:grid-cols-2 lg:max-w-3xl">
            <For each={createSocialItems()}>
              {(item) => (
                <Link
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  class="group flex flex-col gap-3 transparent-achievement-panel bg-black/40 p-4
                    backdrop-blur-sm"
                >
                  <div class="flex items-start justify-between gap-4">
                    <Typography color="white" class="text-xl sm:text-2xl">
                      {item.name}
                    </Typography>
                    <span class="text-neutral-500 group-hover:text-green-400">
                      ↗
                    </span>
                  </div>
                  <Typography color="gray" class="text-sm leading-5 sm:text-base">
                    {item.description}
                  </Typography>
                  <span class="button mt-auto inline-flex w-fit items-center px-4 py-2
                    text-sm font-semibold text-white">
                    {translate["contacts.item-title"]()} {item.name}
                  </span>
                </Link>
              )}
            </For>
          </div>
        </div>
      </div>
      <EditableSections
        sections={edit?.active && editContent()
          ? editContent()!.sections
          : asSectionsContent(pageData.content)}
        editing={Boolean(edit?.active)}
      />
      <Show when={edit?.active}>
        <EditToolbar />
      </Show>
    </MainWrapperPage>
  )
}, "LandingPage")
