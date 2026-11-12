import { translate } from "@/shared/locales/helpers";

const TYPE_KEYS = {
	playtime: "ratings.types.playtime",
	lands: "ratings.types.lands",
	reputation: "ratings.types.reputation",
	charism: "ratings.types.charism",
	belkoin: "ratings.types.belkoin",
	parkour: "ratings.types.parkour",
} as const;

const SERVER_KEYS = {
	global: "ratings.servers.global",
	bisquite: "ratings.servers.bisquite",
	muffin: "ratings.servers.muffin",
} as const;

export type RatingType = keyof typeof TYPE_KEYS;
export type RatingServer = keyof typeof SERVER_KEYS;

export function isRatingType(value: string | undefined | null): value is RatingType {
	return !!value && Object.prototype.hasOwnProperty.call(TYPE_KEYS, value);
}

export function isRatingServer(value: string | undefined | null): value is RatingServer {
	return !!value && Object.prototype.hasOwnProperty.call(SERVER_KEYS, value);
}

export function getRatingTypeLabel(value: string | undefined | null, fallback?: string): string {
	const key = value && isRatingType(value) ? TYPE_KEYS[value] : null;
	return key ? translate[key]() : (fallback ?? value ?? "");
}

export function getServerLabel(value: string | undefined | null, fallback?: string): string {
	const key = value && isRatingServer(value) ? SERVER_KEYS[value] : null;
	return key ? translate[key]() : (fallback ?? value ?? "");
}
