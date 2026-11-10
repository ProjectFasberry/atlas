/**
 * Next.js server instrumentation. Register process handlers once per node
 * server instance and report server errors from the App Router.
 */
export async function register(): Promise<void> {
	if (process.env.NEXT_RUNTIME !== "nodejs") return;
	if (process.env.NEXT_PHASE === "phase-production-build") return;

	const { installProcessHandlers } = await import("@repo/shared/notify/alerts");
	installProcessHandlers("wiki");
}

type RequestInfo = {
	path: string;
	method: string;
};

type ErrorContext = {
	routerKind?: string;
	routePath?: string;
	routeType?: string;
};

export async function onRequestError(
	error: unknown,
	request: RequestInfo,
	context: ErrorContext,
): Promise<void> {
	if (process.env.NEXT_RUNTIME !== "nodejs") return;

	const { messageOf, sendAlert } = await import("@repo/shared/notify/alerts");
	const route = [context.routeType, context.routePath].filter(Boolean).join(" ");

	await sendAlert({
		from: "wiki",
		severity: "warning",
		message: `http ${request.method} ${request.path}${route ? ` [${route}]` : ""}: ${messageOf(error)}`,
	});
}
