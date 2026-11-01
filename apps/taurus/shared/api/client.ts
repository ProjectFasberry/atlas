import createClient, { type ClientOptions } from "openapi-fetch";
import type { paths as mainClientPaths } from "../types/gen";
import { env } from "../env";

const baseOptions: ClientOptions = {
  credentials: "include"
}

export const mainClient = createClient<mainClientPaths>({
  ...baseOptions,
  baseUrl: env.PUBLIC_ENV__API_URL,
});
