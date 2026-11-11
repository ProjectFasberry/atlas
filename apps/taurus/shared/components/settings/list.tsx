import { For, Index } from "solid-js";
import { settingsListAtom } from "./settings.model";
import { entries } from "@reatom/framework";
import { Select } from "@ark-ui/solid/select";
import { Typography } from "@/shared/ui/typography";
import { selectVariant } from "@/shared/ui/select";
import { Icon } from "@/shared/ui/icon";
import { Portal } from "solid-js/web";
import { useAtomAccessor } from "@/shared/lib/utils";

export const SettingsList = () => {
  const list = useAtomAccessor(settingsListAtom);

  return (
    <For each={entries(list())}>
      {([_, data]) => {
        const current = useAtomAccessor(data.current);

        return (
          <div class="flex items-center justify-between w-full gap-1">
            <Typography>{data.title}</Typography>
            <Select.Root
              collection={data.collection}
              onValueChange={(details) => data.onChange(details.value[0])}
            >
              <Select.Control class={selectVariant.control()}>
                <Select.Trigger class={selectVariant.trigger()}>
                  <Select.ValueText>
                    {current().title}
                  </Select.ValueText>
                </Select.Trigger>
                <div class={selectVariant.indicators()}>
                  <Select.ClearTrigger class={selectVariant.clearTrigger()}>
                    <Icon name="sprite:x" />
                  </Select.ClearTrigger>
                </div>
              </Select.Control>
              <Portal>
                <Select.Positioner>
                  <Select.Content class={selectVariant.content()}>
                    <Select.ItemGroup class={selectVariant.itemGroup()}>
                      <div class="flex flex-col gap-1 w-full h-full">
                        <Index each={data.list}>
                          {(item) => (
                            <Select.Item item={item()} class={selectVariant.item()}>
                              <Select.ItemText class={selectVariant.itemText()}>
                                {item().title}
                              </Select.ItemText>
                              <Select.ItemIndicator class={selectVariant.itemIndicator()}>
                                ✓
                              </Select.ItemIndicator>
                            </Select.Item>
                          )}
                        </Index>
                      </div>
                    </Select.ItemGroup>
                  </Select.Content>
                </Select.Positioner>
              </Portal>
              <Select.HiddenSelect />
            </Select.Root>
          </div>
        )
      }}
    </For>
  )
}
