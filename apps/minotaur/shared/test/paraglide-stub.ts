/**
 * Paraglide output is generated at build time and is not in the repository, so
 * tests get a stub that returns empty strings for any message key.
 */
export const m = new Proxy(
	{},
	{
		get: () => () => "",
	},
) as Record<string, () => string>;
