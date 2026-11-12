import { redirect } from "vike/abort";
import { type PageContextServer } from "vike/types";

/** Old category links keep working as shareable query URLs. */
export function guard(pageCtx: PageContextServer) {
	const server = pageCtx.routeParams.server;
	const type = pageCtx.routeParams.type;

	if (!server || !type) throw redirect("/ratings");

	throw redirect(`/ratings?server=${encodeURIComponent(server)}&type=${encodeURIComponent(type)}`);
}
