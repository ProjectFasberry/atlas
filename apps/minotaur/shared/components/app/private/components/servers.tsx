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
import {
  patchOf, serverEditor, servers, type ServerPayload,
} from "../models/servers.model"

export const SERVERS_READ_PERMISSION = "servers.read"
export const SERVERS_UPDATE_PERMISSION = "servers.update"

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

const Field = (props: {
  label: string
  value: string
  onChange: (value: string) => void
}) => (
  <label className="flex flex-col gap-1 w-full">
    <span className="text-xs font-medium text-neutral-400">{props.label}</span>
    <Input value={props.value} onChange={(event) => props.onChange(event.target.value)} />
  </label>
)

const SelectField = (props: {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
}) => (
  <label className="flex flex-col gap-1 w-full">
    <span className="text-xs font-medium text-neutral-400">{props.label}</span>
    <select
      className="h-10 rounded-xl bg-neutral-800 px-4 text-sm text-neutral-100 outline-none focus:ring-2 focus:ring-green-500"
      value={props.value}
      onChange={(event) => props.onChange(event.target.value)}
    >
      {props.options.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>
  </label>
)

const ServerEditor = reatomComponent(({ ctx }) => {
  const server = ctx.spy(serverEditor.target)
  const form = ctx.spy(serverEditor.form)
  const saving = ctx.spy(servers.save.statusesAtom).isPending

  if (!server) return null

  const set = (key: Parameters<typeof serverEditor.set>[1]) =>
    (value: string) => serverEditor.set(ctx, key, value)

  const save = () => {
    servers.save(ctx, { id: server.id, patch: patchOf(form) })
      .then(() => serverEditor.close(ctx))
      .catch(() => undefined)
  }

  return (
    <Dialog.Root open onOpenChange={({ open }) => { if (!open) serverEditor.close(ctx) }}>
      <Portal>
        <Dialog.Backdrop className={dialogVariant.backdrop()} />
        <Dialog.Positioner>
          <Dialog.Content className={dialogVariant.content("items-start! justify-start! max-w-2xl max-h-[85vh] overflow-y-auto")}>
            <DialogClose />
            <Dialog.Title className={dialogVariant.title()}>Изменить сервер</Dialog.Title>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
              <Field label="Название" value={form.fullname} onChange={set("fullname")} />
              <Field label="Origin" value={server.origin} onChange={() => undefined} />
              <Field label="Описание" value={form.description} onChange={set("description")} />
              <Field label="Превью (URL)" value={form.thumbnail} onChange={set("thumbnail")} />
              <Field label="Версия Minecraft" value={form.client_version} onChange={set("client_version")} />
              <SelectField
                label="Загрузчик"
                value={form.loader}
                options={["fabric", "quilt", "neoforge", "forge", "vanilla"]}
                onChange={set("loader")}
              />
              <Field label="Версия загрузчика" value={form.loader_version} onChange={set("loader_version")} />
              <Field label="Java major" value={form.java_major} onChange={set("java_major")} />
              <Field label="Ресурс-пак" value={form.resource_pack} onChange={set("resource_pack")} />
              <SelectField
                label="Клиентский мод"
                value={form.client_mod}
                options={["required", "optional"]}
                onChange={set("client_mod")}
              />
            </div>

            <div className="flex justify-end gap-2 w-full">
              <Button background="default" className="h-9" onClick={() => serverEditor.close(ctx)}>
                Отмена
              </Button>
              <Button background="positive" className="h-9" disabled={saving} onClick={save}>
                Сохранить
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}, "ServerEditor")

export const Servers = reatomComponent(({ ctx }) => {
  useUpdate(servers.fetch, [])

  const status = ctx.spy(servers.fetch.statusesAtom)
  const error = ctx.spy(servers.fetch.errorAtom)
  const data = ctx.spy(servers.fetch.dataAtom)
  const saving = ctx.spy(servers.save.statusesAtom).isPending
  const canEdit = ctx.spy(currentUserState.perms).includes(SERVERS_UPDATE_PERMISSION)

  if (status.isFirstPending) return <PageLoader />
  if (error) return <ErrorBlock title={String(error)} />

  const patch = (server: ServerPayload, change: Parameters<typeof servers.save>[1]["patch"]) => {
    servers.save(ctx, { id: server.id, patch: change }).catch(() => undefined)
  }

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
          {(data ?? []).map((server) => (
            <TableRow key={server.id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-semibold">{server.fullname}</span>
                  <span className="text-xs text-neutral-500">{server.origin}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col text-sm">
                  <span>{server.client_version} · {server.loader} {server.loader_version ?? ""}</span>
                  <span className="text-xs text-neutral-500">Java {server.java_major} · {server.client_mod}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  <Flag active={server.available} label={server.available ? "доступен" : "закрыт"} />
                  {server.is_default ? <Flag active label="default" /> : null}
                  {server.excluded ? <Flag active={false} label="скрыт" /> : null}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-2">
                  <Button
                    background={server.available ? "default" : "positive"}
                    className="h-8 text-xs"
                    disabled={!canEdit || saving}
                    onClick={() => patch(server, { available: !server.available })}
                  >
                    {server.available ? "Закрыть вход" : "Открыть вход"}
                  </Button>
                  <Button
                    background="default"
                    className="h-8 text-xs"
                    disabled={!canEdit || saving}
                    onClick={() => serverEditor.open(ctx, server)}
                  >
                    Изменить
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ServerEditor />
    </div>
  )
}, "Servers")
