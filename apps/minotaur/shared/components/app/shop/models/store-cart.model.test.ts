import { createCtx, type Ctx } from "@reatom/framework";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { get, post, del } = vi.hoisted(() => ({
	get: vi.fn(),
	post: vi.fn(),
	del: vi.fn(),
}));

vi.mock("@/shared/lib/client-wrapper", () => ({
	client: { get, post, delete: del, raw: { get: vi.fn() } },
}));
vi.mock("vike/client/router", () => ({ navigate: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/shared/components/app/settings/models/settings-store.model", () => ({
	getRecipient: () => "steve",
}));

import { cart, cartState, EMPTY_CART_PRICE, type CartItem } from "./store-cart.model";

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

const price = (overrides: Partial<typeof EMPTY_CART_PRICE> = {}) => ({
	...EMPTY_CART_PRICE,
	server: "bisquite",
	available: true,
	purchasable: true,
	BELKOIN: 10,
	...overrides,
});

const reset = (ctx: Ctx) => {
	cartState.data(ctx, []);
	cartState.price(ctx, { ...EMPTY_CART_PRICE });
	cartState.server(ctx, undefined);
};

beforeEach(() => {
	get.mockReset();
	post.mockReset();
	del.mockReset();
});

describe("update", () => {
	it("loads the list and the price for the selected server", async () => {
		get.mockImplementation((path: string) => Promise.resolve(
			path === "/store/cart/price" ? price({ CHARISM: 5 }) : { data: [item(1)] },
		));
		const ctx = createCtx();
		reset(ctx);
		cartState.server(ctx, "bisquite");

		await cart.update(ctx);

		expect(get).toHaveBeenCalledWith("/store/cart/price", expect.objectContaining({
			params: { query: { server: "bisquite" } },
		}));
		expect(ctx.get(cartState.price).purchasable).toBe(true);
		expect(ctx.get(cartState.data)).toHaveLength(1);
	});
});

describe("setServer", () => {
	it("refetches the price for the new server", async () => {
		get.mockResolvedValue(price({ server: "muffin", BELKOIN: 3 }));
		const ctx = createCtx();
		reset(ctx);
		cartState.server(ctx, "bisquite");

		await cart.setServer(ctx, "muffin");

		expect(ctx.get(cartState.server)).toBe("muffin");
		expect(get).toHaveBeenCalledWith("/store/cart/price", expect.objectContaining({
			params: { query: { server: "muffin" } },
		}));
		expect(ctx.get(cartState.price).BELKOIN).toBe(3);
	});
});

describe("setAllSelected", () => {
	it("updates only the items whose state changes", async () => {
		const ctx = createCtx();
		reset(ctx);
		cartState.data(ctx, [item(1, { selected: true }), item(2, { selected: false }), item(3, { selected: false })]);
		post.mockResolvedValue({ ok: true });
		get.mockImplementation((path: string) => Promise.resolve(
			path === "/store/cart/price" ? price() : { data: [item(1), item(2), item(3)] },
		));

		await cart.setAllSelected(ctx, true);

		expect(post).toHaveBeenCalledTimes(2);
		expect(post).toHaveBeenCalledWith("/store/cart/edit/{id}", expect.objectContaining({
			json: { key: "selected", value: true },
			params: { path: { id: 2 } },
		}));
		expect(post).toHaveBeenCalledWith("/store/cart/edit/{id}", expect.objectContaining({
			params: { path: { id: 3 } },
		}));
	});
});

describe("clear", () => {
	it("removes every item and reloads the cart", async () => {
		const ctx = createCtx();
		reset(ctx);
		cartState.data(ctx, [item(1), item(2)]);
		del.mockResolvedValue({ ok: true });
		get.mockImplementation((path: string) => Promise.resolve(
			path === "/store/cart/price" ? price({ available: false, purchasable: false }) : { data: [] },
		));

		await cart.clear(ctx);

		expect(del).toHaveBeenCalledTimes(2);
		expect(del).toHaveBeenCalledWith("/store/cart/remove/{id}", { params: { path: { id: 1 } } });
		expect(del).toHaveBeenCalledWith("/store/cart/remove/{id}", { params: { path: { id: 2 } } });

		await vi.waitFor(() => expect(ctx.get(cartState.data)).toEqual([]));
	});
});

describe("restoreItem", () => {
	it("adds the removed item back with its recipient", async () => {
		const ctx = createCtx();
		reset(ctx);
		post.mockResolvedValue({ ok: true });
		get.mockImplementation((path: string) => Promise.resolve(
			path === "/store/cart/price" ? price() : { data: [item(1)] },
		));

		await cart.restoreItem(ctx, { id: 1, recipient: "alex" });

		expect(post).toHaveBeenCalledWith("/store/cart/add/{id}", {
			json: { recipient: "alex" },
			params: { path: { id: 1 } },
		});
	});
});

describe("suggestions", () => {
	it("excludes cart items and keeps four entries", async () => {
		const ctx = createCtx();
		reset(ctx);
		cartState.data(ctx, [item(1)]);
		get.mockResolvedValue({
			data: [item(1), item(2), item(3), item(4), item(5), item(6)],
			meta: { hasNextPage: false, hasPrevPage: false },
		});

		await cart.suggestions(ctx);

		expect(get).toHaveBeenCalledWith("/store/items", expect.objectContaining({
			params: { query: { category: "all", wallet: "ALL", searchQuery: undefined } },
		}));
		expect((ctx.get(cart.suggestions.dataAtom) ?? []).map((target) => target.id)).toEqual([2, 3, 4, 5]);
	});
});
