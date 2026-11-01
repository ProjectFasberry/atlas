import { reatomComponent, useUpdate } from "@reatom/npm-react"
import { modpack, modpackState } from "../models/modpack.model"
import { createPrivatedSectionModel } from "../models/shared.model";
import { ButtonXSubmit } from "./ui";
import { Input } from "@/shared/ui/input";
import { spawn } from "@reatom/framework";
import { Skeleton } from "@/shared/ui/skeleton";
import { tv } from "tailwind-variants";
import { ErrorBlock } from "@/shared/ui/error-block";
import { dayjs } from "@/shared/lib/dayjs";
import { Icon } from "@/shared/ui/icon";
import { Button } from "@/shared/ui/button";
import { DeleteButton } from "./ui";
import { isEmptyArray } from "@/shared/lib/utils";
import { Noop } from "@/shared/ui/noop";

const modpackItemVariant = tv({
  base: "flex items-center justify-between h-18 px-2 border border-neutral-800 rounded-lg",
  slots: {
    name: "leading-4 text-base",
    downloadLink: "text-neutral-400 text-sm",
  }
})
const modpacksListVariant = tv({
  base: "flex flex-col w-full gap-2"
})

const ModpackList = reatomComponent(({ ctx }) => {
  useUpdate(modpack.fetch, []);

  if (ctx.spy(modpack.fetch.statusesAtom).isFirstPending) {
    return (
      <div className={modpacksListVariant()}>
        {Array.from({ length: 3 }).map((_, idx) => <Skeleton key={idx} className={modpackItemVariant().base()} />)}
      </div>
    )
  }

  const error = ctx.spy(modpack.fetch.errorAtom)
  if (error) return <ErrorBlock title={error.message} />

  const data = ctx.spy(modpackState.data)
  if (!data || isEmptyArray(data)) return <Noop title="пусто" />

  return (
    <div className={modpacksListVariant()}>
      {data.map((item) => (
        <div
          key={item.id}
          className={modpackItemVariant().base()}
        >
          <div className="flex items-center gap-3">
            <Icon name="sprite:book" className="size-8" />
            <div className="flex flex-col">
              <p className={modpackItemVariant().name()}>{item.name}</p>
              <span className="text-neutral-400 text-[12px]">
                от {dayjs(item.created_at).format("DD MMM YYYY")}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <a
              href={item.downloadLink}
              className={modpackItemVariant().downloadLink()}
              target="_blank"
            >
              <Button background="white" className="text-sm h-6 font-semibold">
                Перейти
              </Button>
            </a>
            <DeleteButton
              disabled={ctx.spy(modpack.delete.statusesAtom).isPending}
              onClick={() => spawn(ctx, (spawnCtx) => modpack.deleteBefore(spawnCtx, item.id))}
              data-error={ctx.spy(modpack.delete.errorAtom)}
            />
          </div>
        </div>
      ))}
    </div>
  )
}, "Modpack")

const CreateModpackSubmit = reatomComponent(({ ctx }) => {
  return (
    <ButtonXSubmit
      onClick={() => modpack.create(ctx)}
      disabled={ctx.spy(modpack.create.statusesAtom).isPending}
    />
  )
}, "CreateModpackSubmit")

const fields = [
  { label: "Название", atom: modpackState.create.modpackName },
  { label: "Ссылка на скачивание", atom: modpackState.create.downloadLink }
]

const CreateModpackField = reatomComponent<typeof fields[number]>(({ ctx, label, atom }) => {
  return (
    <Input
      placeholder={label}
      value={ctx.spy(atom)}
      onChange={(e) => atom(ctx, e.target.value)}
    />
  )
}, "CreateModpackField")
const CreateModpackForm = reatomComponent(({ ctx }) => {
  const handle = (e: React.FormEvent) => {
    e.preventDefault()
    spawn(ctx, (spawnCtx) => modpack.create(spawnCtx))
  }

  const error = ctx.spy(modpack.create.errorAtom)

  return (
    <div className="flex flex-col w-full gap-4">
      <form onSubmit={handle} className="flex flex-col w-full gap-1">
        {fields.map((field, idx) => <CreateModpackField key={idx} {...field} />)}
      </form>
      {error && (
        <ErrorBlock title={error.message} />
      )}
    </div>
  )
}, "CreateModpackForm")

export const modpackSection = createPrivatedSectionModel({
  event: "modpack",
  components: {
    header: {
      create: <CreateModpackSubmit />,
      edit: null
    },
    content: {
      create: <CreateModpackForm />,
      edit: null,
      view: <ModpackList />
    }
  },
})
