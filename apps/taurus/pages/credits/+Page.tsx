import { For } from "solid-js";
import { MainWrapperPage } from "@/shared/ui/main-wrapper";
import { Typography } from "@/shared/ui/typography";
import { translate } from "@/shared/locales/helpers";

/**
 * Plain attribution page. Every entry is a third-party author, so the list is
 * code (names and links do not need translating) while the roles stay in the
 * message files.
 */
const CREDITS = [
  {
    name: "bzzVanet",
    href: "https://linktr.ee/bzzvanet",
    title: () => translate["credits.sections.images.title"](),
    description: () => translate["credits.sections.images.description"](),
  },
  {
    name: "Tabler Icons",
    href: "https://tabler.io/icons",
    title: () => translate["credits.sections.icons.title"](),
    description: () => translate["credits.sections.icons.description"](),
  },
  {
    name: "Minecraft Rus",
    href: "https://fontsgeek.com/fonts/Minecraft-Rus-Regular",
    title: () => translate["credits.sections.font.title"](),
    description: () => translate["credits.sections.font.description"](),
  },
] as const

export default function Page() {
  return (
    <MainWrapperPage>
      <div class="flex flex-col gap-6">
        <div class="flex flex-col gap-2">
          <h1 class="text-3xl text-white text-shadow-lg">
            {translate["credits.title"]()}
          </h1>
          <Typography color="gray">
            {translate["credits.description"]()}
          </Typography>
        </div>
        <ul class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <For each={CREDITS}>
            {(item) => (
              <li class="transparent-achievement-panel flex flex-col gap-1 p-5">
                <p class="text-lg text-white">{item.title()}</p>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  class="text-fuchsia-300 hover:underline"
                >
                  {item.name}
                </a>
                <Typography color="gray" class="text-sm">
                  {item.description()}
                </Typography>
              </li>
            )}
          </For>
        </ul>
        <Typography color="gray" class="text-sm">
          {translate["credits.minecraft-note"]()}
        </Typography>
      </div>
    </MainWrapperPage>
  );
}
