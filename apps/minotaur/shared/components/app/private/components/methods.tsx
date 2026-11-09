import { reatomComponent, useUpdate } from "@reatom/npm-react";
import { Skeleton } from "@/shared/ui/skeleton";
import { Typography } from "@/shared/ui/typography";
import { tv } from "tailwind-variants";
import { methodsModel, type PrivatedMethodsPayload } from "../models/methods.model";
import { Switch } from "@/shared/ui/switch";
import { ErrorBlock } from "@/shared/ui/error-block";
import { Button } from "@/shared/ui/button";

const { methods, methodsControl, getMethodIsLoading } = methodsModel()

const methodVariant = tv({
  base: `flex items-center justify-between gap-1 border border-neutral-800 rounded-lg px-2 h-10 w-full`,
  slots: {
    first_parent: "flex items-center min-w-0 gap-1 sm:gap-2",
    image: "h-6 w-6 rounded-lg",
    second_parent: "flex items-center gap-2 h-full",
    title: "truncate text-sm"
  }
})

const MethodSkeleton = () => {
  return (
    <div
      className={methodVariant().base()}
    >
      <div className={methodVariant().first_parent()}>
        <Skeleton
          className={methodVariant().image()}
        />
        <Skeleton className={methodVariant().title()} />
      </div>
      <div className={methodVariant().second_parent()}>
        <Skeleton
          className="h-6 w-24"
        />
      </div>
    </div>
  )
}

const Method = reatomComponent<PrivatedMethodsPayload[number]>(({
  ctx, id, value, imageUrl, title, isAvailable
}) => {
  const isLoading = ctx.spy(getMethodIsLoading(id));

  const toggle = () => {
    if (isLoading) return;
    methodsControl.update(ctx, id, "isAvailable", !isAvailable);
  }

  return (
    // biome-ignore lint/a11y/useSemanticElements: the row contains the switch control, a nested <button> is invalid
    <div
      id={id.toString()}
      role="button"
      tabIndex={0}
      aria-pressed={isAvailable}
      onClick={toggle}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        toggle();
      }}
      className={methodVariant().base() + " cursor-pointer select-none duration-150 hover:border-neutral-700"}
    >
      <div className={methodVariant().first_parent()}>
        <img
          src={imageUrl}
          alt=""
          draggable={false}
          className={methodVariant().image()}
        />
        <Typography className={methodVariant().title()}>
          {title}
        </Typography>
      </div>
      <div className={methodVariant().second_parent()} onClick={(event) => event.stopPropagation()}>
        <span className="text-[11px] font-semibold text-neutral-400">
          {isAvailable ? "Вкл" : "Выкл"}
        </span>
        <Switch
          checked={isAvailable}
          onCheckedChange={({ checked }) => methodsControl.update(ctx, id, "isAvailable", checked)}
          isLoading={isLoading}
          disabled={isLoading}
        />
      </div>
    </div>
  )
}, "Method")

export const Methods = reatomComponent(({ ctx }) => {
  useUpdate(methods.fetch, []);

  if (ctx.spy(methods.fetch.statusesAtom).isFirstPending) {
    return Array.from({ length: 3 }).map((_, idx) => <MethodSkeleton key={idx} />)
  }

  const error = ctx.spy(methods.fetch.errorAtom)
  if (error) {
    return (
      <div className="flex flex-col items-start gap-2">
        <ErrorBlock title={error.message} />
        <Button background="default" className="h-8 text-sm" onClick={() => methods.fetch(ctx)}>
          Повторить
        </Button>
      </div>
    )
  }

  const data = ctx.spy(methods.fetch.dataAtom);
  if (!data) return null;

  return data.map((method) => <Method key={method.id} {...method} />)
}, "Methods")
