import { logRouting } from "@/shared/lib/log";
import { getStaticImage } from "@/shared/lib/helpers";
import { wrapTitle } from "@/shared/lib/helpers";
import { useConfig } from "vike-react/useConfig";
import { type PageContext } from "vike/types";
import { translate } from "@/shared/locales/helpers";

const image = getStaticImage("arts/wide.jpg");

function metadata() {
  const title = wrapTitle(translate["auth.page.title"]());
  const description = translate["auth.page.description"]();

	return {
		title,
		description,
		image,
	};
}

export async function data(pageCtx: PageContext) {
	logRouting(pageCtx.urlPathname, "data");

	const config = useConfig();
	config(metadata());
};
