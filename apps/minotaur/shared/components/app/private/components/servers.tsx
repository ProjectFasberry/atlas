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
import { alertDialog } from "@/shared/components/config/alert-dialog/alert-dialog.model"
import { currentUserState } from "@/shared/models/current-user/index.model"
import { SERVERS_UPDATE_PERMISSION } from "@/shared/consts/permissions"
import { clientVersions, createOf, patchOf, serverEditor, servers, type ServerPayload } from "../models/servers.model"
import { translate } from "@/shared/locales/helpers"
import { Link } from "@/shared/components/config/link/link"
import { DeleteButton } from "./ui"

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
  const mode = ctx.spy(serverEditor.mode)
  const server = ctx.spy(serverEditor.target)
  if (mode === "edit" && !server) return null;

  const form = ctx.spy(serverEditor.form)
  const versions = ctx.spy(clientVersions.fetch.dataAtom) ?? []
  // A server may predate the published list; keep its current version visible
  // instead of silently changing it on save.
  const versionOptions = form.client_version && !versions.includes(form.client_version)
    ? [form.client_version, ...versions]
    : versions
  const javaOptions = form.java_major && !["17", "21", "25"].includes(form.java_major)
    ? [form.java_major, "17", "21", "25"]
    : ["17", "21", "25"]

  const handleSet = (key: Parameters<typeof serverEditor.set>[1]) =>
    (val: string) => serverEditor.set(ctx, key, val)

  const handleSave = async () => {
    if (mode === "create") {
      const created = await servers.create(ctx, createOf(form))
      if (created) serverEditor.isOpen(ctx, false)
      return
    }

    if (!server) return

    const updated = await servers.save(ctx, { id: server.id, patch: patchOf(form) })
    if (updated) serverEditor.isOpen(ctx, false)
  }

  const isSaving = ctx.spy(servers.save.statusesAtom).isPending
    || ctx.spy(servers.create.statusesAtom).isPending
  const error = ctx.spy(servers.create.errorAtom) ?? ctx.spy(servers.save.errorAtom)

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
        <Field label={translate["panel.title-2"]()} val={form.fullname} onChange={handleSet("fullname")} />
        <Field
          label="Origin"
          val={mode === "create" ? form.origin : (server?.origin ?? "")}
          onChange={mode === "create" ? handleSet("origin") : () => undefined}
        />
        <Field label={translate["panel.description"]()} val={form.description} onChange={handleSet("description")} />
        <Field label={translate["panel.preview-url"]()} val={form.thumbnail} onChange={handleSet("thumbnail")} />
        <SelectField
          label={translate["panel.minecraft-version"]()}
          val={form.client_version}
          options={versionOptions.length > 0 ? versionOptions : [form.client_version]}
          onChange={handleSet("client_version")}
        />
        <SelectField
          label={translate["panel.loader"]()}
          val={form.loader}
          options={LOADERS}
          onChange={handleSet("loader")}
        />
        <Field label={translate["panel.loader-version"]()} val={form.loader_version} onChange={handleSet("loader_version")} />
        <SelectField
          label="Java major"
          val={form.java_major}
          options={javaOptions}
          onChange={handleSet("java_major")}
        />
        <Field label={translate["panel.resource-pack"]()} val={form.resource_pack} onChange={handleSet("resource_pack")} />
        <SelectField
          label={translate["panel.client-mod"]()}
          val={form.client_mod}
          options={["required", "optional"]}
          onChange={handleSet("client_mod")}
        />
      </div>
      {error && (
        <span className="text-xs text-red-400">
          {error.message}
        </span>
      )}
      <div className="flex justify-end gap-2 w-full">
        <Button background="default" className="h-9" onClick={() => serverEditor.isOpen(ctx, false)}>
          {translate["panel.cancel"]()}</Button>
        <Button
          background="positive"
          className="h-9"
          disabled={isSaving}
          onClick={handleSave}
        >
          {translate["panel.save"]()}</Button>
      </div>
    </>
  )
}, "ServerEditorFields")

