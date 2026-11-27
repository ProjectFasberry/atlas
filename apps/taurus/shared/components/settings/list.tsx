import { For } from "solid-js"
import { entries } from "@reatom/framework"
import { Typography } from "@/shared/ui/typography"
import { settingsListAtom } from "./settings.model"
import { useAtomAccessor } from "@/shared/lib/utils"
import { translate } from "@/shared/locales/helpers"

export const SettingsList = () => {
  const list = useAtomAccessor(settingsListAtom)

  return (
    <For each={entries(list())}>
      {([_, data]) => {
        const current = useAtomAccessor(data.current)

        const index = () => {
          const position = data.list.findIndex((item) => item.value === current().value)
          return position < 0 ? 0 : position
        }

        const step = (delta: 1 | -1) => {
          const next = (index() + delta + data.list.length) % data.list.length
          data.onChange(data.list[next].value)
        }

        return (
          <div class="flex items-center gap-2 border-b border-white/5 py-2 last:border-b-0">
            <span class="raised-slot flex size-9 shrink-0 items-center justify-center">
              <img
                src={data.icon}
                alt=""
                width={24}
                height={24}
                loading="lazy"
                draggable={false}
                class="size-6 object-contain"
              />
            </span>
            <Typography color="white" class="text-shadow-sm text-sm sm:text-base">
              {data.title}
            </Typography>
            <div class="ml-auto flex items-center gap-1">
              <button
                type="button"
                class="button size-8 shrink-0 p-0 text-lg leading-none"
                aria-label={translate["settings.previous"]()}
                onClick={() => step(-1)}
              >
                ‹
              </button>
              <button
                type="button"
                class="button min-w-32 px-3 py-1 text-sm sm:min-w-36"
                onClick={() => step(1)}
              >
                {current().title}
              </button>
              <button
                type="button"
                class="button size-8 shrink-0 p-0 text-lg leading-none"
                aria-label={translate["settings.next"]()}
                onClick={() => step(1)}
              >
                ›
              </button>
            </div>
          </div>
        )
      }}
    </For>
  )
}
