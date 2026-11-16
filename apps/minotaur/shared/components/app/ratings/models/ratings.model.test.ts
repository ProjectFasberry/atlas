import { createCtx, type Ctx } from "@reatom/framework";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { get, rawGet } = vi.hoisted(() => ({ get: vi.fn(), rawGet: vi.fn() }));

vi.mock("@/shared/lib/client-wrapper", () => ({
	client: { get, raw: { get: rawGet } },
}));

import {
	fetchRatingList,
	fetchRatings,
	ratings,
	ratingsState,
} from "./ratings.model";

const row = (nickname: string, total: number) => ({ kind: "playtime", nickname, avatar: "", total }) as never;

const meta = (endCursor?: string) => ({
	hasNextPage: Boolean(endCursor),
	hasPrevPage: false,
	...(endCursor ? { endCursor } : {}),
});

const reset = (ctx: Ctx) => {
	ratingsState.data(ctx, null);
	ratingsState.meta(ctx, null);
	ratingsState.loaded(ctx, false);
	ratingsState.filters.by(ctx, "parkour");
	ratingsState.filters.server(ctx, "global");
	ratingsState.filters.asc(ctx, false);
	ratingsState.filters.endCursor.reset(ctx);
};

beforeEach(() => {
	get.mockReset();
	rawGet.mockReset();
	window.history.replaceState({}, "", "/ratings");
});

describe("fetch", () => {
	it("requests the selected category and stores the page", async () => {
		get.mockResolvedValue({ data: [row("steve", 10)], meta: meta("cursor-1") });
		const ctx = createCtx();
		reset(ctx);

		await ratings.fetch(ctx);

		expect(get).toHaveBeenCalledWith("/server/rating/{by}", expect.objectContaining({
			params: {
				path: { by: "parkour" },
				query: { asc: false, server: "global", endCursor: undefined, limit: 50 },
			},
		}));
		expect(ctx.get(ratingsState.data)).toEqual([row("steve", 10)]);
		expect(ctx.get(ratingsState.meta)?.endCursor).toBe("cursor-1");
		expect(ctx.get(ratingsState.loaded)).toBe(true);
	});

	it("appends the next page when a cursor is set", async () => {
		get.mockResolvedValue({ data: [row("alex", 5)], meta: meta() });
		const ctx = createCtx();
		reset(ctx);
		ratingsState.data(ctx, [row("steve", 10)] as never);
		ratingsState.loaded(ctx, true);
		ratingsState.filters.endCursor(ctx, "cursor-1");

		await ratings.fetch(ctx);

		expect(get).toHaveBeenCalledWith("/server/rating/{by}", expect.objectContaining({
			params: expect.objectContaining({
				query: expect.objectContaining({ endCursor: "cursor-1" }),
			}),
		}));
		expect(ctx.get(ratingsState.data)).toEqual([row("steve", 10), row("alex", 5)]);
	});

	it("keeps the current rows when the appended page is empty", async () => {
		get.mockResolvedValue({ data: [], meta: meta() });
		const ctx = createCtx();
		reset(ctx);
		ratingsState.data(ctx, [row("steve", 10)] as never);
		ratingsState.loaded(ctx, true);
		ratingsState.filters.endCursor(ctx, "cursor-1");

		await ratings.fetch(ctx);

		expect(ctx.get(ratingsState.data)).toEqual([row("steve", 10)]);
	});

	it("marks the list as loaded when the request fails", async () => {
		get.mockRejectedValue(new Error("network"));
		const ctx = createCtx();
		reset(ctx);

		await ratings.fetch(ctx).catch(() => undefined);

		expect(ctx.get(ratingsState.loaded)).toBe(true);
		expect(ctx.get(ratingsState.data)).toBeNull();
	});
});

describe("loadMore", () => {
	it("uses the cursor from the response meta", async () => {
		const ctx = createCtx();
		reset(ctx);
		ratingsState.meta(ctx, meta("cursor-1"));
		get.mockResolvedValue({ data: [row("alex", 5)], meta: meta() });

		ratings.loadMore(ctx);

		await vi.waitFor(() => expect(ctx.get(ratingsState.data)).toHaveLength(1));
		expect(ctx.get(ratingsState.filters.endCursor)).toBe("cursor-1");
	});
});

describe("applyFilters", () => {
	it("resets the cursor, updates the URL and fetches the new category", async () => {
		get.mockResolvedValue({ data: [row("steve", 10)], meta: meta() });
		const ctx = createCtx();
		reset(ctx);
		ratingsState.loaded(ctx, true);
		ratingsState.filters.endCursor(ctx, "cursor-1");

		ratings.applyFilters(ctx, { server: "bisquite", type: "playtime", asc: true });

		await vi.waitFor(() => expect(get).toHaveBeenCalled());
		expect(ctx.get(ratingsState.filters.by)).toBe("playtime");
		expect(ctx.get(ratingsState.filters.server)).toBe("bisquite");
		expect(ctx.get(ratingsState.filters.asc)).toBe(true);
		expect(ctx.get(ratingsState.filters.endCursor)).toBeUndefined();
		expect(get).toHaveBeenLastCalledWith("/server/rating/{by}", expect.objectContaining({
			params: expect.objectContaining({
				path: { by: "playtime" },
				query: expect.objectContaining({ asc: true, server: "bisquite", endCursor: undefined }),
			}),
		}));

		const url = new URL(window.location.href);
		expect(url.searchParams.get("server")).toBe("bisquite");
		expect(url.searchParams.get("type")).toBe("playtime");
		expect(url.searchParams.get("sort")).toBe("worst");
	});

	it("does nothing when the filters and the data are already current", async () => {
		const ctx = createCtx();
		reset(ctx);
		ratingsState.loaded(ctx, true);
		ratingsState.filters.by(ctx, "playtime");
		ratingsState.filters.server(ctx, "bisquite");

		ratings.applyFilters(ctx, { server: "bisquite", type: "playtime" });

		expect(get).not.toHaveBeenCalled();
	});

	it("still fetches when the same filters have no data yet", async () => {
		get.mockResolvedValue({ data: [], meta: meta() });
		const ctx = createCtx();
		reset(ctx);
		ratingsState.filters.by(ctx, "playtime");
		ratingsState.filters.server(ctx, "bisquite");

		ratings.applyFilters(ctx, { server: "bisquite", type: "playtime" });

		await vi.waitFor(() => expect(get).toHaveBeenCalled());
	});
});

describe("fetchRatings", () => {
	it("defaults the page size", async () => {
		get.mockResolvedValue({ data: [], meta: meta() });

		await fetchRatings("votes", { asc: false });

		expect(get).toHaveBeenCalledWith("/server/rating/{by}", expect.objectContaining({
			params: { path: { by: "votes" }, query: { asc: false, limit: 50 } },
		}));
	});
});

describe("fetchRatingList", () => {
	it("returns an empty list for a malformed response", async () => {
		rawGet.mockResolvedValue(null);

		expect(await fetchRatingList()).toEqual([]);
	});

	it("returns the category tree", async () => {
		const groups = [{ key: "global", title: "Global", childs: [] }];
		rawGet.mockResolvedValue(groups);

		expect(await fetchRatingList()).toEqual(groups);
	});
});
