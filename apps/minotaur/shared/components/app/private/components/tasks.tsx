import { reatomComponent, useUpdate } from "@reatom/npm-react"
import { Dialog } from "@ark-ui/react/dialog"
import { Portal } from "@ark-ui/react/portal"
import { Input } from "@/shared/ui/input"
import { Skeleton } from "@/shared/ui/skeleton"
import { Typography } from "@/shared/ui/typography"
import { Icon } from "@/shared/ui/icon"
import { Button } from "@/shared/ui/button"
import { DialogClose, dialogVariant } from "@/shared/ui/dialog"
import { belkoinImage, charismImage } from "@/shared/consts/images"
import { translate } from "@/shared/locales/helpers"
import { ActionButton, ButtonXSubmit, DeleteButton, EditButton } from "./ui"
import { createPrivatedSectionModel } from "../models/shared.model"
import { taskDelete, taskForm, tasksPanel, type TaskCurrency, type TaskItem } from "../models/task.model"

const CURRENCIES: { value: TaskCurrency, image: string }[] = [
  { value: "BELKOIN", image: belkoinImage },
  { value: "CHARISM", image: charismImage },
]

const TaskCurrencyPicker = reatomComponent(({ ctx }) => {
  const current = ctx.spy(taskForm.currency)

  return (
    <div className="flex items-center gap-1">
      {CURRENCIES.map((currency) => (
        <button
          key={currency.value}
          type="button"
          aria-pressed={current === currency.value}
          onClick={() => taskForm.currency(ctx, currency.value)}
          className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold duration-150
            ${current === currency.value
              ? "bg-neutral-50 text-neutral-950"
              : "bg-neutral-800 text-neutral-400 hover:text-neutral-100"
            }`}
        >
          <img src={currency.image} alt="" className="size-4" />
          {currency.value}
        </button>
      ))}
    </div>
  )
}, "TaskCurrencyPicker")

const TaskFormFields = reatomComponent(({ ctx }) => {
  return (
    <div className="flex flex-col gap-2">
      <Input
        placeholder={translate["private.tasks.form.title"]()}
        value={ctx.spy(taskForm.title)}
        onChange={(event) => taskForm.title(ctx, event.target.value)}
      />
      <Input
        placeholder={translate["private.tasks.form.description"]()}
        value={ctx.spy(taskForm.description)}
        onChange={(event) => taskForm.description(ctx, event.target.value)}
      />
      <Input
        placeholder={translate["private.tasks.form.link"]()}
        value={ctx.spy(taskForm.link)}
        onChange={(event) => taskForm.link(ctx, event.target.value)}
      />
      <span className="text-[11px] text-neutral-500">{translate["private.tasks.form.linkHint"]()}</span>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="number"
          min={1}
          placeholder={translate["private.tasks.form.reward"]()}
          value={ctx.spy(taskForm.reward)}
          onChange={(event) => taskForm.reward(ctx, event.target.value)}
          className="w-32"
        />
        <TaskCurrencyPicker />
      </div>
      <div className="flex flex-col gap-1">
        <Input
          type="datetime-local"
          value={ctx.spy(taskForm.expires)}
          onChange={(event) => taskForm.expires(ctx, event.target.value)}
        />
        <span className="text-[11px] text-neutral-500">{translate["private.tasks.form.expiresHint"]()}</span>
      </div>
    </div>
  )
}, "TaskFormFields")

const TaskFormSubmit = reatomComponent(({ ctx }) => {
  const isValid = ctx.spy(taskForm.isValid)
  const pending = ctx.spy(taskForm.submit.statusesAtom).isPending

  return (
    <ButtonXSubmit
      onClick={() => taskForm.submit(ctx)}
      disabled={!isValid || pending}
    />
  )
}, "TaskFormSubmit")

const TasksCreateForm = reatomComponent(({ ctx }) => {
  useUpdate((ctx) => { taskForm.openCreate(ctx) }, [])

  return (
    <div className="flex flex-col gap-2 w-full">
      <Typography className="font-semibold">
        {translate["private.tasks.form.createTitle"]()}
      </Typography>
      <TaskFormFields />
    </div>
  )
}, "TasksCreateForm")

const TaskEditDialog = reatomComponent(({ ctx }) => {
  const isOpen = ctx.spy(taskForm.isOpen)
  const isValid = ctx.spy(taskForm.isValid)
  const pending = ctx.spy(taskForm.submit.statusesAtom).isPending

  return (
    <Dialog.Root open={isOpen} onOpenChange={({ open }) => !open && taskForm.close(ctx)}>
      <Portal>
        <Dialog.Backdrop className={dialogVariant.backdrop()} />
        <Dialog.Positioner className={dialogVariant.positioner()}>
          <Dialog.Content className={dialogVariant.content("w-full max-w-xl")}>
            <div className="flex flex-col gap-3 p-1">
              <Typography className="text-lg font-semibold">
                {translate["private.tasks.form.editTitle"]()}
              </Typography>
              <TaskFormFields />
              <div className="flex items-center justify-end gap-2">
                <Button background="default" className="h-8 text-xs" onClick={() => taskForm.close(ctx)}>
                  {translate["private.tasks.form.cancel"]()}
                </Button>
                <Button
                  background="positive"
                  className="h-8 text-xs"
                  disabled={!isValid || pending}
                  onClick={() => taskForm.submit(ctx)}
                >
                  {translate["private.tasks.form.submit"]()}
                </Button>
              </div>
            </div>
            <DialogClose />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}, "TaskEditDialog")

const formatExpires = (value: string | null) => {
  if (!value) return translate["private.tasks.noExpires"]()

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return translate["private.tasks.noExpires"]()

  const label = date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" })
  const expired = date.getTime() < Date.now()
  return translate[expired ? "private.tasks.expired" : "private.tasks.expires"]({ date: label })
}

const TaskListItem = reatomComponent<TaskItem>(({ ctx, ...task }) => {
  const pending = ctx.spy(taskDelete.submit.statusesAtom).isPending

  return (
    <div className="flex items-center gap-2 justify-between w-full border border-neutral-800 p-2 rounded-lg flex-wrap">
      <div className="flex flex-col min-w-0">
        <Typography className="truncate font-semibold leading-tight">
          {task.title}
        </Typography>
        <Typography color="gray" className="truncate text-xs">
          {task.description}
        </Typography>
      </div>
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1 text-sm">
          <img
            src={task.reward_currency === "CHARISM" ? charismImage : belkoinImage}
            alt=""
            className="size-4"
          />
          {task.reward_value}
        </span>
        <Typography color="gray" className="text-xs whitespace-nowrap">
          {formatExpires(task.expires)}
        </Typography>
        <div className="flex items-center gap-1">
          <EditButton onClick={() => taskForm.openEdit(ctx, task)} />
          <DeleteButton
            disabled={pending}
            onClick={() => taskDelete.confirm(ctx, task)}
          />
        </div>
      </div>
    </div>
  )
}, "TaskListItem")

const TasksListSkeleton = () => (
  <div className="flex flex-col gap-2 w-full h-full">
    {Array.from({ length: 3 }).map((_, idx) => <Skeleton key={idx} className="h-16 w-full" />)}
  </div>
)

const TasksEmpty = () => (
  <div className="flex flex-col items-center gap-2 py-12 text-center">
    <Icon name="sprite:trophy" className="size-8 text-neutral-600" />
    <Typography color="gray" className="text-sm">
      {translate["private.tasks.empty"]()}
    </Typography>
  </div>
)

const TasksList = reatomComponent(({ ctx }) => {
  useUpdate(tasksPanel.fetch, [])

  if (ctx.spy(tasksPanel.fetch.statusesAtom).isFirstPending) {
    return <TasksListSkeleton />
  }

  const data = ctx.spy(tasksPanel.fetch.dataAtom)
  if (!data) return null
  if (data.length === 0) return <TasksEmpty />

  return (
    <>
      <div className="flex flex-col gap-2 w-full h-full">
        {data.map((task) => <TaskListItem key={task.id} {...task} />)}
      </div>
      <TaskEditDialog />
    </>
  )
}, "TasksList")

export const tasksSection = createPrivatedSectionModel({
  event: "task",
  components: {
    header: {
      create: <TaskFormSubmit />,
      edit: null,
    },
    content: {
      create: <TasksCreateForm />,
      edit: null,
      view: <TasksList />,
    },
  },
})
