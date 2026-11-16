import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const fromRoot = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
	resolve: {
		alias: [
			// Paraglide is generated during the build and is absent in CI checkouts.
			{ find: /^@\/paraglide\/messages(\.js)?$/, replacement: fromRoot("./shared/test/paraglide-stub.ts") },
			{ find: /^@\/paraglide\/runtime$/, replacement: fromRoot("./shared/test/paraglide-runtime-stub.ts") },
			{ find: "@", replacement: fromRoot(".") },
		],
	},
	test: {
		environment: "jsdom",
		globals: true,
		include: ["shared/**/*.test.{ts,tsx}"],
	},
});
