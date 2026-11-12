// todo: use openapi-to-zod schema generation
import * as z from "zod";
import { translate } from "@/shared/locales/helpers";

export const nicknameSchema = z
	.string()
	.min(1, { error: () => translate["auth.validation.nickname-required"]() })
	.max(16, { error: () => translate["auth.validation.nickname-max"]() })
	.regex(/^[^\u0400-\u04FF]*$/, { error: () => translate["auth.validation.nickname-cyrillic"]() })
	.regex(/^\S*$/, { error: () => translate["auth.validation.nickname-spaces"]() });

export const passwordSchema = z
	.string()
	.min(8, { error: () => translate["auth.validation.password-min"]() })
	.max(72, { error: () => translate["auth.validation.password-max"]() })
	.regex(/^\S*$/, { error: () => translate["auth.validation.password-spaces"]() });

export const referrerSchema = z.nullable(z.string());

/** Login is permissive: legacy accounts may have shorter passwords than the register policy. */
export const authSchema = z.object({
	nickname: nicknameSchema,
	password: z.string().min(1, { error: () => translate["auth.validation.password-required"]() }).max(72),
});

export const registerSchema = z.object({
	nickname: nicknameSchema,
	password: passwordSchema,
	...z.object({
		findout: z
			.string()
			.min(1, { error: () => translate["auth.validation.findout-required"]() })
			.max(128, { error: () => translate["auth.validation.findout-max"]() }),
		findoutType: z.enum(["custom", "referrer"]),
	}).superRefine((data, ctx) => {
		if (data.findoutType === "referrer") {
			const { success, error } = nicknameSchema.safeParse(data.findout);

			if (!success) {
				ctx.addIssue({
					path: ["findout"],
					code: "custom",
					message: error.issues[0]?.message ?? translate["auth.validation.nickname-cyrillic"](),
				});
			}
		}
	}).shape,
});
