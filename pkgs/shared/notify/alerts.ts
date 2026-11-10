/**
 * Server-only alerting shared by the apps. Sends to glaux `/internal/alerts`,
 * which fans out to Gotify and Telegram. Never throws: an alert failure must not
 * take the app down.
 */
const THROTTLE_WINDOW_MS = 5 * 60_000;
const MAX_TRACKED = 200;

const sentAt = new Map<string, number>();

export type AlertSeverity = "info" | "warning" | "critical";

export type AlertOptions = {
	/** Service name, sent as `from` and used in the default title. */
	from: string;
	message: string;
	severity?: AlertSeverity;
	title?: string;
};

export function messageOf(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

function readConfig(): { url: string; key: string } | null {
	const url = process.env.ALERT_URL;
	const key = process.env.ALERT_KEY;

	return url && key ? { url, key } : null;
}

function isThrottled(key: string): boolean {
	const now = Date.now();

	for (const [tracked, at] of sentAt) {
		if (now - at >= THROTTLE_WINDOW_MS) sentAt.delete(tracked);
	}

	const last = sentAt.get(key);
	if (last !== undefined && now - last < THROTTLE_WINDOW_MS) return true;

	if (sentAt.size >= MAX_TRACKED) {
		const oldest = sentAt.keys().next();
		if (!oldest.done) sentAt.delete(oldest.value);
	}

	sentAt.set(key, now);
	return false;
}

export async function sendAlert({ from, message, severity = "critical", title }: AlertOptions): Promise<boolean> {
	const config = readConfig();
	if (!config) {
		console.warn("alerts: ALERT_URL/ALERT_KEY are not set");
		return false;
	}

	const key = `${from}:${severity}:${message.slice(0, 160)}`;
	if (isThrottled(key)) return false;

	try {
		const response = await fetch(config.url, {
			method: "POST",
			headers: {
				"content-type": "application/json",
				authorization: `Bearer ${config.key}`,
			},
			body: JSON.stringify({ from, message, title, severity }),
			signal: AbortSignal.timeout(2_000),
		});

		if (!response.ok) {
			console.error(`alerts: ${response.status} ${await response.text()}`);
			return false;
		}

		return true;
	} catch (error) {
		console.error(`alerts: ${messageOf(error)}`);
		return false;
	}
}

/**
 * Process-level alerts. Only in production: in dev the default crash behaviour
 * is more useful, and there are no alert secrets.
 */
export function installProcessHandlers(from: string): void {
	if (process.env.NODE_ENV !== "production") return;

	const flag = "__repoAlertsInstalled";
	if ((globalThis as Record<string, unknown>)[flag]) return;
	(globalThis as Record<string, unknown>)[flag] = true;

	process.on("uncaughtException", (error) => {
		console.error("uncaughtException", error);
		void sendAlert({ from, message: `uncaughtException: ${messageOf(error)}` })
			.finally(() => process.exit(1));
	});

	process.on("unhandledRejection", (error) => {
		console.error("unhandledRejection", error);
		void sendAlert({ from, message: `unhandledRejection: ${messageOf(error)}`, severity: "warning" });
	});
}

export function resetAlertsForTests(): void {
	sentAt.clear();
}
