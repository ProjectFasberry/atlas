import type { Client } from "openapi-fetch";
import type { paths as MainPaths } from "@/shared/types/gen/api/main.schema";
import type { paths as PanelPaths } from "@/shared/types/gen/api/panel.schema";
import {
  mainClient as mainOpenApiClient,
  panelClient as panelOpenApiClient,
} from "@/shared/api/client";

type Method = "get" | "post" | "put" | "patch" | "delete";

/** Paths whose item declares a required method key. */
type PathsWith<Paths, M extends Method> = {
  [P in keyof Paths]: Paths[P] extends Record<M, unknown> ? P : never;
}[keyof Paths];

type Operation<Paths, P extends keyof Paths, M extends Method> =
  Paths[P] extends Record<M, infer Op> ? Op : never;

type QueryOf<Op> = Op extends { parameters?: { query?: infer Query } } ? Query : never;
type PathOf<Op> = [Op extends { parameters?: { path?: infer Params } } ? Params : never] extends [null | undefined]
  ? never
  : Op extends { parameters?: { path?: infer Params } } ? Params : never;
type JsonOf<Op> = Op extends { requestBody: { content: { "application/json": infer Body } } } ? Body : never;
type SuccessOf<Op> = Op extends { responses: { 200: { content: { "application/json": infer Body } } } } ? Body : never;

/** Unwraps the `{ data }` envelope the API adds around every success body. */
type Payload<Body> = Body extends { data: infer Data } ? Data : Body;

type SharedOptions = {
  headers?: HeadersInit;
  signal?: AbortSignal | null;
  timeout?: number;
  retry?: number;
};

/** `params.path` is required exactly when the path declares `{placeholders}`. */
type ParamsOption<Op> = [PathOf<Op>] extends [never]
  ? { params?: { query?: QueryOf<Op> } }
  : { params: { path: PathOf<Op>; query?: QueryOf<Op> } };

type ReadOptions<Op> = SharedOptions & ParamsOption<Op>;
type WriteOptions<Op> = ReadOptions<Op> & {
  json?: JsonOf<Op>;
  /** Raw body escape hatch for FormData and other non-JSON payloads. */
  body?: BodyInit | null;
};

/** Escape hatch for operations missing from the OpenAPI contract. */
type RawApi = {
  get<T = unknown>(path: string, options?: RawOptions): Promise<T>;
  post<T = unknown>(path: string, options?: RawOptions): Promise<T>;
  put<T = unknown>(path: string, options?: RawOptions): Promise<T>;
  patch<T = unknown>(path: string, options?: RawOptions): Promise<T>;
  delete<T = unknown>(path: string, options?: RawOptions): Promise<T>;
};

type TypedApi<Paths> = {
  get<P extends PathsWith<Paths, "get">>(
    path: P,
    options?: ReadOptions<Operation<Paths, P, "get">>,
  ): Promise<Payload<SuccessOf<Operation<Paths, P, "get">>>>;
  post<P extends PathsWith<Paths, "post">>(
    path: P,
    options?: WriteOptions<Operation<Paths, P, "post">>,
  ): Promise<Payload<SuccessOf<Operation<Paths, P, "post">>>>;
  put<P extends PathsWith<Paths, "put">>(
    path: P,
    options?: WriteOptions<Operation<Paths, P, "put">>,
  ): Promise<Payload<SuccessOf<Operation<Paths, P, "put">>>>;
  patch<P extends PathsWith<Paths, "patch">>(
    path: P,
    options?: WriteOptions<Operation<Paths, P, "patch">>,
  ): Promise<Payload<SuccessOf<Operation<Paths, P, "patch">>>>;
  delete<P extends PathsWith<Paths, "delete">>(
    path: P,
    options?: WriteOptions<Operation<Paths, P, "delete">>,
  ): Promise<Payload<SuccessOf<Operation<Paths, P, "delete">>>>;
  raw: RawApi;
};

type RawOptions = {
  headers?: HeadersInit;
  signal?: AbortSignal | null;
  timeout?: number;
  retry?: number;
  json?: unknown;
  body?: BodyInit | null;
  params?: { query?: Record<string, unknown>; path?: Record<string, unknown> };
};

type ResponseEnvelope = { data?: unknown; error?: unknown; response: Response };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isAbortError = (value: unknown) =>
  isRecord(value) && value.name === "AbortError";

function unwrapData<T>(value: unknown): T {
  if (!isRecord(value)) throw new Error("Malformed response");
  if (typeof value.error === "string") throw new Error(value.error);
  if ("data" in value) return value.data as T;
  throw new Error("Malformed response");
}

function errorMessage(value: unknown, response: Response) {
  const error = isRecord(value) ? value.error : undefined;
  if (typeof error === "string") return error;

  return response.statusText || `HTTP ${response.status}`;
}

async function request<T>(
  client: Client<any>,
  method: Method,
  path: string,
  options: RawOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.timeout) headers.set("x-request-timeout", String(options.timeout));

  const init = {
    headers,
    body: options.body ?? options.json,
    signal: options.signal,
    params: options.params,
  };

  const retries = Math.max(0, options.retry ?? 0);

  for (let attempt = 0; ; attempt += 1) {
    let result: ResponseEnvelope;

    try {
      result = await client.request(method, path, init);
    } catch (error) {
      if (isAbortError(error) || attempt >= retries) throw error;
      continue;
    }

    if (result.response.ok) return unwrapData<T>(result.data);

    if (result.response.status >= 500 && attempt < retries) continue;

    throw new Error(errorMessage(result.error, result.response));
  }
}

/** Binds the runtime client to one schema; the single cast is confined here. */
function bind<Paths>(client: Client<any>): TypedApi<Paths> {
  const call = <T>(method: Method, path: string, options?: RawOptions) =>
    request<T>(client, method, path, options);

  return {
    get: (path: string, options?: RawOptions) => call("get", path, options),
    post: (path: string, options?: RawOptions) => call("post", path, options),
    put: (path: string, options?: RawOptions) => call("put", path, options),
    patch: (path: string, options?: RawOptions) => call("patch", path, options),
    delete: (path: string, options?: RawOptions) => call("delete", path, options),
    raw: {
      get: (path: string, options?: RawOptions) => call("get", path, options),
      post: (path: string, options?: RawOptions) => call("post", path, options),
      put: (path: string, options?: RawOptions) => call("put", path, options),
      patch: (path: string, options?: RawOptions) => call("patch", path, options),
      delete: (path: string, options?: RawOptions) => call("delete", path, options),
    },
  } as unknown as TypedApi<Paths>;
}

export const client = bind<MainPaths>(mainOpenApiClient);
export const panelClient = bind<PanelPaths>(panelOpenApiClient);
