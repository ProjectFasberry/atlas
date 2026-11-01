import { reatomComponent, useUpdate } from "@reatom/npm-react";
import { apiKeys, apiKeysState } from "../models/api-keys.model";
import { Skeleton } from "@/shared/ui/skeleton";
import { ErrorBlock } from "@/shared/ui/error-block";
import { createPrivatedSectionModel } from "../models/shared.model";
import { Input } from "@/shared/ui/input";
import { spawn, type AtomMut } from "@reatom/framework";
import { ButtonXSubmit, DeleteButton } from "./ui";
import { dayjs } from "@/shared/lib/dayjs";
import { Dialog } from "@ark-ui/react/dialog";
import { Portal } from "@ark-ui/react/portal";
import { DialogClose, dialogVariant } from "@/shared/ui/dialog";
import { Copy } from "@/shared/ui/copy";
import { Typography } from "@/shared/ui/typography";
import { Button } from "@/shared/ui/button";

const fields = [
  { label: "Описание", atom: apiKeysState.description, required: false },
  { label: "Длительность", atom: apiKeysState.duration, required: false },
]
const CreateApiKeyField = reatomComponent<typeof fields[number]>(({ ctx, label, atom, required }) => {
  const currentAtom = atom as AtomMut<string | number>;
  const v = ctx.spy(currentAtom);

  return (
    <Input
      placeholder={label}
      value={v}
      onChange={(e) => {
        if (typeof v === 'string') {
          (atom as AtomMut<string>)(ctx, e.target.value);
        } else {
          (atom as AtomMut<number>)(ctx, Number(e.target.value));
        }
      }}
      required={required}
    />
  )
}, "CreateApiKeyField")
const CreateApiKeyForm = () => {
  return (
    <>
      <AfterCreateApiKeyDialog />
      <div className="flex flex-col gap-1 w-full">
        {fields.map((field) => <CreateApiKeyField key={field.label} {...field} />)}
      </div>
    </>
  )
}
const AfterCreateApiKeyDialogContent = reatomComponent(({ ctx }) => {
  const data = ctx.spy(apiKeysState.afterCreate.state);
  if (!data) return null;

  return (
    <div className="flex flex-col gap-6 h-full w-full">
      <div className="flex flex-col gap-2 w-full">
        <div className="flex flex-col w-full">
          <Typography className="text-base">
            API Key
          </Typography>
          <span className="text-sm font-normal text-neutral-400">
            {data.rawKey.slice(0, 20).replace(/\w{4}(?=\w)/g, "$&-") + "..."}
          </span>
        </div>
        <div className="flex flex-col w-full">
          <Typography className="text-base">
            Описание
          </Typography>
          <span className="text-sm font-normal text-neutral-400">
            {data.description}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 justify-between w-full">
        <Button
          background="default"
          variant="danger"
          className="text-sm font-semibold"
          withSpinner
          isLoading={ctx.spy(apiKeys.delete.statusesAtom).isPending}
          onClick={() => {
            spawn(ctx, (spawnCtx) => {
              apiKeys.delete(spawnCtx, data.id, (ctx) => {
                apiKeys.afterCreate.close(ctx)
              })
            })
          }}
        >
          Удалить
        </Button>
        <Copy
          as="button"
          onClick={() => navigator.clipboard.writeText(data.rawKey)}
        />
      </div>
    </div>
  )
}, "AfterCreateApiKeyDialogContent")

const AfterCreateApiKeyDialog = reatomComponent(({ ctx }) => {
  return (
    <Dialog.Root
      open={ctx.spy(apiKeysState.afterCreate.isOpen)}
      onOpenChange={({ open }) => apiKeys.afterCreate.handle(ctx, open)}
    >
      <Portal>
        <Dialog.Backdrop className={dialogVariant.backdrop()} />
        <Dialog.Positioner className={dialogVariant.positioner()}>
          <Dialog.Content className={dialogVariant.content("sm:max-w-[480px]")}>
            <AfterCreateApiKeyDialogContent />
            <DialogClose />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}, "AfterCreateApiKeyDialog")
const CreateApiKeySubmit = reatomComponent(({ ctx }) => {
  return (
    <ButtonXSubmit
      onClick={() => apiKeys.create(ctx)}
      disabled={ctx.spy(apiKeys.create.statusesAtom).isPending}
    />
  )
}, "CreateApiKeySubmit")

export const ApiKeys = reatomComponent(({ ctx }) => {
  useUpdate(apiKeys.fetch, [])

  if (ctx.spy(apiKeys.fetch.statusesAtom).isFirstPending) {
    return <Skeleton className="h-12 w-full" />
  }

  const error = ctx.spy(apiKeys.fetch.errorAtom)
  if (error) return <ErrorBlock title={error.message} />

  const data = ctx.spy(apiKeysState.data)
  if (!data) return null

  return (
    <div className="flex flex-col gap-1 w-full">
      {data.map((key) => (
        <div
          key={key.id}
          className="flex items-center justify-between gap-4 rounded-xl border border-neutral-800 p-2"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-neutral-100">
                {key.description || "API Key"}
              </p>
              <span
                className="
                  rounded-sm
                  border border-green-500/20
                  bg-green-500/10
                  px-2 py-0.5
                  text-xs text-green-400
                "
              >
                Активно
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-neutral-500">
              <code
                className="
                  rounded-sm
                  bg-neutral-800
                  px-1.5 py-0.5
                  font-mono text-xs
                  text-neutral-300
                "
              >
                {key.id}
              </code>
              <span>Создано: {dayjs(key.created_at).format("DD MMM YYYY HH:mm:ss")}</span>
              <span>Длительность: {dayjs.duration(key.duration, 'seconds').humanize(false)}</span>
            </div>
          </div>
          <div className="shrink-0">
            <DeleteButton onClick={() => apiKeys.delete(ctx, key.id)} />
          </div>
        </div>
      ))}
    </div>
  )
}, "ApiKeys")

export const apiKeysSection = createPrivatedSectionModel({
  event: "api",
  components: {
    header: {
      create: <CreateApiKeySubmit />,
      edit: null
    },
    content: {
      view: <ApiKeys />,
      create: <CreateApiKeyForm />,
      edit: null,
    }
  }
})
