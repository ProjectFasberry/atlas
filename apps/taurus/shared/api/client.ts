import createClient from "openapi-fetch";
import type { paths as mainClientPaths } from "../types/gen";
import { env } from "../env";

const devProxy = import.meta.env.DEV && typeof window !== "undefined";

export const mainClient = createClient<mainClientPaths>({
  credentials: "include",
  baseUrl: devProxy ? "/api" : env.PUBLIC_ENV__API_URL,
});
