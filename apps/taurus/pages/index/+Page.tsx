import { Link } from "@/shared/components/link"
import { MainWrapperPage } from "@/shared/ui/main-wrapper";
import { Button } from "@/shared/ui/button";
import { Typography } from "@/shared/ui/typography";
import { sectionVariant, sectionVariantChild } from "@/shared/styles/variants";
import { useAtom } from "@reatom/npm-solid-js";
import { For } from "solid-js";
import { SpawnCarousel } from "./(components)/spawn-carousel";
import { IdeaPreviewCard, IdeasList } from "./(components)/gameplay";
import { getStaticObject } from "@/shared/lib/helpers";
import { translate } from "@/shared/locales/helpers";
import { LayoutSettings } from "@/shared/components/settings/settings";
import { appState } from "@/shared/models/app.model";

const introImage = getStaticObject("arts", "server-status-widget.webp")
const shareImage = getStaticObject("arts", "bzzvanet-.jpg")

const CONTACTS_LIST = [
  { name: "Discord", href: "/discord" },
  { name: "Telegram", href: "/telegram" },
];

const Weather = () => {
  const [data] = useAtom(appState.selectedWeather)
  return <div class={`weather ${data()} absolute z-[1] w-full h-full top-0 right-0 left-0`} />
}

export default function Page() {
  return (
    <MainWrapperPage variant="with_section">
      <LayoutSettings />
      <div id="title" class={sectionVariant()}>
        <div class="absolute top-0 right-0 left-0 overflow-hidden h-full">
          <img
            src={introImage}
            alt=""
            fetchpriority="high"
            loading="eager"
            class="w-full h-full absolute top-0 right-0 left-0 object-cover brightness-[55%]"
          />
          <Weather />
        </div>
        <div class="flex items-center justify-start responsive z-1 mx-auto h-full">
          <div
            class="flex flex-col z-[2] w-full px-2 sm:px-0 lg:w-[50%] gap-2 sm:gap-4 justify-start items-start rounded-xl py-4 lg:py-6"
          >
            <div class="flex flex-col items-start justify-center w-full">
              <h1 class={sectionVariantChild().title({ className: "text-pink-300" })}>
                Fasberry Project
              </h1>
              <h2 class={sectionVariantChild().subtitle({ className: "mb-4" })}>
                {translate["welcome.subtitle"]()}
              </h2>
              <h3 class={sectionVariantChild().description({ className: "text-shadow-lg" })}>
                {translate["welcome.description"]()}
              </h3>
            </div>
            <Link href="/start" class={sectionVariantChild().action()}>
              <Button class="w-full py-1 sm:py-1" >
                <Typography color="white" class="text-nowrap text-sm sm:text-base text-shadow-xl">
                  {translate["welcome.action-text"]()}
                </Typography>
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <div id="features" class={sectionVariant()}>
        <div class="flex flex-col items-center mx-auto responsive gap-6 justify-center select-none relative">
          <Typography color="white" class="text-xl text-center sm:text-3xl lg:text-4xl">
            {translate["features.title"]()}
          </Typography>
          <div class="flex items-center justify-center w-full gap-1 sm:gap-6 md:gap-4">
            <div
              class="flex rounded-md overflow-x-auto items-center justify-start w-fit
								scrollbar scrollbar-thumb-rounded-xl scrollbar-h-0 scrollbar-thumb-neutral-900
							"
            >
              <IdeasList />
            </div>
          </div>
          <IdeaPreviewCard />
        </div>
      </div>
      <div id="spawn" class={sectionVariant()}>
        <div class="flex flex-col items-center z-1 mx-auto responsive justify-center relative">
          <div class="flex flex-col gap-4 items-center justify-center h-full sm:overflow-hidden relative w-full">
            <div class="flex items-center justify-center h-full w-full">
              <SpawnCarousel />
            </div>
            <div
              class="flex flex-col backdrop-blur-sm p-4 transparent-achievement-panel w-full gap-2 z-[21] lg:w-[60%] xl:w-[70%]"
            >
              <Typography class="text-base sm:text-lg leading-6 text-center">
                {translate["spawn-server.title"]()}
              </Typography>
              <Typography color="gray" class="!leading-5 text-sm sm:text-base text-center">
                {translate["spawn-server.subtitle"]()}
              </Typography>
            </div>
          </div>
        </div>
      </div>
      <div id="share" class={sectionVariant()}>
        <div class="absolute top-0 right-0 left-0 overflow-hidden h-full">
          <div
            class="w-full h-full absolute top-0 right-0 brightness-[55%] left-0 bg-no-repeat bg-center bg-cover"
            style={{ "background-image": `url('${shareImage}')` }}
          />
        </div>
        <div class="flex flex-col items-center z-1 responsive gap-12 justify-center select-none relative">
          <Typography color="white" class="text-center text-xl sm:text-2xl md:text-4xl lg:text-5xl xl:text-6xl">
            {translate["contacts.title"]()}
          </Typography>
          <div class="flex flex-col gap-4 justify-center items-center lg:w-1/4 *:w-full w-full h-full">
            <For each={CONTACTS_LIST}>
              {(item) =>
                <Link href={item.href} target="_blank">
                  <Button class="w-full py-0.5">
                    <Typography class="text-lg">
                      {translate["contacts.item-title"]()} {item.name}
                    </Typography>
                  </Button>
                </Link>
              }
            </For>
          </div>
        </div>
      </div>
    </MainWrapperPage>
  )
}
