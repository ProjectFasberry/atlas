import FingerprintJS from "@fingerprintjs/fingerprintjs";

let cachedVisitorId: string | null = null;
let pendingVisitorId: Promise<string> | null = null;

/**
 * FingerprintJS is a heavy download and the id is stable for the session.
 * Load it once and reuse it for every QR generation.
 */
export async function getVisitorId(): Promise<string> {
	if (cachedVisitorId) return cachedVisitorId;

	if (!pendingVisitorId) {
		pendingVisitorId = (async () => {
			const fp = await FingerprintJS.load();
			const result = await fp.get();
			return result.visitorId;
		})().then((id) => {
			cachedVisitorId = id;
			return id;
		}).catch((error) => {
			pendingVisitorId = null;
			throw error;
		});
	}

	return pendingVisitorId;
}
