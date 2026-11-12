import { getCookieClient, parseCookie, setCookie } from "@/shared/lib/cookie-utils";
import { isRatingType, type RatingType } from "./labels";
import { type RatingItem, type RatingsPreferences } from "./types";

export const RATINGS_COOKIE_KEY = "ratings.preferences";
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60 * 1000;

export const DEFAULT_RATINGS_PREFERENCES: RatingsPreferences = {
	server: "global",
	type: "parkour",
	asc: false,
};

export function isSamePreferences(a: RatingsPreferences, b: RatingsPreferences): boolean {
	return a.server === b.server && a.type === b.type && a.asc === b.asc;
}

export function parsePreferences(raw: string | null | undefined): Partial<RatingsPreferences> {
	if (!raw) return {};

	try {
		const value = JSON.parse(raw) as Record<string, unknown>;
		const type = typeof value.type === "string" && isRatingType(value.type)
			? value.type
			: undefined;

		return {
			server: typeof value.server === "string" ? value.server : undefined,
			type,
			asc: typeof value.asc === "boolean" ? value.asc : undefined,
		};
	} catch {
		return {};
	}
}

/** Cookie is read on the server for SSR and from document on the client. */
export function readPreferencesCookie(headers?: Record<string, string> | null): Partial<RatingsPreferences> {
	let raw: string | null = null;

	if (headers?.cookie) {
		raw = parseCookie(headers.cookie)[RATINGS_COOKIE_KEY] ?? null;
	} else if (typeof document !== "undefined") {
		const value = getCookieClient(RATINGS_COOKIE_KEY);
		raw = value ? decodeURIComponent(value) : null;
	}

	return parsePreferences(raw);
}

export function parsePreferencesSearch(search: Record<string, string>): Partial<RatingsPreferences> {
	return {
		server: typeof search.server === "string" ? search.server : undefined,
		type: isRatingType(search.type) ? search.type : undefined,
		asc: search.sort === "worst" ? true : search.sort === "best" ? false : undefined,
	};
}

/** Query wins over the cookie; both are validated against the category tree. */
export function resolvePreferences(
	search: Partial<RatingsPreferences>,
	cookie: Partial<RatingsPreferences>,
	groups: RatingItem[],
): RatingsPreferences {
	const serverCandidates = [search.server, cookie.server].filter((value): value is string => !!value);
	const group = serverCandidates
		.map((server) => groups.find((item) => item.key === server))
		.find(Boolean) ?? groups[0];

	const typeCandidates = [search.type, cookie.type].filter(
		(value): value is RatingType => !!value && isRatingType(value)
	);

	const firstKnownType = group?.childs.find((child) => isRatingType(child.value))?.value as RatingType | undefined;
	const type = group
		? typeCandidates.find((candidate) => group.childs.some((child) => child.value === candidate))
			?? firstKnownType
			?? DEFAULT_RATINGS_PREFERENCES.type
		: typeCandidates[0] ?? DEFAULT_RATINGS_PREFERENCES.type;

	return {
		server: group?.key ?? serverCandidates[0] ?? DEFAULT_RATINGS_PREFERENCES.server,
		type,
		asc: search.asc ?? cookie.asc ?? DEFAULT_RATINGS_PREFERENCES.asc,
	};
}

export function writePreferencesCookie(preferences: RatingsPreferences) {
	if (typeof document === "undefined") return;

	setCookie(RATINGS_COOKIE_KEY, JSON.stringify(preferences), {
		maxAgeMs: COOKIE_MAX_AGE,
		path: "/",
	});
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

export function hasPreferencesQuery(search: Record<string, string>) {
	return "server" in search || "type" in search || "sort" in search;
}

/** A query that was present but invalid is rewritten to the resolved values. */
export function normalizePreferencesUrl(
	preferences: RatingsPreferences,
	search: Record<string, string>,
) {
	if (!hasPreferencesQuery(search)) return;

	const sort = search.sort === "worst" ? true : search.sort === "best" ? false : undefined;
	const isCanonical = search.server === preferences.server
		&& search.type === preferences.type
		&& sort === preferences.asc;

	if (!isCanonical) syncPreferencesUrl(preferences);
}
