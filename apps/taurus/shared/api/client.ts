import createClient from "openapi-fetch";
import type { paths as mainClientPaths } from "../types/gen";
import { env } from "../env";

export const mainClient = createClient<mainClientPaths>({
  credentials: "include",
  baseUrl: env.PUBLIC_ENV__API_URL,
});
