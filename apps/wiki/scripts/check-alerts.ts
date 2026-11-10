import { resetAlertsForTests, sendAlert } from "@repo/shared/notify/alerts";

/**
 * Smoke check for the alert client; run with `bun scripts/check-alerts.ts`.
 * No unit test runner in this app (Playwright covers the e2e surface).
 */
function check(condition: unknown, message: string): void {
	if (!condition) throw new Error(`alerts check failed: ${message}`);
}

const calls: Array<{ url: string; init?: RequestInit }> = [];
const originalFetch = globalThis.fetch;

function setEnv(url?: string, key?: string) {
	if (url === undefined) delete process.env.ALERT_URL;
	else process.env.ALERT_URL = url;

	if (key === undefined) delete process.env.ALERT_KEY;
	else process.env.ALERT_KEY = key;
}

async function main() {
	setEnv();
	resetAlertsForTests();

	globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
		calls.push({ url: String(input), init });
		return new Response("", { status: 200 });
	}) as unknown as typeof fetch;

	check((await sendAlert({ from: "wiki", message: "no config" })) === false, "missing config must be a no-op");
	check(calls.length === 0, "missing config must not call fetch");

	setEnv("https://panel.example/internal/alerts", "key");
	check((await sendAlert({ from: "wiki", message: "boom" })) === true, "configured alert must be sent");
	check(calls.length === 1, "one request expected");

	const headers = calls[0].init?.headers as Record<string, string>;
	check(headers.authorization === "Bearer key", "bearer header");

	const body = JSON.parse(String(calls[0].init?.body));
	check(body.from === "wiki", "from");
	check(body.message === "boom", "message");
	check(body.severity === "critical", "default severity");

	check((await sendAlert({ from: "wiki", message: "boom" })) === false, "duplicate must be throttled");
	check(calls.length === 1, "throttled request must not call fetch");

	resetAlertsForTests();
	globalThis.fetch = (async () => new Response("nope", { status: 500 })) as unknown as typeof fetch;
	check((await sendAlert({ from: "wiki", message: "server error" })) === false, "5xx must fail");

	globalThis.fetch = (async () => {
		throw new Error("network");
	}) as unknown as typeof fetch;
	check((await sendAlert({ from: "wiki", message: "network error" })) === false, "network error must fail");

	globalThis.fetch = originalFetch;
	console.log("alerts smoke check: ok");
}

await main();
