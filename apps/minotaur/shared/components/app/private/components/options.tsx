import { reatomComponent, useUpdate } from "@reatom/npm-react";
import { Skeleton } from "@/shared/ui/skeleton";
import { Typography } from "@/shared/ui/typography"
import { type Option, optionsModel } from "../models/options.model";
import { atom } from "@reatom/framework";
import { Switch } from "@/shared/ui/switch";
import { tv } from "tailwind-variants";
import { ErrorBlock } from "@/shared/ui/error-block";
import { Noop } from "@/shared/ui/noop";
import { Button } from "@/shared/ui/button";

const { options, optionsControl, getOptionIsLoading, optionsAtom } = optionsModel()

/**
 * The API returns only `name`/`title`/`value`; the meaning of each switch is
 * obvious to the person who added it and to nobody else. Keep the human
 * descriptions here, next to the list, instead of guessing from the name.
 */
const OPTION_DESCRIPTIONS: Record<string, string> = {
  registrationEnabled: "Разрешить регистрацию новых аккаунтов",
  botCheckEnabled: "Проверять регистрацию на ботов",
  autoUpdatingPlayersSkins: "Автоматически обновлять скины игроков",
  eventsLogging: "Записывать события в журнал администраторов",
  "logging.validators": "Логировать проверки прав и сессий",
  "logging.globalError": "Логировать необработанные ошибки",
  "logging.requests": "Логировать HTTP-запросы",
}

const OPTION_GROUP_LABELS: Record<string, string> = {
  general: "Основные",
  logging: "Логирование",
}

const optionItemVariant = tv({
  base: `
    flex border border-neutral-800 h-auto min-h-10 rounded-lg px-2 py-2 items-center justify-between w-full gap-3
    cursor-pointer select-none outline-none duration-150 hover:border-neutral-700
    focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-400
  `,
  slots: {
    label: "text-sm",
    description: "text-[11px] leading-3 text-neutral-500",
    state: "text-[11px] font-semibold text-neutral-400",
  }
})

const OptionsListSkeleton = () => Array.from({ length: 3 }).map((_, idx) => (
  <div key={idx} className={optionItemVariant().base()}>
    <Skeleton className="w-36 h-6" />
    <Skeleton className="w-9 h-6 rounded-full" />
  </div>
))

const OptionItem = reatomComponent<Option>(({ ctx, name, title, value }) => {
  const isLoading = ctx.spy(getOptionIsLoading(name));
  const description = OPTION_DESCRIPTIONS[name];

  const toggle = () => {
    if (isLoading) return;
    optionsControl.update(ctx, name, !value);
  }

  return (
    // biome-ignore lint/a11y/useSemanticElements: the row contains the switch control, a nested <button> is invalid
    <div
      role="button"
      tabIndex={0}
      aria-pressed={value}
      onClick={toggle}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        toggle();
      }}
      className={optionItemVariant().base()}
    >
      <div className="flex flex-col min-w-0">
        <Typography className={optionItemVariant().label()}>{title}</Typography>
        {description && (
          <Typography className={optionItemVariant().description()}>{description}</Typography>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0" onClick={(event) => event.stopPropagation()}>
        <span className={optionItemVariant().state()}>{value ? "Вкл" : "Выкл"}</span>
        <Switch
          checked={value}
          onCheckedChange={({ checked }) => optionsControl.update(ctx, name, checked)}
          isLoading={isLoading}
          disabled={isLoading}
        />
      </div>
    </div>
  )
}, "OptionItem")

const optionsArrayAtom = atom((ctx) => Array.from(ctx.spy(optionsAtom).values()))

const optionsGroupsAtom = atom((ctx) => {
  const data = ctx.spy(optionsArrayAtom)

  const groups = data.reduce<Record<string, Option[]>>((acc, option) => {
    const namespace = option.name.includes(".") ? option.name.split(".")[0] : "general"
    const list = acc[namespace] ?? []
    list.push(option)
    acc[namespace] = list
    return acc
  }, {})

  return Object.entries(groups).sort(([a], [b]) => {
    if (a === "general") return -1
    if (b === "general") return 1
    return a.localeCompare(b)
  })
})

const OptionsList = reatomComponent(({ ctx }) => {
  useUpdate(options.fetch, []);

  if (ctx.spy(options.fetch.statusesAtom).isFirstPending) return <OptionsListSkeleton />

  const error = ctx.spy(options.fetch.errorAtom)
  if (error) {
    return (
      <div className="flex flex-col items-start gap-2">
        <ErrorBlock title={error.message} />
        <Button background="default" className="h-8 text-sm" onClick={() => options.fetch(ctx)}>
          Повторить
        </Button>
      </div>
    )
  }

  const groups = ctx.spy(optionsGroupsAtom)
  if (groups.length === 0) return <Noop />

  return (
    <div className="flex flex-col gap-3">
      {groups.map(([namespace, list]) => (
        <div key={namespace} className="flex flex-col gap-1">
          <Typography className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
            {OPTION_GROUP_LABELS[namespace] ?? namespace}
          </Typography>
          {list.map((option) => <OptionItem key={option.name} {...option} />)}
        </div>
      ))}
    </div>
  )
}, "OptionsList")

export const Options = () => {
  return (
    <div className="flex flex-col gap-1 w-full h-full">
      <OptionsList />
    </div>
  )
}
