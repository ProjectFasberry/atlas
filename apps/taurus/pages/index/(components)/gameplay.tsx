import { createEffect, createMemo, For, Show } from "solid-js";
import { tv } from "tailwind-variants";
import { createIdeas, selectedKeyAtom } from "../(models)/gameplay.model";
import { Typography } from "@/shared/ui/typography";
import { Icon } from "@/shared/ui/icon";
import { Link } from "@/shared/components/link";
import { atom } from "@reatom/framework";
import { useAtomAccessor } from "@/shared/lib/utils";
import { reatomComponent } from "@/shared/lib/reatom";
import { translate } from "@/shared/locales/helpers";

const navigationBadge = tv({
  base: `snap-start justify-center cursor-pointer whitespace-nowrap px-3 py-2
    focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white`,
  variants: {
    variant: {
      unselected: "raised-slot text-neutral-700 hover:text-neutral-950",
      selected: `raised-slot relative font-semibold text-neutral-950
        after:absolute after:inset-x-2 after:bottom-1 after:h-0.5 after:bg-neutral-800`,
    },
  },
});

const previewCard = tv({
  base: `relative flex w-full overflow-hidden transparent-achievement-panel
    min-h-80 sm:min-h-96 lg:min-h-115 lg:max-w-5xl`,
});

const previewText = tv({
  base: `relative z-1 flex flex-col justify-center gap-3 p-5 sm:p-7 lg:w-3/4 lg:p-10`,
});

const arrowButton = tv({
  base: `raised-slot-button flex size-11 shrink-0 cursor-pointer items-center justify-center
    text-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2
    focus-visible:outline-white disabled:pointer-events-none disabled:opacity-40`,
});

const getIsActiveAtom = (id: number) => atom((ctx) => ctx.spy(selectedKeyAtom) === id);

const IdeasItem = reatomComponent<{ idx: number, title: string, ref: (el: HTMLButtonElement) => void }>(
  ({ ctx, ...props }) => {
    const isActive = useAtomAccessor(getIsActiveAtom(props.idx));

    return (
      <button
        ref={props.ref}
        type="button"
        role="tab"
        id={`feature-tab-${props.idx}`}
        aria-selected={isActive()}
        aria-controls="feature-panel"
        tabindex={isActive() ? 0 : -1}
        data-state={isActive() ? "active" : "inactive"}
        onClick={() => selectedKeyAtom(ctx, props.idx)}
        class={navigationBadge({ variant: isActive() ? "selected" : "unselected" })}
      >
        <span class="truncate">{props.title}</span>
      </button>
    );
  },
  "IdeasItem",
);

/** Tabs, arrows and keyboard/mouse navigation around the feature preview. */
export const IdeasNav = reatomComponent(({ ctx }) => {
  const selected = useAtomAccessor(selectedKeyAtom);
  const ideas = createIdeas();
  const tabs: HTMLButtonElement[] = [];

  const focusTab = (index: number) => {
    selectedKeyAtom(ctx, index);
    ctx.schedule(() => tabs[index]?.focus());
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const last = ideas.length - 1;
    const current = selected();

    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        focusTab(current === last ? 0 : current + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        focusTab(current === 0 ? last : current - 1);
        break;
      case "Home":
        event.preventDefault();
        focusTab(0);
        break;
      case "End":
        event.preventDefault();
        focusTab(last);
        break;
    }
  };

  // Keep the selected tab in view when it changes from the arrows, keyboard or
  // a restored state; `block: nearest` does not scroll the page itself.
  createEffect(() => {
    tabs[selected()]?.scrollIntoView({ inline: "center", block: "nearest" });
  });

  return (
    <div
      class="flex w-full items-center justify-center gap-2 lg:max-w-5xl"
      onKeyDown={onKeyDown}
    >
      <button
        type="button"
        class={arrowButton()}
        aria-label={translate["features.prev"]()}
        onClick={() => selectedKeyAtom.prev(ctx)}
      >
        <Icon name="sprite:arrow-left" class="size-5" />
      </button>
      <div
        role="tablist"
        aria-label={translate["features.title"]()}
        aria-orientation="horizontal"
        class="flex min-w-0 max-w-[calc(100vw-8.5rem)] snap-x items-center gap-1
          overflow-x-auto scrollbar scrollbar-h-0 scrollbar-thumb-neutral-900"
      >
        <For each={ideas}>
          {(idea, idx) => (
            <IdeasItem
              idx={idx()}
              title={idea.tabTitle}
              ref={(el) => (tabs[idx()] = el)}
            />
          )}
        </For>
      </div>
      <button
        type="button"
        class={arrowButton()}
        aria-label={translate["features.next"]()}
        onClick={() => selectedKeyAtom.next(ctx)}
      >
        <Icon name="sprite:arrow-right" class="size-5" />
      </button>
      <span class="hidden min-w-12 text-center text-sm tabular-nums text-neutral-400 sm:block">
        {selected() + 1} / {ideas.length}
      </span>
    </div>
  );
}, "IdeasNav");

export const IdeaPreviewCard = reatomComponent(({ ctx }) => {
  const selected = useAtomAccessor(selectedKeyAtom);
  const idea = createMemo(() => createIdeas()[selected()]);

  let startX: number | null = null;

  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType === "touch") startX = event.clientX;
  };

  const onPointerUp = (event: PointerEvent) => {
    if (startX === null) return;

    const delta = event.clientX - startX;
    startX = null;

    if (Math.abs(delta) < 60) return;
    if (delta < 0) selectedKeyAtom.next(ctx);
    else selectedKeyAtom.prev(ctx);
  };

  return (
    <div
      id="feature-panel"
      role="tabpanel"
      aria-labelledby={`feature-tab-${selected()}`}
      tabindex={0}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      class={previewCard()}
    >
      <img
        src={idea().image}
        alt=""
        width={1000}
        height={1000}
        loading="lazy"
        class="absolute inset-0 size-full object-cover brightness-[55%]"
      />
      <div class="absolute inset-0
        max-sm:bg-[linear-gradient(180deg,rgba(10,10,12,.2)_0%,rgba(10,10,12,.55)_45%,rgba(10,10,12,.9)_100%)]
        sm:bg-[linear-gradient(90deg,rgba(10,10,12,.9)_0%,rgba(10,10,12,.62)_55%,rgba(10,10,12,.18)_100%)]" />
      <div class={previewText()}>
        <Typography class="text-xl text-shadow-xl sm:text-3xl lg:text-4xl">
          {idea().title}
        </Typography>
        <Typography class="text-base leading-6 text-neutral-100 text-shadow-lg sm:text-lg lg:text-xl">
          {idea().description}
        </Typography>
        <Show when={idea().link}>
          {(item) => (
            <Link href={item().href} class="mt-2 w-fit">
              <span class="button inline-flex items-center px-4 py-2 text-sm font-semibold text-white">
                {item().title}
              </span>
            </Link>
          )}
        </Show>
      </div>
    </div>
  );
}, "IdeaPreviewCard");
