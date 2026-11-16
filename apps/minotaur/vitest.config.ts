import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: [
			// Paraglide is generated during the build and is absent in CI checkouts.
			{
				find: /^@\/paraglide\/messages\.js$/,
				replacement: fileURLToPath(new URL("./shared/test/paraglide-stub.ts", import.meta.url)),
			},
			{ find: "@", replacement: fileURLToPath(new URL(".", import.meta.url)) },
		],
	},
	test: {
		environment: "jsdom",
		globals: true,
		include: ["shared/**/*.test.{ts,tsx}"],
	},
});
