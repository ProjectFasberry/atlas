import ky, { type Options } from "ky";
import { env } from "../env";

const baseConfig: Options = {
	credentials: "include",
	timeout: 5000,
	headers: import.meta.env.DEV
		? { "x-forwarded-for": "127.0.0.1" }
		: {},
};

export const SKIP_HOOK_HEADER = "X-Skip-Error-Handling";

type TypeboxIssue = {
	type: string,
	on: string,
	property: string,
	essage: string,
	summary: string,
	expected: { data: unknown[] },
	found: { data: unknown[] },
	errors: unknown[]
}

const hooksConfig: Options = {
	hooks: {
		afterResponse: [
			async ({ response, request }) => {
				let skipHook = false;

				const reqHeaders = request.headers;

				if (reqHeaders) {
					if (reqHeaders.get(SKIP_HOOK_HEADER) === "true") {
						skipHook = true;
					}
				}

				if (skipHook) return;

				if (!response.ok) {
					// Read a clone: the response goes back to the caller and
					// `parseWrappedJson` reads it again. The original body must stay
					// intact, otherwise the browser throws "body used already".
					const text = await response.clone().text();
					const fallback = response.statusText || `HTTP ${response.status}`;
					let json: unknown = null;

					try {
						json = text ? JSON.parse(text) : null;
					} catch {
						json = null;
					}

					if (!json || typeof json !== 'object') throw new Error(fallback);

					const error = (json as { error?: unknown }).error;

					if (typeof error === 'object' && error !== null && "type" in error) {
						const issue = error as TypeboxIssue;

						if (issue.type === 'validation') {
							throw new Error(`Validation error with ${issue.errors.length} errors`);
						}
					}

					if (typeof error === 'string') throw new Error(error);

					// Unknown shape: still fail, so no caller sees a consumed body.
					throw new Error(fallback);
				}
			},
		],
	},
};

export const clientInstance = ky.create({
	...baseConfig,
	baseUrl: env.VITE_API_URL,
	...hooksConfig,
});

export const panelClientInstance = ky.create({
	...baseConfig,
	baseUrl: env.VITE_PANEL_API_URL,
	...hooksConfig,
});
