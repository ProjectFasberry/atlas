import { afterEach, describe, expect, it } from "vitest";
import {
	DEFAULT_RATINGS_PREFERENCES,
	isSamePreferences,
	parsePreferencesSearch,
	resolvePreferences,
	syncPreferencesUrl,
} from "./preferences";
import { isRatingServer, isRatingType } from "./labels";
import { type RatingItem } from "./types";

const groups: RatingItem[] = [
	{ key: "global", title: "Global", childs: [{ title: "Parkour", value: "parkour" }, { title: "Belkoin", value: "belkoin" }] },
	{ key: "bisquite", title: "Bisquite", childs: [{ title: "Charism", value: "charism" }, { title: "Playtime", value: "playtime" }] },
];

afterEach(() => {
	window.history.replaceState({}, "", "/ratings");
});

describe("parsePreferencesSearch", () => {
	it("reads known filters and sort direction", () => {
		expect(parsePreferencesSearch({ server: "bisquite", type: "playtime", sort: "worst" })).toEqual({
			server: "bisquite",
			type: "playtime",
			asc: true,
		});
	});

	it("drops unknown categories and values", () => {
		expect(parsePreferencesSearch({ server: "", type: "money", sort: "random" })).toEqual({
			server: undefined,
			type: undefined,
			asc: undefined,
		});
	});
});

describe("resolvePreferences", () => {
	it("applies the query when it matches the category tree", () => {
		expect(resolvePreferences({ server: "bisquite", type: "playtime", asc: true }, groups)).toEqual({
			server: "bisquite",
			type: "playtime",
			asc: true,
		});
	});

	it("falls back to the first group and its first known type", () => {
		expect(resolvePreferences({}, groups)).toEqual({
			server: "global",
			type: "parkour",
			asc: DEFAULT_RATINGS_PREFERENCES.asc,
		});
	});

	it("moves an unknown server to the first group", () => {
		expect(resolvePreferences({ server: "muffin", type: "playtime" }, groups)).toEqual({
			server: "global",
			type: "parkour",
			asc: false,
		});
	});

	it("moves a type that the server does not have to its first child", () => {
		expect(resolvePreferences({ server: "bisquite", type: "parkour" }, groups)).toEqual({
			server: "bisquite",
			type: "charism",
			asc: false,
		});
	});

	it("falls back to the defaults without any groups", () => {
		expect(resolvePreferences({ server: "bisquite", type: "playtime" }, [])).toEqual(DEFAULT_RATINGS_PREFERENCES);
	});
});

describe("isSamePreferences", () => {
	it("compares every field", () => {
		const base = { server: "global", type: "parkour" as const, asc: false };

		expect(isSamePreferences(base, { ...base })).toBe(true);
		expect(isSamePreferences(base, { ...base, asc: true })).toBe(false);
		expect(isSamePreferences(base, { ...base, server: "bisquite" })).toBe(false);
		expect(isSamePreferences(base, { ...base, type: "belkoin" })).toBe(false);
	});
});

describe("syncPreferencesUrl", () => {
	it("replaces the query without adding a history entry", () => {
		window.history.replaceState({}, "", "/ratings?server=global&type=parkour&sort=best");
		const length = window.history.length;

		syncPreferencesUrl({ server: "bisquite", type: "playtime", asc: true });

		const url = new URL(window.location.href);
		expect(url.pathname).toBe("/ratings");
		expect(url.searchParams.get("server")).toBe("bisquite");
		expect(url.searchParams.get("type")).toBe("playtime");
		expect(url.searchParams.get("sort")).toBe("worst");
		expect(window.history.length).toBe(length);
	});
});

describe("type guards", () => {
	it("recognises rating categories and servers only", () => {
		expect(isRatingType("parkour")).toBe(true);
		expect(isRatingType("lands-members")).toBe(true);
		expect(isRatingType("money")).toBe(false);
		expect(isRatingType(undefined)).toBe(false);

		expect(isRatingServer("bisquite")).toBe(true);
		expect(isRatingServer("muffin")).toBe(true);
		expect(isRatingServer("lobby")).toBe(true);
		expect(isRatingServer(undefined)).toBe(false);
	});
});
