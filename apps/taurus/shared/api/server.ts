/**
 * Headers for server-side API calls from the landing.
 *
 * Never relay the whole incoming set: the runtime sends `host` as is, so a
 * request to `api.fasberry.fun` would carry `Host: fasberry.fun`, the proxy
 * would route it to the landing vhost and the page would render without data.
 * That is exactly what happened in the Bun container while Node (which replaces
 * the host) looked fine. Only the session cookie means anything to the API.
 */
export function apiRequestHeaders(
	pageCtx: { headers?: Record<string, string> | null },
): Record<string, string> {
	const cookie = pageCtx.headers?.["cookie"];

	return cookie ? { cookie } : {};
}
