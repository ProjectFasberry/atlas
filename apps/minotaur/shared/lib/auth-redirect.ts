/**
 * Keep the destination a player wanted before the auth redirect.
 *
 * `next` is a path only: absolute URLs are rejected so a crafted link cannot
 * turn the login page into an open redirect. `/auth` is rejected as well to
 * avoid a loop when the query is copied between auth screens.
 */
export function isSafeNextPath(value: string | null | undefined): value is string {
	if (!value) return false;
	if (!value.startsWith("/")) return false;
	if (value.startsWith("//")) return false;
	if (value === "/auth" || value.startsWith("/auth?")) return false;

	return true;
}

export function getNextPath(search: Record<string, string | undefined> | null | undefined): string | null {
	const value = search?.next;
	return isSafeNextPath(value) ? value : null;
}

export function buildAuthRedirect(pathname: string, searchOriginal: string | null | undefined): string {
	const next = `${pathname}${searchOriginal ?? ""}`;
	return `/auth?next=${encodeURIComponent(next)}`;
}

/** Full server navigation: Reatom data is rebuilt from the new page context. */
export function goAfterAuth(next: string | null) {
	window.location.replace(next ?? "/");
}
