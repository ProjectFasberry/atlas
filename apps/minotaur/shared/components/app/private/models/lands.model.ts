import { alertDialog } from "@/shared/components/config/alert-dialog/alert-dialog.model";
import { client } from "@/shared/lib/client-wrapper";
import { logError } from "@/shared/lib/log";
import { action, atom, reatomAsync, withAssign, withErrorAtom, withReset, withStatusesAtom } from "@reatom/framework";
import { toast } from "sonner";
import { actions, notifyAboutRestrictRole } from "./actions.model";

export type AdminLandMember = {
	uuid: string;
	nickname: string;
	chunks: number;
	avatar: string;
};

export type AdminLand = {
	ulid: string;
	name: string;
	title: string | null;
	type: string;
	level: number;
	created_at: string;
	world: string;
	server: string;
	owner: AdminLandMember | null;
	members: AdminLandMember[];
};

export type AdminLandListPayload = {
	data: AdminLand[];
	meta: {
		hasNextPage: boolean;
		hasPrevPage: boolean;
		startCursor?: string;
		endCursor?: string;
	};
};

export type EligiblePlayer = {
	uuid: string;
	nickname: string;
	avatar: string;
};

export type CreateMode = "random" | "manual";

const emptyStats = () => ({
	kills: 0,
	deaths: 0,
	wins: 0,
	defeats: 0,
	captures: 0,
});

export const landsState = atom(null, "landsState").pipe(
	withAssign((_, name) => ({
		search: atom("", `${name}.search`),
		list: atom<AdminLandListPayload | null>(null, `${name}.list`),
		playerSearch: atom("", `${name}.playerSearch`),
		selectedPlayers: atom<EligiblePlayer[]>([], `${name}.selectedPlayers`),
		eligible: atom<EligiblePlayer[]>([], `${name}.eligible`),
		create: atom(null, `${name}.create`).pipe(
			withAssign((_, name) => ({
				mode: atom<CreateMode>("random", `${name}.mode`).pipe(withReset()),
				name: atom("", `${name}.name`).pipe(withReset()),
				title: atom("", `${name}.title`).pipe(withReset()),
				type: atom("player", `${name}.type`).pipe(withReset()),
				level: atom(1, `${name}.level`).pipe(withReset()),
				chunks: atom(4, `${name}.chunks`).pipe(withReset()),
				stats: atom(emptyStats(), `${name}.stats`).pipe(withReset()),
			})),
		),
	})),
);

const resetCreate = action((ctx) => {
	landsState.create.mode.reset(ctx);
	landsState.create.name.reset(ctx);
	landsState.create.title.reset(ctx);
	landsState.create.type.reset(ctx);
	landsState.create.level.reset(ctx);
	landsState.create.chunks.reset(ctx);
	landsState.create.stats.reset(ctx);
	landsState.selectedPlayers(ctx, []);
	landsState.playerSearch(ctx, "");
}, "lands.resetCreate");

export const fetchLands = reatomAsync(async (ctx, params?: { cursor?: string; append?: boolean }) => {
	const search = ctx.get(landsState.search);

	const result = await ctx.schedule(() => client.raw.get<AdminLandListPayload>(
		"/privated/lands/list",
		{
			signal: ctx.controller.signal,
			params: {
				query: {
					limit: 64,
					endCursor: params?.cursor,
					searchQuery: search.trim() || undefined,
				},
			},
		},
	));

	return { result, append: params?.append ?? false };
}, {
	name: "lands.fetch",
	onFulfill: (ctx, { result, append }) => {
		if (!append) {
			landsState.list(ctx, result);
			return;
		}

		const current = ctx.get(landsState.list);

		landsState.list(ctx, current
			? { data: [...current.data, ...result.data], meta: result.meta }
			: result);
	},
	onReject: (_, e) => logError(e, { type: "combined" }),
}).pipe(
	withStatusesAtom(),
	withErrorAtom(),
);

export const fetchMoreLands = action((ctx) => {
	const meta = ctx.get(landsState.list)?.meta;
	if (!meta?.hasNextPage || !meta.endCursor) return;

	return fetchLands(ctx, { cursor: meta.endCursor, append: true });
}, "lands.fetchMore");

