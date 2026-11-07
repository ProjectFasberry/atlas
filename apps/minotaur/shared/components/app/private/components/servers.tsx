import { reatomComponent, useUpdate } from "@reatom/npm-react"
import { Button } from "@/shared/ui/button"
import { ErrorBlock } from "@/shared/ui/error-block"
import { PageLoader } from "@/shared/ui/page-loader"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { Typography } from "@/shared/ui/typography"
import { clsx } from "cnfast"
import { currentUserState } from "@/shared/models/current-user/index.model"
import { servers, type ServerPayload } from "../models/servers.model"

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
    servers.save(ctx, { id: server.id, patch: change, }).catch(() => undefined)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <Typography color="gray" className="text-sm">
          `available` блокирует вход до подключения: билет на сервер не выдаётся, reconnect-пасс не принимается.
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
                    onClick={() => patch(server, { excluded: !server.excluded })}
                  >
                    {server.excluded ? "Показать" : "Скрыть"}
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
