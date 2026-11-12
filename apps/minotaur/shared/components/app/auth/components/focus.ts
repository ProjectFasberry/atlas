import { type Ctx } from "@reatom/framework";
import { authState } from "../models/auth.model";

/** Focus the first field the last validation or API response marked. */
export function focusFirstAuthError(ctx: Ctx) {
	const first = ctx.get(authState.errorsType)[0];
	if (!first) return;

	requestAnimationFrame(() => {
		if (first === "acceptRules") {
			document.getElementById("checkbox:rules:input")?.focus();
			return;
		}

		const candidates = Array.from(
			document.querySelectorAll<HTMLElement>(`[data-auth-field="${first}"]`)
		);
		const target = candidates.find((element) => element.offsetParent !== null) ?? candidates[0];
		target?.focus();
	});
}
