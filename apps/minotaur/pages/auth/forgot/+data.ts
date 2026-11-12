import { logRouting } from "@/shared/lib/log";
import { wrapTitle } from "@/shared/lib/helpers";
import { useConfig } from "vike-react/useConfig";
import { type PageContext } from "vike/types";
import { translate } from "@/shared/locales/helpers";

export async function data(pageCtx: PageContext) {
	logRouting(pageCtx.urlPathname, "data");

	useConfig()({
		title: wrapTitle(translate["auth.forgot.title"]()),
		description: translate["auth.forgot.description"](),
	});
}
