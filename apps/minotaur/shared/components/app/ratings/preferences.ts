import { isRatingType, type RatingType } from "./labels";
import { type RatingItem, type RatingsPreferences } from "./types";

export const DEFAULT_RATINGS_PREFERENCES: RatingsPreferences = {
	server: "global",
	type: "parkour",
	asc: false,
};

export function isSamePreferences(a: RatingsPreferences, b: RatingsPreferences): boolean {
	return a.server === b.server && a.type === b.type && a.asc === b.asc;
}

export function parsePreferencesSearch(search: Record<string, string>): Partial<RatingsPreferences> {
	return {
		server: search.server || undefined,
		type: isRatingType(search.type) ? search.type : undefined,
		asc: search.sort === "worst" ? true : search.sort === "best" ? false : undefined,
	};
}

/** Query values are validated against the category tree from the API. */
export function resolvePreferences(
	search: Partial<RatingsPreferences>,
	groups: RatingItem[],
): RatingsPreferences {
	const group = groups.find((item) => item.key === search.server) ?? groups[0];

	const type = (search.type && group?.childs.some((child) => child.value === search.type))
		? search.type
		: group?.childs.find((child) => isRatingType(child.value))?.value as RatingType | undefined
			?? DEFAULT_RATINGS_PREFERENCES.type;

	return {
		server: group?.key ?? DEFAULT_RATINGS_PREFERENCES.server,
		type,
		asc: search.asc ?? DEFAULT_RATINGS_PREFERENCES.asc,
	};
}

/** Replace, not push: filters should not create a history entry per click. */
export function syncPreferencesUrl(preferences: RatingsPreferences) {
	if (typeof window === "undefined") return;

	const url = new URL(window.location.href);
	url.searchParams.set("server", preferences.server);
	url.searchParams.set("type", preferences.type);
	url.searchParams.set("sort", preferences.asc ? "worst" : "best");

	window.history.replaceState(window.history.state, "", url);
}
