import * as z from "zod";

export const TEAM_ROLES = ["builder", "developer", "designer", "moderator", "content", "other"] as const
export type TeamRole = (typeof TEAM_ROLES)[number]

export const TEAM_STATUSES = ["new", "reviewed", "invited", "rejected"] as const
export type TeamStatus = (typeof TEAM_STATUSES)[number]

/** Mirrors the API schema: the panel compiles the same rules as the route. */
export const TEAM_CONTACTS = ["telegram", "email"] as const
export type TeamContactType = (typeof TEAM_CONTACTS)[number]

export const teamContactSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("telegram"), value: z.string().trim().min(2, "TELEGRAM_REQUIRED").max(64, "TELEGRAM_TOO_LONG") }),
  z.object({ type: z.literal("email"), value: z.string().trim().email("EMAIL_INVALID").max(128, "EMAIL_TOO_LONG") }),
])

export const teamApplySchema = z.object({
  roles: z.array(z.enum(TEAM_ROLES)).min(1, "ROLES_REQUIRED"),
  about: z.string().trim().min(40, "ABOUT_TOO_SHORT").max(2000, "ABOUT_TOO_LONG"),
  contact: teamContactSchema,
  portfolio: z.string().trim().max(2000, "PORTFOLIO_TOO_LONG").optional(),
})

export type TeamApplyValues = z.infer<typeof teamApplySchema>
