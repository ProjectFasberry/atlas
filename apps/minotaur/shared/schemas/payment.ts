// todo: use openapi-to-zod schema generation
import * as z from "zod";
import { editorFieldSchema } from "./news";
import { translate } from "@/shared/locales/helpers"

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
				message: translate["validation.command-value"](),
			});
			return;
		}

		if (!(STORE_COMMAND_PARENTS as readonly string[]).includes(parent)) {
			ctx.addIssue({
				code: "custom",
				message: translate["validation.command-starts"]({ parents: STORE_COMMAND_PARENTS.join(", ") }),
			});
		}
	});

export const nullableStoreCommandSchema = z
	.union([z.literal(""), storeCommandSchema])
	.nullable();

/** Prices are whole units of a game currency, never fractions or negatives. */
export const storePriceStringSchema = z
	.string()
	.trim()
	.regex(/^\d+$/, translate["validation.price"]());

export const storeItemSchema = z.object({
	id: z.number(),
	title: z.string().trim().min(1),
	description: z.string().nullable(),
	imageUrl: z.string(),
	type: z.union([z.enum(STORE_TYPES), z.string()]),
	command: nullableStoreCommandSchema,
	refund_cmd: nullableStoreCommandSchema,
	value: z.string().trim().min(1),
	currency: z.string(),
	price: z.number().int().nonnegative(),
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

export type OrderSingleGamePayload = {
	unique_id: string;
	initiator: string;
	created_at: Date;
	finished_at: Date | null;
	status: "pending" | "succeeded" | "refunded";
	price: Record<string, number>;
	items: {
		id: number;
		store_item_id: number;
		name: string;
		recipient: string;
		delivery_status?: string;
		revoked_at?: Date | null;
	}[];
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
