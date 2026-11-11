/**
 * Generates `sitemap.xml` and `robots.txt` for the landing build.
 *
 *   bun run seo            # after `vike build`
 *
 * URLs are canonical, so redirecting entries (`/info/privacy`, `/info/terms`,
 * `/info/contacts`, `/wiki`, `/discord`, `/telegram`) stay out of the sitemap.
 * `lastmod` comes from the last git commit that touched the page directory, so
 * the file only changes when the page actually changes.
 */
import { existsSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

type Route = {
  path: string
  /** Page directory used for the git `lastmod`. */
  page: string
  priority: string
  changefreq: "daily" | "weekly" | "monthly" | "yearly" | "hourly"
}

const BASE_URL = "https://fasberry.fun"

const ROUTES: Route[] = [
  { path: "/", page: "pages/index", priority: "1.0", changefreq: "daily" },
  { path: "/start", page: "pages/start", priority: "0.9", changefreq: "weekly" },
  { path: "/modpack", page: "pages/modpack", priority: "0.8", changefreq: "weekly" },
  { path: "/status", page: "pages/status", priority: "0.7", changefreq: "hourly" },
  { path: "/gallery", page: "pages/gallery", priority: "0.7", changefreq: "weekly" },
  { path: "/rules", page: "pages/rules", priority: "0.6", changefreq: "monthly" },
  { path: "/support", page: "pages/support", priority: "0.6", changefreq: "monthly" },
  { path: "/info/credits", page: "pages/info", priority: "0.3", changefreq: "yearly" },
]

const appRoot = resolve(import.meta.dir, "..")
const repoRoot = resolve(appRoot, "../..")
const stage = process.env["STAGE"] ?? "dev"
const isProd = stage === "prod"

/** Last commit date for a page directory, empty when git is unavailable. */
function lastModified(page: string): string {
  const result = Bun.spawnSync(
    ["git", "-C", repoRoot, "log", "-1", "--format=%cI", "--", `apps/taurus/${page}`],
    { stderr: "ignore" },
  )

  return result.success ? result.stdout.toString().trim() : ""
}

const urls = ROUTES.map((route) => {
  const lastmod = lastModified(route.page)
  const lines = [
    "  <url>",
    `    <loc>${BASE_URL}${route.path}</loc>`,
    ...(lastmod ? [`    <lastmod>${lastmod}</lastmod>`] : []),
    `    <changefreq>${route.changefreq}</changefreq>`,
    `    <priority>${route.priority}</priority>`,
    "  </url>",
  ]

  return lines.join("\n")
}).join("\n")

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`

const robots = isProd
  ? `User-agent: *
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml
`
  : `User-agent: *
Disallow: /
`

// The build output is the deploy artifact; `public/` keeps hand-maintained dev
// copies so a plain `vite dev` still serves something sensible.
const distClient = join(appRoot, "dist/client")
if (!existsSync(distClient)) {
  console.log(`[seo] skipped: ${distClient} does not exist, run after vike build`)
  process.exit(0)
}

writeFileSync(join(distClient, "sitemap.xml"), sitemap)
writeFileSync(join(distClient, "robots.txt"), robots)

console.log(`[seo] ${ROUTES.length} urls, stage=${stage}, robots=${isProd ? "allow" : "disallow"}`)
