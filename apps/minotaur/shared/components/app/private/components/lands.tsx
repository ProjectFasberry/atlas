import { reatomComponent, useUpdate } from "@reatom/npm-react";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Typography } from "@/shared/ui/typography";
import { Avatar } from "@/shared/ui/avatar";
import { Skeleton } from "@/shared/ui/skeleton";
import { ErrorBlock } from "@/shared/ui/error-block";
import { Noop } from "@/shared/ui/noop";
import { createLink } from "@/shared/components/config/link/link.model";
import { currentUserState } from "@/shared/models/current-user/index.model";
import { LANDS_DELETE_PERMISSION } from "@/shared/consts/permissions";
import { dayjs } from "@/shared/lib/dayjs";
import { createPrivatedSectionModel } from "../models/shared.model";
import {
	createIsValidAtom,
	lands,
	landsState,
	type AdminLand,
	type CreateMode,
	type EligiblePlayer,
} from "../models/lands.model";
import { ButtonXSubmit, DeleteButton, LinkButton, itemVariant } from "./ui";

const ModeButton = reatomComponent<{ mode: CreateMode; label: string }>(({ ctx, mode, label }) => {
	const active = ctx.spy(landsState.create.mode) === mode;

	return (
		<Button
			background={active ? "white" : "default"}
			className="h-8 text-sm font-semibold"
			aria-pressed={active}
			onClick={() => landsState.create.mode(ctx, mode)}
		>
			{label}
		</Button>
	);
}, "LandsModeButton");

const CreateLandSubmit = reatomComponent(({ ctx }) => {
	const mode = ctx.spy(landsState.create.mode);
	const isPending = ctx.spy(lands.createRandom.statusesAtom).isPending
		|| ctx.spy(lands.createManual.statusesAtom).isPending;

	return (
		<ButtonXSubmit
			onClick={() => {
				if (mode === "random") {
					lands.createRandom(ctx);
				} else {
					lands.createManual(ctx);
				}
			}}
			disabled={isPending || !ctx.spy(createIsValidAtom)}
		/>
	);
}, "CreateLandSubmit");

const Field = reatomComponent<{
	label: string;
	value: string | number;
	type?: "text" | "number";
	onChange: (value: string) => void;
}>(({ label, value, type = "text", onChange }) => (
	<Input
		placeholder={label}
		aria-label={label}
		type={type}
		value={value}
		onChange={(event) => onChange(event.target.value)}
	/>
), "LandsField");

const PlayerChip = reatomComponent<{ player: EligiblePlayer }>(({ ctx, player }) => (
	<button
		type="button"
		onClick={() => lands.togglePlayer(ctx, player)}
		className="flex items-center gap-2 rounded-full border border-green-800 bg-green-900/20 py-1 pl-1 pr-2"
		title={`Убрать ${player.nickname}`}
	>
		<Avatar url={player.avatar} nickname={player.nickname} className="size-5" />
		<span className="text-sm">{player.nickname}</span>
	</button>
), "LandsPlayerChip");

const EligiblePlayerItem = reatomComponent<{ player: EligiblePlayer }>(({ ctx, player }) => {
	const selected = ctx.spy(landsState.selectedPlayers).some((item) => item.uuid === player.uuid);

	return (
		<button
			type="button"
			onClick={() => lands.togglePlayer(ctx, player)}
			aria-pressed={selected}
			className={`${itemVariant({ variant: selected ? "selected" : "default" })} gap-2`}
		>
			<Avatar url={player.avatar} nickname={player.nickname} className="size-5" />
			<span className="truncate">{player.nickname}</span>
		</button>
	);
}, "EligiblePlayerItem");

