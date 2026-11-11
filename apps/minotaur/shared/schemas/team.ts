import * as z from "zod";

export const TEAM_ROLES = ["builder", "developer", "designer", "moderator", "content", "other"] as const
export type TeamRole = (typeof TEAM_ROLES)[number]

export const TEAM_STATUSES = ["new", "reviewed", "invited", "rejected"] as const
export type TeamStatus = (typeof TEAM_STATUSES)[number]

/** Mirrors the API schema: the panel compiles the same rules as the route. */
export const teamApplySchema = z.object({
  roles: z.array(z.enum(TEAM_ROLES)).min(1, "ROLES_REQUIRED"),
  about: z.string().trim().min(40, "ABOUT_TOO_SHORT").max(2000, "ABOUT_TOO_LONG"),
  telegram: z.string().trim().min(2, "TELEGRAM_REQUIRED").max(64, "TELEGRAM_TOO_LONG"),
  email: z.union([z.literal(""), z.string().email("EMAIL_INVALID")]).optional(),
  portfolio: z.string().trim().max(2000, "PORTFOLIO_TOO_LONG").optional(),
})

export type TeamApplyValues = z.infer<typeof teamApplySchema>
