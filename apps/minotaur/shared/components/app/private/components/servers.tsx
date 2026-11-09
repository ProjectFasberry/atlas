import { reatomComponent, useUpdate } from "@reatom/npm-react"
import { Dialog } from "@ark-ui/react/dialog"
import { Portal } from "@ark-ui/react/portal"
import { clsx } from "cnfast"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { ErrorBlock } from "@/shared/ui/error-block"
import { PageLoader } from "@/shared/ui/page-loader"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { Typography } from "@/shared/ui/typography"
import { DialogClose, dialogVariant } from "@/shared/ui/dialog"
import { currentUserState } from "@/shared/models/current-user/index.model"
import { SERVERS_UPDATE_PERMISSION } from "@/shared/consts/permissions"
import { patchOf, serverEditor, servers, type ServerPayload } from "../models/servers.model"

const Flag = ({ active, label }: { active: boolean, label: string }) => (
  <span
    className={clsx(
      "rounded-lg px-2 py-0.5 text-[11px] font-semibold",
      active ? "bg-green-500/15 text-green-400" : "bg-neutral-800 text-neutral-500",
    )}
  >
    {label}
  </span>
)

const Field = ({ label, val, onChange }: { label: string, val: string, onChange: (val: string) => void }) => (
  <label className="flex flex-col gap-1 w-full">
    <span className="text-xs font-medium text-neutral-400">
      {label}
    </span>
    <Input value={val} onChange={(e) => onChange(e.target.value)} />
  </label>
)

const SelectField = ({ label, val, options, onChange }: {
  label: string, val: string, options: string[], onChange: (val: string) => void
}) => (
  <label className="flex flex-col gap-1 w-full">
    <span className="text-xs font-medium text-neutral-400">
      {label}
    </span>
    <select
      className="h-10 rounded-xl bg-neutral-800 px-4 text-sm text-neutral-100 outline-none focus:ring-2 focus:ring-green-500"
      value={val}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  </label>
)

const LOADERS = ["fabric", "quilt", "neoforge", "forge", "vanilla"];

const ServerEditorFields = reatomComponent(({ ctx }) => {
  const server = ctx.spy(serverEditor.target)
  if (!server) return null;

  const form = ctx.spy(serverEditor.form)

  const handleSet = (key: Parameters<typeof serverEditor.set>[1]) =>
    (val: string) => serverEditor.set(ctx, key, val)

  const handleSave = async () => {
    await servers.save(ctx, { id: server.id, patch: patchOf(form) })
  }

  const isSaving = ctx.spy(servers.save.statusesAtom).isPending

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
        <Field label="Название" val={form.fullname} onChange={handleSet("fullname")} />
        <Field label="Origin" val={server.origin} onChange={() => undefined} />
        <Field label="Описание" val={form.description} onChange={handleSet("description")} />
        <Field label="Превью (URL)" val={form.thumbnail} onChange={handleSet("thumbnail")} />
        <Field label="Версия Minecraft" val={form.client_version} onChange={handleSet("client_version")} />
        <SelectField
          label="Загрузчик"
          val={form.loader}
          options={LOADERS}
          onChange={handleSet("loader")}
        />
        <Field label="Версия загрузчика" val={form.loader_version} onChange={handleSet("loader_version")} />
        <Field label="Java major" val={form.java_major} onChange={handleSet("java_major")} />
        <Field label="Ресурс-пак" val={form.resource_pack} onChange={handleSet("resource_pack")} />
        <SelectField
          label="Клиентский мод"
          val={form.client_mod}
          options={["required", "optional"]}
          onChange={handleSet("client_mod")}
        />
      </div>
      <div className="flex justify-end gap-2 w-full">
        <Dialog.CloseTrigger asChild>
          <Button background="default" className="h-9">
            Отмена
          </Button>
        </Dialog.CloseTrigger>
        <Dialog.CloseTrigger asChild>
          <Button
            background="positive"
            className="h-9"
            disabled={isSaving}
            onClick={handleSave}
          >
            Сохранить
          </Button>
        </Dialog.CloseTrigger>
      </div>
    </>
  )
}, "ServerEditorFields")

const ServersDialog = reatomComponent(({ ctx }) => {
  return (
    <Dialog.Root
      open={ctx.spy(serverEditor.isOpen)}
      onOpenChange={({ open }) => serverEditor.isOpen(ctx, open)}
    >
      <Portal>
        <Dialog.Backdrop className={dialogVariant.backdrop()} />
        <Dialog.Positioner className={dialogVariant.positioner()}>
          <Dialog.Content className={dialogVariant.content()}>
            <DialogClose />
            <Dialog.Title className={dialogVariant.title()}>
              Изменить сервер
            </Dialog.Title>
            <ServerEditorFields />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
})
export const Servers = reatomComponent(({ ctx }) => {
  useUpdate(servers.fetch, [])

  const status = ctx.spy(servers.fetch.statusesAtom)
  const data = ctx.spy(servers.fetch.dataAtom)
  const err = ctx.spy(servers.fetch.errorAtom)

  if (status.isFirstPending) return <PageLoader />
  if (err) return <ErrorBlock title={err.message} />

  const handlePatch = async (server: ServerPayload, change: Parameters<typeof servers.save>[1]["patch"]) => {
    await servers.save(ctx, { id: server.id, patch: change })
  }

  const isSaving = ctx.spy(servers.save.statusesAtom).isPending
  const canEdit = ctx.spy(currentUserState.perms).includes(SERVERS_UPDATE_PERMISSION)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <Typography color="gray" className="text-sm">
          available блокирует вход до подключения: билет на сервер не выдаётся, reconnect-пасс не принимается.
        </Typography>
        <Button
          background="default"
          className="h-8 text-sm"
          disabled={status.isPending}
          onClick={() => servers.fetch(ctx)}
        >
          Обновить
        </Button>
      </div>
      <ServersDialog />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Сервер</TableHead>
            <TableHead>Клиент</TableHead>
            <TableHead>Флаги</TableHead>
            <TableHead>Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(data ?? []).map((s) => (
            <TableRow key={s.id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-semibold">{s.fullname}</span>
                  <span className="text-xs text-neutral-500">{s.origin}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col text-sm">
                  <span>
                    {s.client_version} · {s.loader} {s.loader_version ?? ""}
                  </span>
                  <span className="text-xs text-neutral-500">
                    Java {s.java_major} · {s.client_mod}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  <Flag
                    active={s.available}
                    label={s.available ? "доступен" : "закрыт"}
                  />
                  {s.is_default && <Flag active label="default" />}
                  {s.excluded && <Flag active={false} label="скрыт" />}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-2">
                  <Button
                    background={s.available ? "default" : "positive"}
                    className="h-8 text-xs"
                    disabled={!canEdit || isSaving}
                    onClick={() => handlePatch(s, { available: !s.available })}
                  >
                    {s.available ? "Закрыть вход" : "Открыть вход"}
                  </Button>
                  <Button
                    background="default"
                    className="h-8 text-xs"
                    disabled={!canEdit || isSaving}
                    onClick={() => serverEditor.open(ctx, s)}
                  >
                    Изменить
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}, "Servers")
