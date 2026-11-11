import { For } from "solid-js";
import { Link } from "@/shared/components/link";
import { Typography } from "@/shared/ui/typography";
import { translate } from "@/shared/locales/helpers";
import { createCommunityItems } from "../(models)/community.model";

export const CommunitySection = () => {
  return (
    <div id="community" class="section-edge relative flex w-full flex-col items-center py-16 sm:py-20 lg:py-28">
      <div class="responsive z-1 flex flex-col gap-6 sm:gap-8">
        <div class="flex flex-col gap-1">
          <Typography color="white" class="text-2xl sm:text-3xl lg:text-4xl">
            {translate["community.title"]()}
          </Typography>
          <Typography color="gray" class="text-sm sm:text-base">
            {translate["community.subtitle"]()}
          </Typography>
        </div>
        <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <For each={createCommunityItems()}>
            {(item) => (
              <Link
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noreferrer" : undefined}
                class="group flex flex-col gap-3 transparent-achievement-panel p-4 duration-300 hover:-translate-y-1 hover:brightness-110"
              >
                <div class="flex items-start justify-between">
                  <span class="raised-slot flex h-11 w-11 items-center justify-center">
                    <img
                      src={item.icon}
                      alt=""
                      width={32}
                      height={32}
                      loading="lazy"
                      draggable={false}
                    />
                  </span>
                  <span class="text-neutral-500 transition-colors group-hover:text-green-400">
                    ↗
                  </span>
                </div>
                <div class="flex flex-col gap-1">
                  <Typography color="white" class="text-base sm:text-lg">
                    {item.title}
                  </Typography>
                  <Typography color="gray" class="text-sm leading-5">
                    {item.description}
                  </Typography>
                </div>
              </Link>
            )}
          </For>
        </div>
      </div>
    </div>
  )
}
