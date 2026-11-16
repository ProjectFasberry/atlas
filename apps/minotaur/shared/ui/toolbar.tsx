import { type ButtonHTMLAttributes, type HTMLAttributes } from "react"
import { createListCollection, Select } from "@ark-ui/react/select"
import { Portal } from "@ark-ui/react/portal"
import cn from "cnfast"
import { tv } from "tailwind-variants"
import { Icon } from "@/shared/ui/icon"
import { selectContentBaseStyle, selectVariant } from "@/shared/ui/select"

// Shared toolbar row for filter and sort controls: one column on phones, a
// single row from `sm` up. Items keep the same height (40px) as the icon
// buttons, so a mixed row never looks ragged.
const Toolbar = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={tv({ base: "flex flex-col gap-2 sm:flex-row sm:items-center" })({ className })}
    {...props}
  />
)

const ToolbarGroup = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={tv({ base: "grid grid-cols-2 gap-2 sm:flex sm:flex-1 sm:items-center" })({ className })}
    {...props}
  />
)

const ToolbarActions = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={tv({ base: "flex items-center gap-2 sm:ms-auto" })({ className })}
    {...props}
  />
)

const ToolbarIconButton = ({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    type="button"
    className={tv({
      base: `
        flex size-10 shrink-0 items-center justify-center rounded-xl bg-neutral-900
        text-neutral-400 duration-150 hover:text-neutral-100
        focus-visible:outline-none focus-visible:shadow-lg focus-visible:shadow-black/20
      `
    })({ className })}
    {...props}
  />
)

const toolbarSelectTrigger = () =>
  selectVariant.trigger("w-full min-w-0 bg-neutral-900 text-sm sm:w-auto sm:min-w-[170px]")

type ToolbarSelectItem = {
  label: string,
  value: string
}

type ToolbarSelectProps = {
  label: string,
  items: ToolbarSelectItem[],
  value?: string[],
  onValueChange: (value: string) => void,
  className?: string
}

// Ark select with the chevron inside the trigger: no overlay square and no
// duplicated indicator markup at every call site.
const ToolbarSelect = ({ label, items, value = [], onValueChange, className }: ToolbarSelectProps) => (
  <Select.Root
    collection={createListCollection({ items })}
    value={value}
    onValueChange={({ value }) => value[0] && onValueChange(value[0])}
    className={cn("min-w-0 flex-1 sm:flex-none", className)}
  >
    <Select.Control className={selectVariant.control()}>
      <Select.Trigger aria-label={label} className={toolbarSelectTrigger()}>
        <Select.ValueText className={selectVariant.itemText("min-w-0 flex-1 text-left")} />
        <Select.Indicator className={selectVariant.indicator("pointer-events-none")}>
          <Icon name="sprite:chevron-down" className="size-4" />
        </Select.Indicator>
      </Select.Trigger>
    </Select.Control>
    <Portal>
      <Select.Positioner>
        <Select.Content className={selectVariant.content("min-w-[200px]")} style={selectContentBaseStyle}>
          <Select.ItemGroup className={selectVariant.itemGroup()}>
            {items.map((item) => (
              <Select.Item key={item.value} item={item} className={selectVariant.item()}>
                <Select.ItemText className={selectVariant.itemText()}>{item.label}</Select.ItemText>
                <Select.ItemIndicator className={selectVariant.itemIndicator()}>
                  <Icon name="sprite:check" className="size-4" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.ItemGroup>
        </Select.Content>
      </Select.Positioner>
    </Portal>
    <Select.HiddenSelect />
  </Select.Root>
)

export {
  Toolbar,
  ToolbarGroup,
  ToolbarActions,
  ToolbarIconButton,
  ToolbarSelect,
}

export type { ToolbarSelectItem, ToolbarSelectProps }
