import { editorExtensions as extensions } from "@/shared/components/editor.model";
import { renderToHTMLString } from "@tiptap/static-renderer";
import { For, Show } from "solid-js";
import { dayjs } from "@/shared/lib/create-dayjs";
import { Typography } from "@/shared/ui/typography";
import type { Data } from "../+data";
import { useData } from "vike-solid/useData";
import { translate } from "@/shared/locales/helpers";
import type { JSONContent } from "@tiptap/core";

const RuleItem = (props: { content: JSONContent }) => {
  const html = renderToHTMLString({ extensions, content: props.content });
  return <div innerHTML={html} class="tiptap whitespace-pre-wrap" />
}

export const Rules = () => {
  const data = useData<Data>()?.data.content as JSONContent

  return (
    <Show
      when={data}
      fallback={
        <Typography class="text-2xl text-neutral-400">
          {translate["rules.list.error"]()}
        </Typography>
      }
    >
      {(data) => (
        // @ts-expect-error
        <For each={data()}>
          {(item) => (
            <div class="transparent-achievement-panel lg:gap-4 p-2 lg:p-4 flex flex-col gap-4 w-full h-full">
              <Typography class="text-xl font-semibold">
                {item.category}
              </Typography>
              <RuleItem content={item.content} />
              <Show when={item.updated_at}>
                {(data) => (
                  <div class="flex items-center w-full justify-end">
                  <Typography
                    title={dayjs(data().toString()).format("DD.MM.YYYY hh:mm")}
                    class="text-neutral-400"
                  >
                    {translate["rules.list.updated"]()} {dayjs(data().toString()).fromNow()}
                    </Typography>
                  </div>
                )}
              </Show>
            </div>
          )}
        </For>
      )}
    </Show>
  );
}
