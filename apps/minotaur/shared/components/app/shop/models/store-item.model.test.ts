import { atom, createCtx } from "@reatom/framework";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { addItem, removeItem } = vi.hoisted(() => ({
	addItem: vi.fn(),
	removeItem: vi.fn(),
}));

vi.mock("@/shared/lib/client-wrapper", () => ({
	client: { get: vi.fn(), raw: { get: vi.fn() }, post: vi.fn() },
}));

vi.mock("./store-cart.model", async () => {
	const { atom } = await import("@reatom/framework");

	return {
		cart: { addItem, removeItem, update: vi.fn() },
		cartState: { data: atom([]) },
	};
});

import { getItemStatus, relatedItems, storeItem } from "./store-item.model";
import { storeItems } from "./store.model";

beforeEach(() => {
	addItem.mockReset();
	removeItem.mockReset();
});

describe("storeItem.add", () => {
	it("adds an item that is not in the cart yet", () => {
		const ctx = createCtx();
		storeItems.simulate(ctx, 1, "unselect");

		storeItem.add(ctx, 1);

		expect(addItem.mock.calls[0]?.[1]).toBe(1);
		expect(removeItem).not.toHaveBeenCalled();
	});

	it("removes an item that is already selected", () => {
		const ctx = createCtx();
		storeItems.simulate(ctx, 2, "select");

		storeItem.add(ctx, 2);

		expect(ctx.get(getItemStatus(2))?.isSelected).toBe(true);
		expect(removeItem.mock.calls[0]?.[1]).toBe(2);
		expect(addItem).not.toHaveBeenCalled();
	});
});

describe("relatedItems", () => {
	it("drops the current item and keeps four suggestions", async () => {
		const { client } = await import("@/shared/lib/client-wrapper");
		vi.mocked(client.get).mockResolvedValue({
			data: [
				{ id: 1, title: "self" },
				{ id: 2, title: "a" },
				{ id: 3, title: "b" },
				{ id: 4, title: "c" },
				{ id: 5, title: "d" },
				{ id: 6, title: "e" },
			],
			meta: { hasNextPage: false, hasPrevPage: false },
		} as never);

		const ctx = createCtx();

		await relatedItems.fetch(ctx, { category: "donate", wallet: "BELKOIN", excludeId: 1 });

		expect(client.get).toHaveBeenCalledWith("/store/items", expect.objectContaining({
			params: { query: { category: "donate", wallet: "BELKOIN", searchQuery: undefined } },
		}));
		expect((ctx.get(relatedItems.fetch.dataAtom) ?? []).map((item) => item.id)).toEqual([2, 3, 4, 5]);
	});
});
