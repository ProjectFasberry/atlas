import { client } from "@/shared/lib/client-wrapper"

/**
 * Anticheat flags: live in the API but not in the checked-in OpenAPI schema
 * yet, so the transport is typed locally until the next `pnpm openapi`.
 */
export type GrimFlag = {
  id: number
  uuid: string
  nickname: string
  check_name: string
  violations: number
  setback_vl: number
  server: string
  suppressed: number
  created_at: string
}

export type GrimSummaryRow = {
  check_name: string
  server: string
  total: number | string
}

export type GrimFlagQuery = {
  nickname?: string
  check?: string
  server?: string
  before?: string
  limit?: number
}

type UntypedGet = (path: string, init: { params?: { query?: Record<string, unknown> } }) => Promise<unknown>

export const listGrimFlags = async (query: GrimFlagQuery): Promise<GrimFlag[]> => {
  const result = await (client.get as unknown as UntypedGet)("/privated/anticheat/flags", {
    params: { query },
  })

  return (result ?? []) as GrimFlag[]
}

export const grimSummary = async (hours: number): Promise<GrimSummaryRow[]> => {
  const result = await (client.get as unknown as UntypedGet)("/privated/anticheat/summary", {
    params: { query: { hours } },
  })

  return (result ?? []) as GrimSummaryRow[]
}

export type GrimAction = "kick" | "ban" | "exempt"

export type GrimActionBody = {
  target: string
  action: GrimAction
  server?: string
  reason?: string
}

type UntypedPost = (path: string, init: { json: Record<string, unknown> }) => Promise<unknown>

export const runGrimAction = async (body: GrimActionBody): Promise<void> => {
  await (client.post as unknown as UntypedPost)("/privated/anticheat/action", { json: body })
}
