import { getLocale } from "@/paraglide/runtime";

/**
 * `<html lang>` follows the request locale: the middleware keeps it in
 * AsyncLocalStorage on the server and in the cookie on the client.
 */
export default function lang() {
  return getLocale();
}
