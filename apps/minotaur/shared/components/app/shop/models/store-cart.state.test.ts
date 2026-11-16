import { createCtx, type Ctx } from "@reatom/framework";
import { beforeEach, describe, expect, it } from "vitest";
import {
	cartDataIsEmptyAtom,
	cartDataItemIsSelectAtom,
	cartDataSelectedAtom,
	cartDataSelectedItemsLengthAtom,
	cartIsValidAtom,
	cartState,
	EMPTY_CART_PRICE,
	type CartItem,
} from "./store-cart.state";

const item = (id: number, overrides: Partial<CartItem> = {}) => ({
	id,
	title: `Item ${id}`,
	description: "",
	imageUrl: "",
	price: 10,
	currency: "BELKOIN",
	selected: true,
	recipient: "steve",
	...overrides,
}) as CartItem;

const seed = (ctx: Ctx, items: CartItem[]) => cartState.data(ctx, items);

beforeEach(() => {
	const ctx = createCtx();
	cartState.data(ctx, []);
	cartState.price(ctx, { ...EMPTY_CART_PRICE });
	cartState.server(ctx, undefined);
});

describe("cart selection", () => {
	it("derives the selected items and the count", () => {
		const ctx = createCtx();
		seed(ctx, [item(1), item(2, { selected: false }), item(3)]);

		expect(ctx.get(cartDataSelectedAtom).map((target) => target.id)).toEqual([1, 3]);
		expect(ctx.get(cartDataSelectedItemsLengthAtom)).toBe(2);
	});

	it("reports whether a single item is selected", () => {
		const ctx = createCtx();
		seed(ctx, [item(1), item(2, { selected: false })]);

		expect(ctx.get(cartDataItemIsSelectAtom(1))).toBe(true);
		expect(ctx.get(cartDataItemIsSelectAtom(2))).toBe(false);
		expect(ctx.get(cartDataItemIsSelectAtom(99))).toBe(false);
	});

	it("treats an empty list as empty", () => {
		const ctx = createCtx();
		expect(ctx.get(cartDataIsEmptyAtom)).toBe(true);

		seed(ctx, [item(1)]);
		expect(ctx.get(cartDataIsEmptyAtom)).toBe(false);
	});
});

describe("cartIsValidAtom", () => {
	it("requires at least one selected item", () => {
		const ctx = createCtx();
		expect(ctx.get(cartIsValidAtom)).toBe(false);

		seed(ctx, [item(1)]);
		expect(ctx.get(cartIsValidAtom)).toBe(true);
	});

	it("requires at least one selected item with a recipient", () => {
		const ctx = createCtx();
		seed(ctx, [item(1, { recipient: undefined }), item(2, { selected: false })]);

		expect(ctx.get(cartIsValidAtom)).toBe(false);

		seed(ctx, [item(1, { recipient: undefined }), item(2, { selected: true, recipient: "alex" })]);
		expect(ctx.get(cartIsValidAtom)).toBe(true);
	});
});
