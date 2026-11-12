import { redirect } from "vike/abort";
import { type PageContextServer } from "vike/types";
import { fetchRatingList } from "@/shared/components/app/ratings/models/ratings.model";

/** Reject combinations the category API does not expose. */
export async function guard(pageCtx: PageContextServer) {
	const server = pageCtx.routeParams.server;
	const type = pageCtx.routeParams.type;

	if (!server || !type) throw redirect("/ratings");

	let groups;

	try {
		groups = await fetchRatingList();
	} catch {
		// Let the page render its own error state instead of hiding an API outage.
		return;
	}

	const group = groups.find((item) => item.key === server);
	const isValid = group?.childs.some((child) => child.value === type);

	if (!isValid) throw redirect("/ratings");
}
