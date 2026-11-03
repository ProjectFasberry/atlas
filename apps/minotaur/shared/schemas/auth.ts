// todo: use openapi-to-zod schema generation
import * as z from "zod";

export const nicknameSchema = z
	.string()
	.min(1, { error: "Поле обязательно для заполнения!" })
	.max(16, { error: "Ник не содержит больше 16 символов!" })
	.regex(/^[^\u0400-\u04FF]*$/, { error: "Ник содержит недопустимые символы" })
	.regex(/^\S*$/, {
		error: "Ник не должен содержать пробельные символы (пробелы, табы и т.д.)",
	});

export const passwordSchema = z
	.string()
	.min(8, { error: "Пароль должен содержать не менее 8 символов" })
	.max(72, { error: "Пароль не должен превышать 72 символа" })
	.regex(/^\S*$/, {
		error: "Пароль не должен содержать пробельные символы (пробелы, табы и т.д.)",
	});

export const referrerSchema = z.nullable(z.string());

/** Login is permissive: legacy accounts may have shorter passwords than the register policy. */
export const authSchema = z.object({
	nickname: nicknameSchema,
	password: z.string().min(1, { error: "Введите пароль" }).max(72),
});

export const registerSchema = z.object({
	nickname: nicknameSchema,
	password: passwordSchema,
	...z.object({
		findout: z.string().min(1).max(128),
		findoutType: z.enum(["custom", "referrer"]),
	}).superRefine((data, ctx) => {
		if (data.findoutType === "referrer") {
			const { error, success } = nicknameSchema.safeParse(data.findout);

			if (!success) {
				const msg = JSON.parse(error.message)[0];

				ctx.addIssue({
					path: ["findout"],
					code: "custom",
					message: msg.message,
				});
			}
		}
	}).shape,
});
