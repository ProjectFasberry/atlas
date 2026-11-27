/**
 * Headers for server-side API calls from the landing. Never relay the whole
 * incoming set: the runtime sends `host` as is and the proxy would route the
 * request to the landing vhost. Only the session cookie means anything here.
 */
export function apiRequestHeaders(
	pageCtx: { headers?: Record<string, string> | null },
): Record<string, string> {
	const cookie = pageCtx.headers?.["cookie"];

	return cookie ? { cookie } : {};
}