const PlayerPicker = reatomComponent(({ ctx }) => {
	useUpdate(lands.fetchEligible, []);

	const selected = ctx.spy(landsState.selectedPlayers);
	const eligible = ctx.spy(landsState.eligible);
	const status = ctx.spy(lands.fetchEligible.statusesAtom);

	return (
		<div className="flex flex-col gap-2 w-full">
			<div className="flex items-center gap-2 w-full">
				<Input
					placeholder="Поиск игрока без региона"
					value={ctx.spy(landsState.playerSearch)}
					onChange={(event) => landsState.playerSearch(ctx, event.target.value)}
					onKeyDown={(event) => {
						if (event.key === "Enter") lands.fetchEligible(ctx);
					}}
				/>
				<Button
					background="default"
					className="h-10 shrink-0 text-sm"
					onClick={() => lands.fetchEligible(ctx)}
					disabled={status.isPending}
				>
					Найти
				</Button>
			</div>
			{selected.length > 0 && (
				<div className="flex flex-wrap gap-1">
					{selected.map((player) => <PlayerChip key={player.uuid} player={player} />)}
				</div>
			)}
			<div className="flex max-h-48 flex-col gap-1 overflow-y-auto">
				{status.isFirstPending && <Skeleton className="h-24 w-full" />}
				{!status.isFirstPending && eligible.length === 0 && (
					<Typography color="gray" className="text-sm">
						Нет игроков без региона
					</Typography>
				)}
				{eligible.map((player) => <EligiblePlayerItem key={player.uuid} player={player} />)}
			</div>
		</div>
	);
}, "LandsPlayerPicker");

const CreateLandForm = reatomComponent(({ ctx }) => {
	const mode = ctx.spy(landsState.create.mode);
	const stats = ctx.spy(landsState.create.stats);

	const setStats = (key: keyof typeof stats, value: string) => {
		landsState.create.stats(ctx, {
			...stats,
			[key]: Math.max(0, Number(value) || 0),
		});
	};

	return (
		<div className="flex flex-col gap-3 w-full">
			<div className="flex items-center gap-1">
				<ModeButton mode="random" label="Случайные данные" />
				<ModeButton mode="manual" label="Вручную" />
			</div>
			<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
				<Field
					label={mode === "random" ? "Название (необязательно)" : "Название"}
					value={ctx.spy(landsState.create.landName)}
					onChange={(value) => landsState.create.landName(ctx, value)}
				/>
				<Field
					label="Описание"
					value={ctx.spy(landsState.create.title)}
					onChange={(value) => landsState.create.title(ctx, value)}
				/>
				<Field
					label="Чанков владельцу"
					type="number"
					value={ctx.spy(landsState.create.chunks)}
					onChange={(value) => landsState.create.chunks(ctx, Math.max(1, Number(value) || 1))}
				/>
				{mode === "manual" && (
					<>
						<Field
							label="Тип"
							value={ctx.spy(landsState.create.type)}
							onChange={(value) => landsState.create.type(ctx, value)}
						/>
						<Field
							label="Уровень"
							type="number"
							value={ctx.spy(landsState.create.level)}
							onChange={(value) => landsState.create.level(ctx, Math.max(1, Number(value) || 1))}
						/>
						<Field label="Убийства" type="number" value={stats.kills} onChange={(value) => setStats("kills", value)} />
						<Field label="Смерти" type="number" value={stats.deaths} onChange={(value) => setStats("deaths", value)} />
						<Field label="Победы" type="number" value={stats.wins} onChange={(value) => setStats("wins", value)} />
						<Field label="Поражения" type="number" value={stats.defeats} onChange={(value) => setStats("defeats", value)} />
						<Field label="Захваты" type="number" value={stats.captures} onChange={(value) => setStats("captures", value)} />
					</>
				)}
			</div>
			<div className="flex flex-col gap-1">
				<Typography className="text-sm font-semibold">
					Игроки
				</Typography>
				<Typography color="gray" className="text-xs">
					Первый выбранный становится владельцем и получает чанки. Остальные - участники с 0 чанков.
				</Typography>
			</div>
			<PlayerPicker />
		</div>
	);
}, "CreateLandForm");

