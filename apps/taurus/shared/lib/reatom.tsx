import type { Ctx } from "@reatom/framework";
import { useCtx } from "@reatom/npm-solid-js";
import { mergeProps, type Component, type JSX } from "solid-js";

export type ReatomComponentProps<T extends object = {}> = T & { ctx: Ctx }

export const reatomComponent = <T extends object>(
  render: (props: ReatomComponentProps<T>) => JSX.Element,
  name?: string
): Component<T> => {
  const ReatomComponent = (props: T) => {
    const ctx = useCtx()
    return render(mergeProps(props, { ctx }) as ReatomComponentProps<T>)
  }

  Object.defineProperty(ReatomComponent, "name", {
    value: name ?? render.name ?? "ReatomComponent"
  })

  return ReatomComponent
}