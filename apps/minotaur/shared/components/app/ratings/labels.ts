import { translate } from "@/shared/locales/helpers";
import type { RatingKind } from "./schema";

const TYPE_KEYS = {
	playtime: "ratings.types.playtime",
	lands: "ratings.types.lands",
	reputation: "ratings.types.reputation",
	charism: "ratings.types.charism",
	belkoin: "ratings.types.belkoin",
	parkour: "ratings.types.parkour",
	wiki: "ratings.types.wiki",
	referrals: "ratings.types.referrals",
	purchases: "ratings.types.purchases",
	"lands-members": "ratings.types.lands-members",
} as const satisfies Record<RatingKind, string>;

const SERVER_KEYS = {
	global: "ratings.servers.global",
	bisquite: "ratings.servers.bisquite",
	muffin: "ratings.servers.muffin",
	lobby: "ratings.servers.lobby",
} as const;

export type RatingType = RatingKind;
export type RatingServer = keyof typeof SERVER_KEYS;

export function isRatingType(value: string | undefined | null): value is RatingType {
	return !!value && Object.hasOwn(TYPE_KEYS, value);
}

export function isRatingServer(value: string | undefined | null): value is RatingServer {
	return !!value && Object.hasOwn(SERVER_KEYS, value);
}

export function getRatingTypeLabel(value: string | undefined | null, fallback?: string): string {
	const key = value && isRatingType(value) ? TYPE_KEYS[value] : null;
	return key ? translate[key]() : (fallback ?? value ?? "");
}

export function getServerLabel(value: string | undefined | null, fallback?: string): string {
	const key = value && isRatingServer(value) ? SERVER_KEYS[value] : null;
	return key ? translate[key]() : (fallback ?? value ?? "");
}
