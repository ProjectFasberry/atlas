import { useAtom } from "@reatom/npm-react"
import { clsx } from "cnfast"
import { currentUserState } from "@/shared/models/current-user/index.model"
import { Button } from "@/shared/ui/button"
import { hasTabAccess, type PanelTab } from "../models/tabs.model"

type PanelTabsProps<T extends string> = {
  tabs: readonly PanelTab<T>[]
  value: T
  onChange: (value: T) => void
}

/**
 * Tabs stay visible when the role lacks a permission; the button is disabled so
 * the URL and the content cannot be switched to a section the user cannot read.
 */
export const PanelTabs = <T extends string>({ tabs, value, onChange }: PanelTabsProps<T>) => {
  const [permissions] = useAtom(currentUserState.perms)
  const granted = permissions ?? []

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {tabs.map((tab) => {
        const allowed = hasTabAccess(tab, granted)

        return (
          <Button
            key={tab.value}
            background="default"
            disabled={!allowed}
            aria-disabled={!allowed}
            title={allowed ? undefined : "Нет доступа"}
            className={clsx(
              "h-7 rounded-lg px-3 text-xs",
              value === tab.value ? "bg-neutral-50! text-neutral-950!" : "bg-neutral-800",
              !allowed && "opacity-40",
            )}
            onClick={() => {
              if (allowed) onChange(tab.value)
            }}
          >
            {tab.title}
          </Button>
        )
      })}
    </div>
  )
}
