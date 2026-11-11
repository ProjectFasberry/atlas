import type { PageContext } from "vike/types";
import { env } from "../env";

export const getUrl = (pageCtx: PageContext) => `${env.VITE_LANDING_ENDPOINT}${pageCtx.urlPathname}`
export const getStaticObject = (path: string, target: string) => `${env.VITE_VOLUME_URL}/static/${path}/${target}`

export type LauncherPlatform = "windows-x86_64" | "darwin-aarch64"

/**
 * Stable launcher links: the API resolves the current prod release itself, so the
 * landing never carries a channel, version or file name.
 */
export const getLauncherDownloadUrl = (platform: LauncherPlatform) =>
  `${env.PUBLIC_ENV__API_URL}/releases/download/${platform}`

/**
 * Title suffix. A title that already carries the brand stays as is, so the
 * landing page can lead with the keyword instead of repeating "Fasberry".
 */
export const wrapTitle = (title: string) =>
  /fasberry/i.test(title) ? title : `${title} - Fasberry`

export const isError = (e: Error | unknown): e is Error => e instanceof Error;
