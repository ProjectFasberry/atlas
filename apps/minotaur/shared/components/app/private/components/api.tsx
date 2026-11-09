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
import { Noop } from "@/shared/ui/noop";
import { clsx } from "cnfast";

type Field = {
  label: string;
  atom: AtomMut<string> | AtomMut<number>;
  placeholder?: string;
  type?: "text" | "number";
  min?: number;
  hint?: string;
};

const fields: Field[] = [
  {
    label: "Описание",
    atom: apiKeysState.description,
    placeholder: "Например: CI deploy",
    type: "text",
  },
  {
    label: "Длительность, сек",
    atom: apiKeysState.duration,
    placeholder: "2592000",
    type: "number",
    min: 60,
    hint: "Минимум 60 секунд, 2592000 = 30 дней.",
  },
];

const CreateApiKeyField = reatomComponent<Field>(({ ctx, label, atom, placeholder, type = "text", min, hint }) => {
  const currentAtom = atom as AtomMut<string | number>;
  const value = ctx.spy(currentAtom);

  return (
    <label className="flex flex-col gap-1 w-full">
      <span className="text-xs text-neutral-400">{label}</span>
      <Input
        type={type}
        min={min}
        placeholder={placeholder}
        value={value}
        onChange={(event) => {
          if (typeof value === "string") {
            (currentAtom as AtomMut<string>)(ctx, event.target.value);
          } else {
            const next = event.target.value === "" ? 0 : Number(event.target.value);
            (currentAtom as AtomMut<number>)(ctx, Number.isFinite(next) ? next : 0);
          }
        }}
      />
      {hint && <span className="text-xs text-neutral-500">{hint}</span>}
    </label>
  );
}, "CreateApiKeyField");

const CreateApiKeyForm = () => {
  return (
    <>
      <AfterCreateApiKeyDialog />
      <div className="flex flex-col gap-3 w-full">
        {fields.map((field) => <CreateApiKeyField key={field.label} {...field} />)}
      </div>
    </>
  );
};

const AfterCreateApiKeyDialogContent = reatomComponent(({ ctx }) => {
  const data = ctx.spy(apiKeysState.afterCreate.state);
  if (!data) return null;

  return (
    <div className="flex flex-col gap-6 h-full w-full">
      <div className="flex flex-col gap-2 w-full">
        <div className="flex flex-col w-full gap-1">
          <Typography className="text-base">API Key</Typography>
          <code className="break-all rounded-lg bg-neutral-800 p-3 font-mono text-xs text-neutral-200">
            {data.rawKey}
          </code>
          <span className="text-xs text-amber-400">
            Скопируй ключ сейчас: после закрытия окна он больше не показывается.
          </span>
        </div>
        <div className="flex flex-col w-full">
          <Typography className="text-base">Описание</Typography>
          <span className="text-sm font-normal text-neutral-400">
            {data.description || "Без описания"}
          </span>
        </div>
        <div className="flex flex-col w-full">
          <Typography className="text-base">Срок действия</Typography>
          <span className="text-sm font-normal text-neutral-400">
            {data.duration ? `${dayjs.duration(data.duration, "seconds").humanize(false)} (${data.duration} сек)` : "Бессрочно"}
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
  );
}, "AfterCreateApiKeyDialogContent");

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
  );
}, "AfterCreateApiKeyDialog");

const CreateApiKeySubmit = reatomComponent(({ ctx }) => {
  const duration = ctx.spy(apiKeysState.duration);
  const valid = Number.isFinite(duration) && duration >= 60;

  return (
    <ButtonXSubmit
      onClick={() => apiKeys.create(ctx)}
      disabled={ctx.spy(apiKeys.create.statusesAtom).isPending || !valid}
    />
  );
}, "CreateApiKeySubmit");

const expiryState = (key: { created_at: string; duration: number | null }) => {
  if (key.duration == null) {
    return { label: "Бессрочно", className: "border-neutral-600/30 bg-neutral-600/10 text-neutral-300" };
  }

  const expires = dayjs(key.created_at).add(key.duration, "seconds");
  if (expires.isBefore(dayjs())) {
    return { label: "Истёк", className: "border-red/30 bg-red/10 text-red" };
  }

  return { label: "Активно", className: "border-green-500/20 bg-green-500/10 text-green-400" };
};

export const ApiKeys = reatomComponent(({ ctx }) => {
  useUpdate(apiKeys.fetch, []);

  if (ctx.spy(apiKeys.fetch.statusesAtom).isFirstPending) {
    return <Skeleton className="h-12 w-full" />
  }

  const error = ctx.spy(apiKeys.fetch.errorAtom)
  if (error) return <ErrorBlock title={error.message} />

  const data = ctx.spy(apiKeysState.data)
  if (!data) return <Skeleton className="h-12 w-full" />
  if (data.length === 0) return <Noop title="API-ключей пока нет" />

  return (
    <div className="flex flex-col gap-2 w-full">
      {data.map((key) => {
        const badge = expiryState(key);
        const created = dayjs(key.created_at);
        const expires = key.duration ? created.add(key.duration, "seconds") : null;

        return (
          <div
            key={key.id}
            className="flex items-center justify-between gap-4 rounded-xl border border-neutral-800 p-3"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-neutral-100">
                  {key.description || "API Key"}
                </p>
                <span className={clsx("rounded-sm border px-2 py-0.5 text-xs", badge.className)}>
                  {badge.label}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-500">
                <code className="rounded-sm bg-neutral-800 px-1.5 py-0.5 font-mono text-xs text-neutral-300">
                  #{key.id}
                </code>
                <span>Создано: {created.format("DD.MM.YYYY HH:mm")}</span>
                <span>
                  {expires ? `Действует до: ${expires.format("DD.MM.YYYY HH:mm")}` : "Без срока"}
                </span>
              </div>
            </div>
            <div className="shrink-0">
              <DeleteButton onClick={() => apiKeys.delete(ctx, key.id)} />
            </div>
          </div>
        );
      })}
    </div>
  );
}, "ApiKeys");

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
});