const ServersDialog = reatomComponent(({ ctx }) => {
  const mode = ctx.spy(serverEditor.mode)

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
              {mode === "create" ? translate["panel.new-server"]() : translate["panel.edit-the-server"]()}</Dialog.Title>
            <ServerEditorFields />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
})
export const Servers = reatomComponent(({ ctx }) => {
  useUpdate(servers.fetch, [])
  useUpdate(clientVersions.fetch, [])

  const status = ctx.spy(servers.fetch.statusesAtom)
  const data = ctx.spy(servers.fetch.dataAtom)
  const err = ctx.spy(servers.fetch.errorAtom)

  if (status.isFirstPending) return <PageLoader />
  if (err) return <ErrorBlock title={err.message} />

  const handlePatch = async (server: ServerPayload, change: Parameters<typeof servers.save>[1]["patch"]) => {
    await servers.save(ctx, { id: server.id, patch: change })
  }

  const handleDelete = (server: ServerPayload) => {
    alertDialog.open(ctx, {
      title: translate["panel.delete-server"](),
      description: server.fullname,
      onConfirm: () => servers.remove(ctx, server.id),
      // A deleted default promotes another server, so refresh the flags.
      onClose: () => servers.fetch(ctx),
      errorAtom: servers.remove.errorAtom,
    })
  }

  const isSaving = ctx.spy(servers.save.statusesAtom).isPending
  const canEdit = ctx.spy(currentUserState.perms).includes(SERVERS_UPDATE_PERMISSION)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <Typography color="gray" className="text-sm">
          {translate["panel.servers-flags-hint"]()}</Typography>
        <div className="flex items-center gap-2">
          <Link
            href="/private/site"
            className="flex h-8 items-center rounded-xl bg-neutral-800 px-3 text-sm
              text-neutral-50 duration-150 hover:bg-neutral-700"
          >
            {translate["panel.servers-content"]()}</Link>
          <Button
            background="positive"
            className="h-8 text-sm"
            disabled={!canEdit || status.isPending}
            onClick={() => serverEditor.openCreate(ctx)}
          >
            {translate["panel.add-server"]()}</Button>
          <Button
            background="default"
            className="h-8 text-sm"
            disabled={status.isPending}
            onClick={() => servers.fetch(ctx)}
          >
            {translate["panel.refresh"]()}</Button>
        </div>
      </div>
      <ServersDialog />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{translate["panel.server"]()}</TableHead>
            <TableHead>{translate["panel.client"]()}</TableHead>
            <TableHead>{translate["panel.flags"]()}</TableHead>
            <TableHead>{translate["panel.actions"]()}</TableHead>
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
                    label={s.available ? translate["panel.available"]() : translate["panel.closed"]()}
                  />
                  {s.is_default && <Flag active label="default" />}
                  <Flag
                    active={!s.excluded}
                    label={s.excluded
                      ? translate["panel.hidden-from-lists"]()
                      : translate["panel.visible-in-lists"]()}
                  />
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
                    {s.available ? translate["panel.close-for-play"]() : translate["panel.open-for-play"]()}
                  </Button>
                  <Button
                    background="default"
                    className="h-8 text-xs"
                    disabled={!canEdit || isSaving}
                    onClick={() => handlePatch(s, { excluded: !s.excluded })}
                  >
                    {s.excluded
                      ? translate["panel.show-in-lists"]()
                      : translate["panel.hide-from-lists"]()}</Button>
                  <Button
                    background="default"
                    className="h-8 text-xs"
                    disabled={!canEdit || isSaving}
                    onClick={() => serverEditor.open(ctx, s)}
                  >
                    {translate["panel.edit"]()}</Button>
                  <DeleteButton
                    className="h-8"
                    disabled={!canEdit || isSaving}
                    onClick={() => handleDelete(s)}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}, "Servers")
