#!/usr/bin/env node
/**
 * Generates the OpenAPI types for the main and panel APIs.
 *
 *   pnpm openapi:prod        # from the repo root
 *   pnpm openapi:dev         # against 127.0.0.1:4104/4105
 *   pnpm --filter @repo/shared openapi:prod
 *
 * Redocly does not expand ${VAR} in its config, so the template is rendered here
 * with values from .env.local (or the shell) into a temporary config. The file is
 * written next to the template, because the output paths are relative to it.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);

function readArg(name) {
	const inline = args.find((arg) => arg.startsWith(`--${name}=`));
	if (inline) return inline.slice(name.length + 3);

	const index = args.indexOf(`--${name}`);
	return index === -1 ? undefined : args[index + 1];
}

function loadEnvFile(path) {
	if (!existsSync(path)) return {};

	const values = {};
	for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
		const line = rawLine.trim();
		if (!line || line.startsWith("#")) continue;

		const separator = line.indexOf("=");
		if (separator === -1) continue;

		const key = line.slice(0, separator).trim();
		let value = line.slice(separator + 1).trim();
		if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
			value = value.slice(1, -1);
		}
		values[key] = value;
	}
	return values;
}

const stage = readArg("stage") ?? "prod";
if (stage !== "dev" && stage !== "prod") {
	console.error(`Unknown stage "${stage}", expected dev or prod`);
	process.exit(1);
}

const templatePath = join(packageRoot, `redocly.${stage}.yml`);
if (!existsSync(templatePath)) {
	console.error(`Missing config ${templatePath}`);
	process.exit(1);
}

const env = {
	...loadEnvFile(join(packageRoot, ".env.local")),
	...loadEnvFile(join(packageRoot, ".env")),
	...process.env,
};

let config;
try {
	config = readFileSync(templatePath, "utf8").replace(/\$\{([A-Z0-9_]+)\}/g, (_, name) => {
		const value = env[name];
		if (!value) {
			throw new Error(`Missing ${name}; put it in pkgs/shared/.env.local or the shell`);
		}
		return value;
	});
} catch (error) {
	console.error(error.message);
	process.exit(1);
}

const temporaryConfig = join(packageRoot, `.redocly.${stage}.${process.pid}.yml`);
writeFileSync(temporaryConfig, config);

try {
	const bin = join(packageRoot, "node_modules", ".bin", "openapi-typescript");
	const result = spawnSync(bin, ["--redocly", temporaryConfig, ...(args.includes("--check") ? ["--check"] : [])], {
		cwd: packageRoot,
		env,
		stdio: "inherit",
	});

	if (result.error) throw result.error;
	process.exitCode = result.status ?? 1;
} finally {
	unlinkSync(temporaryConfig);
}