const LandsListSkeleton = () => (
	<div className="flex flex-col gap-2 w-full">
		{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-16 w-full" />)}
	</div>
);

const LandListItem = reatomComponent<{ land: AdminLand }>(({ ctx, land }) => {
	const isDeleting = ctx.spy(lands.delete.statusesAtom).isPending;
	const canDelete = ctx.spy(currentUserState.perms).includes(LANDS_DELETE_PERMISSION);

	return (
		<div className="flex items-center justify-between gap-2 rounded-lg border border-neutral-800 p-2 w-full">
			<div className="flex min-w-0 items-center gap-2">
				{land.owner && (
					<Avatar url={land.owner.avatar} nickname={land.owner.nickname} className="size-9" />
				)}
				<div className="flex min-w-0 flex-col">
					<div className="flex min-w-0 items-center gap-2">
						<Typography className="truncate font-semibold">
							{land.name}
						</Typography>
						<Typography color="gray" className="shrink-0 text-xs">
							{land.type} · {land.level} lvl
						</Typography>
					</div>
					<Typography color="gray" className="truncate text-sm">
						{land.owner?.nickname ?? "без владельца"} · {land.members.length} участн. · {land.world}
					</Typography>
					<Typography color="gray" className="text-xs">
						{dayjs(land.created_at).format("DD.MM.YYYY HH:mm")}
					</Typography>
				</div>
			</div>
			<div className="flex shrink-0 items-center gap-1">
				<LinkButton link={createLink("land", land.ulid)} />
				{canDelete && (
					<DeleteButton
						onClick={() => lands.deleteConfirm(ctx, land)}
						disabled={isDeleting}
						title={`Удалить ${land.name}`}
					/>
				)}
			</div>
		</div>
	);
}, "LandsListItem");

const LandsList = reatomComponent(({ ctx }) => {
	useUpdate(lands.fetch, []);

	const status = ctx.spy(lands.fetch.statusesAtom);
	const error = ctx.spy(lands.fetch.errorAtom);
	const data = ctx.spy(landsState.list);

	if (status.isFirstPending) return <LandsListSkeleton />;
	if (error) return <ErrorBlock title={error.message} />;
	if (!data || data.data.length === 0) {
		return (
			<div className="flex flex-col gap-2 w-full">
				<div className="flex items-center gap-2 w-full">
					<Input
						placeholder="Поиск по названию"
						value={ctx.spy(landsState.search)}
						onChange={(event) => landsState.search(ctx, event.target.value)}
						onKeyDown={(event) => {
							if (event.key === "Enter") lands.fetch(ctx);
						}}
					/>
					<Button background="default" className="h-10 shrink-0 text-sm" onClick={() => lands.fetch(ctx)}>
						Найти
					</Button>
				</div>
				<Noop />
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-2 w-full">
			<div className="flex items-center gap-2 w-full">
				<Input
					placeholder="Поиск по названию"
					value={ctx.spy(landsState.search)}
					onChange={(event) => landsState.search(ctx, event.target.value)}
					onKeyDown={(event) => {
						if (event.key === "Enter") lands.fetch(ctx);
					}}
				/>
				<Button background="default" className="h-10 shrink-0 text-sm" onClick={() => lands.fetch(ctx)}>
					Найти
				</Button>
			</div>
			{data.data.map((land) => <LandListItem key={land.ulid} land={land} />)}
			{data.meta.hasNextPage && (
				<Button
					background="default"
					className="h-9 text-sm"
					onClick={() => lands.fetchMore(ctx)}
					disabled={status.isPending}
				>
					Показать ещё
				</Button>
			)}
		</div>
	);
}, "LandsList");

export const landsSection = createPrivatedSectionModel({
	event: "lands",
	components: {
		header: {
			create: <CreateLandSubmit />,
			edit: null,
		},
		content: {
			create: <CreateLandForm />,
			edit: null,
			view: <LandsList />,
		},
	},
});
