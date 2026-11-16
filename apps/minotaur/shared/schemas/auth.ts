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

/** Login is permissive: legacy accounts may have shorter passwords than the register policy. */
export const authSchema = z.object({
	nickname: nicknameSchema,
	password: z.string().min(1, { error: () => translate["auth.validation.password-required"]() }).max(72),
});

export const registerSchema = z.object({
	nickname: nicknameSchema,
	password: passwordSchema,
	/** Optional "how did you hear about us?" answer; referrals use links only. */
	findout: z
		.string()
		.min(1, { error: () => translate["auth.validation.findout-required"]() })
		.max(128, { error: () => translate["auth.validation.findout-max"]() }),
});
