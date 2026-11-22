import { createCtx } from "@reatom/framework";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/lib/client-wrapper", () => ({
	client: { get: vi.fn(), raw: { get: vi.fn() }, post: vi.fn() },
}));

import { relatedItems } from "./store-item.model";

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
