import createClient from "openapi-fetch";
import type { paths as MainPaths } from "@/shared/types/gen/api/main.schema";
import type { paths as PanelPaths } from "@/shared/types/gen/api/panel.schema";
import { env } from "../env";

const DEFAULT_TIMEOUT_MS = 5000;

/**
 * Shared transport for both clients: timeout, the dev proxy header and the
 * server-side Host header, while openapi-fetch keeps the typed paths.
 */
async function apiFetch(input: Request): Promise<Response> {
	const timeoutMs = Number(input.headers.get("x-request-timeout")) || DEFAULT_TIMEOUT_MS;
	input.headers.delete("x-request-timeout");

	if (import.meta.env.DEV && !input.headers.has("x-forwarded-for")) {
		input.headers.set("x-forwarded-for", "127.0.0.1");
	}

	if (typeof window === "undefined") {
		input.headers.delete("host");
	}

	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	const onAbort = () => controller.abort();

	if (input.signal.aborted) controller.abort();
	else input.signal.addEventListener("abort", onAbort);

	try {
		return await fetch(new Request(input, { signal: controller.signal }));
	} finally {
		clearTimeout(timer);
		input.signal.removeEventListener("abort", onAbort);
	}
}

export const mainClient = createClient<MainPaths>({
	baseUrl: env.VITE_API_URL,
	credentials: "include",
	fetch: apiFetch,
});

export const panelClient = createClient<PanelPaths>({
	baseUrl: env.VITE_PANEL_API_URL,
	credentials: "include",
	fetch: apiFetch,
});
