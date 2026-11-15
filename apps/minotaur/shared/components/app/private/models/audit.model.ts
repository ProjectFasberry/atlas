import { atom } from "@reatom/framework"
import { withSearchParamsPersist } from "@reatom/url"

export const AUDIT_TABS = [
  { value: "history", label: "История" },
] as const

export type AuditTab = (typeof AUDIT_TABS)[number]["value"]

const isAuditTab = (value: string): value is AuditTab =>
  AUDIT_TABS.some((tab) => tab.value === value)

/** `?tab=` keeps a deep link to one audit tab; unknown values fall back to history. */
export const auditTab = atom<AuditTab>("history", "auditTab").pipe(
  withSearchParamsPersist("tab", (value = "history") => (
    isAuditTab(value) ? value : "history"
  )),
)
