import { mainClient as mainOpenApiClient, panelClient as panelOpenApiClient } from "@/shared/api/client";

type FetchOptions = {
	method?: string;
	headers?: HeadersInit;
	json?: unknown;
	body?: BodyInit | null;
	signal?: AbortSignal | null;
	searchParams?: Record<string, unknown>;
	timeout?: number;
	retry?: number;
};

type FetchContext = { path: string; options?: FetchOptions };
type FetchPipe = (ctx: FetchContext) => FetchContext;

type ApiPipeline<T> = {
	pipe: (...fns: FetchPipe[]) => ApiPipeline<T>;
	exec: () => Promise<T>;
};

type ClientFetch = {
	<T = unknown>(path: string, options?: FetchOptions): ApiPipeline<T>;
} & {
	[K in "get" | "post" | "put" | "patch" | "delete"]: <T = unknown>(
		path: string,
		options?: FetchOptions
	) => ApiPipeline<T>;
};

type OpenApiResult = { data?: unknown; error?: unknown; response: Response };
type OpenApiClient = {
	GET: (path: string, init?: Record<string, unknown>) => Promise<OpenApiResult>;
	POST: (path: string, init?: Record<string, unknown>) => Promise<OpenApiResult>;
	PUT: (path: string, init?: Record<string, unknown>) => Promise<OpenApiResult>;
	PATCH: (path: string, init?: Record<string, unknown>) => Promise<OpenApiResult>;
	DELETE: (path: string, init?: Record<string, unknown>) => Promise<OpenApiResult>;
};

const isErrorRes = (v: unknown): v is { error: string } =>
	typeof v === "object" && v !== null && "error" in v && typeof (v as { error: string }).error === "string";

function unwrapData<T>(value: unknown): T {
	if (isErrorRes(value)) throw new Error(value.error);
	if (value && typeof value === "object" && "data" in value) return (value as { data: T }).data;
	throw new Error("Malformed response");
}

export async function parseWrappedJson<T>(res: Response): Promise<T> {
	return unwrapData<T>(await res.json());
}

function errorMessage(value: unknown, response: Response) {
	const error = (value as { error?: unknown } | null)?.error;
	if (typeof error === "string") return error;

	if (error && typeof error === "object" && "type" in error && error.type === "validation") {
		const count = Array.isArray((error as unknown as { errors?: unknown[] }).errors)
			? (error as unknown as { errors: unknown[] }).errors.length
			: 0;
		return `Validation error with ${count} errors`;
	}

	return response.statusText || `HTTP ${response.status}`;
}

function appendSearchParams(path: string, params?: Record<string, unknown>) {
	const entries = Object.entries(params ?? {}).filter(([, value]) => value !== undefined && value !== null);
	if (entries.length === 0) return path;

	const query = new URLSearchParams();
	for (const [key, value] of entries) query.append(key, String(value));

	return `${path}${path.includes("?") ? "&" : "?"}${query.toString()}`;
}

const createPipeline = <T>(
	client: OpenApiClient,
	path: string,
	options: FetchOptions = {},
	pipes: FetchPipe[] = []
): ApiPipeline<T> => ({
	pipe: (...fns) => createPipeline(client, path, options, [...pipes, ...fns]),
	exec: async () => {
		const ctx = pipes.reduce<FetchContext>((acc, fn) => fn(acc), { path, options });
		const method = (ctx.options?.method ?? "GET").toUpperCase();
		const requestPath = appendSearchParams(
			ctx.path.startsWith("/") ? ctx.path : `/${ctx.path}`,
			ctx.options?.searchParams
		);

		const headers = new Headers(ctx.options?.headers);
		if (ctx.options?.timeout) headers.set("x-request-timeout", String(ctx.options.timeout));

		const attempts = Math.max(0, Number(ctx.options?.retry ?? 0)) + 1;
		const request = (client as unknown as Record<string, (path: string, init?: Record<string, unknown>) => Promise<OpenApiResult>>)[method];
		if (!request) throw new Error(`Unsupported method ${method}`);

		for (let attempt = 1; attempt <= attempts; attempt += 1) {
			let result: OpenApiResult;

			try {
				result = await request.call(client, requestPath, {
					headers,
					body: ctx.options?.body ?? ctx.options?.json,
					signal: ctx.options?.signal,
				});
			} catch (error) {
				if (attempt < attempts) continue;
				throw error;
			}

			if (!result.response.ok) {
				if (attempt < attempts && result.response.status >= 500) continue;
				throw new Error(errorMessage(result.error, result.response));
			}

			return unwrapData<T>(result.data);
		}

		throw new Error("Request failed");
	},
});

export function createApiInstance(client: OpenApiClient): ClientFetch {
	const base = <T>(path: string, options?: FetchOptions) => createPipeline<T>(client, path, options);
	const methods = ["get", "post", "put", "patch", "delete"] as const;

	for (const method of methods) {
		(base as unknown as Record<string, unknown>)[method] = <T>(path: string, options?: FetchOptions) =>
			createPipeline<T>(client, path, { ...options, method: method.toUpperCase() });
	}

	return base as ClientFetch;
}

export const withHeaders = (headers: HeadersInit): FetchPipe => (ctx) => ({
	...ctx,
	options: { ...ctx.options, headers: { ...ctx.options?.headers, ...headers } },
});

export const withJsonBody = (body: unknown): FetchPipe => (ctx) => ({
	...ctx,
	options: {
		...ctx.options,
		json: body,
		headers: { ...ctx.options?.headers, "Content-Type": "application/json" },
	},
});

export const withQueryParams = (params: Record<string, unknown>): FetchPipe => (ctx) => ({
	...ctx,
	path: appendSearchParams(ctx.path, params),
});

export const panelClient = createApiInstance(panelOpenApiClient as unknown as OpenApiClient);
export const client = createApiInstance(mainOpenApiClient as unknown as OpenApiClient);
