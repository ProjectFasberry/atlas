// todo: use openapi-to-zod schema generation
import * as z from "zod";
import { editorFieldSchema } from "./news";

export const STORE_TYPES = ["donate", "event"] as const;

export const STORE_COMMAND_PARENTS = ["lp", "sudo", "cmi", "p"] as const;

export const storeCommandSchema = z
	.string()
	.max(512)
	.superRefine((value, ctx) => {
		const [parent, ...rest] = value.trim().split(/\s+/);
		const commandValue = rest.join(" ").trim();

		if (!parent || !commandValue) {
			ctx.addIssue({
				code: "custom",
				message: "У команды должно быть значение",
			});
			return;
		}

		if (!(STORE_COMMAND_PARENTS as readonly string[]).includes(parent)) {
			ctx.addIssue({
				code: "custom",
				message: `Команда должна начинаться с ${STORE_COMMAND_PARENTS.join(", ")}`,
			});
		}
	});

export const nullableStoreCommandSchema = z
	.union([z.literal(""), storeCommandSchema])
	.nullable();

export const storeItemSchema = z.object({
	id: z.number(),
	title: z.string(),
	description: z.string().nullable(),
	imageUrl: z.string(),
	type: z.union([z.enum(STORE_TYPES), z.string()]),
	command: nullableStoreCommandSchema,
	refund_cmd: nullableStoreCommandSchema,
	value: z.string(),
	currency: z.string(),
	price: z.number(),
	content: editorFieldSchema,
});

export const paymentFiatMethodSchema = z.enum(["card", "sbp"]);
export const paymentTypeSchema = z.enum(["donate", "belkoin", "charism", "item", "event"]);
export const paymentStatusSchema = z.enum(["created", "received", "captured", "cancelled", "failed"]);
export const paymentValueSchema = z.union([z.number(), z.string()]);

export type PaymentDonateType = string;
export type PaymentResponseStatus = z.infer<typeof paymentStatusSchema>;
export type PaymentType = z.infer<typeof paymentTypeSchema>;
export type PaymentValueType = z.infer<typeof paymentValueSchema>;

export type PaymentMeta = {
	nickname: string;
	paymentType: PaymentType;
	paymentValue: PaymentDonateType | string | number;
};

export type CreateOrderSkippedItem = {
	id: number;
	title: string;
	recipient: string;
	reason: "PERMISSION_ALREADY_PRESENT";
};

export type CreateOrderRoutePayload = {
	purchase: {
		uniqueId: string;
	};
	payload: {
		price: {
			BELKOIN: number;
			CHARISM: number;
		};
	};
	/** Items that were already owned and therefore not charged. */
	skipped?: CreateOrderSkippedItem[];
};

export const GAME_CURRENCIES = ["CHARISM", "BELKOIN"] as const;
export type GameCurrency = (typeof GAME_CURRENCIES)[number];