export const fetchEligiblePlayers = reatomAsync(async (ctx) => {
	const search = ctx.get(landsState.playerSearch);

	return await ctx.schedule(() => client.raw.get<EligiblePlayer[]>(
		"/privated/lands/eligible-players",
		{
			signal: ctx.controller.signal,
			params: {
				query: {
					limit: 64,
					searchQuery: search.trim() || undefined,
				},
			},
		},
	));
}, {
	name: "lands.fetchEligible",
	onFulfill: (ctx, data) => landsState.eligible(ctx, data),
	onReject: (_, e) => logError(e, { type: "combined" }),
}).pipe(
	withStatusesAtom(),
	withErrorAtom(),
);

export const toggleLandPlayer = action((ctx, player: EligiblePlayer) => {
	const selected = ctx.get(landsState.selectedPlayers);
	landsState.selectedPlayers(ctx, selected.some((item) => item.uuid === player.uuid)
		? selected.filter((item) => item.uuid !== player.uuid)
		: [...selected, player]);
}, "lands.togglePlayer");

export const createRandomLand = reatomAsync(async (ctx) => {
	const selected = ctx.get(landsState.selectedPlayers);
	if (selected.length === 0) throw new Error("PLAYERS_REQUIRED");

	return await client.raw.post<AdminLand>("/privated/lands/random", {
		json: {
			players: selected.map((player) => player.uuid),
			chunks: ctx.get(landsState.create.chunks),
			name: ctx.get(landsState.create.name).trim() || undefined,
			title: ctx.get(landsState.create.title).trim() || undefined,
		},
	});
}, {
	name: "lands.createRandom",
	onFulfill: (ctx) => {
		toast.success("Регион создан");
		resetCreate(ctx);
		landsState.search(ctx, "");
		actions.goBack(ctx);
		fetchLands(ctx);
		fetchEligiblePlayers(ctx);
	},
	onReject: (_, e) => notifyAboutRestrictRole(e),
}).pipe(
	withStatusesAtom(),
	withErrorAtom(),
);

export const createManualLand = reatomAsync(async (ctx) => {
	const selected = ctx.get(landsState.selectedPlayers);
	if (selected.length === 0) throw new Error("PLAYERS_REQUIRED");

	return await client.raw.post<AdminLand>("/privated/lands/manual", {
		json: {
			players: selected.map((player) => player.uuid),
			name: ctx.get(landsState.create.name).trim(),
			title: ctx.get(landsState.create.title).trim() || undefined,
			type: ctx.get(landsState.create.type).trim(),
			level: ctx.get(landsState.create.level),
			chunks: ctx.get(landsState.create.chunks),
			stats: ctx.get(landsState.create.stats),
		},
	});
}, {
	name: "lands.createManual",
	onFulfill: (ctx) => {
		toast.success("Регион создан");
		resetCreate(ctx);
		landsState.search(ctx, "");
		actions.goBack(ctx);
		fetchLands(ctx);
		fetchEligiblePlayers(ctx);
	},
	onReject: (_, e) => notifyAboutRestrictRole(e),
}).pipe(
	withStatusesAtom(),
	withErrorAtom(),
);

export const deleteLand = reatomAsync(async (_, ulid: string) => {
	await client.raw.delete<"OK">(`/privated/lands/${ulid}`);

	return ulid;
}, {
	name: "lands.delete",
	onFulfill: (ctx) => {
		toast.success("Регион удален");
		fetchLands(ctx);
	},
	onReject: (_, e) => {
		logError(e, { type: "combined" });
		toast.error("Не удалось удалить регион");
	},
}).pipe(
	withStatusesAtom(),
	withErrorAtom(),
);

export const deleteLandConfirm = action((ctx, land: AdminLand) => {
	alertDialog.open(ctx, {
		title: "Удаление региона",
		description: `Удалить регион ${land.name}?`,
		confirmLabel: "Удалить",
		onConfirm: () => deleteLand(ctx, land.ulid),
		errorAtom: deleteLand.errorAtom,
	});
}, "lands.deleteConfirm");

export const lands = atom(null, "lands").pipe(
	withAssign(() => ({
		fetch: fetchLands,
		fetchMore: fetchMoreLands,
		fetchEligible: fetchEligiblePlayers,
		togglePlayer: toggleLandPlayer,
		createRandom: createRandomLand,
		createManual: createManualLand,
		delete: deleteLand,
		deleteConfirm: deleteLandConfirm,
	})),
);

export const createIsValidAtom = atom((ctx) => {
	const mode = ctx.spy(landsState.create.mode);
	const name = ctx.spy(landsState.create.name).trim();
	const type = ctx.spy(landsState.create.type).trim();
	const players = ctx.spy(landsState.selectedPlayers);

	if (players.length === 0) return false;
	if (mode === "manual" && (!name || !type)) return false;

	return true;
}, "lands.createIsValid");
