import { createCtx, type Ctx } from "@reatom/framework";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { post } = vi.hoisted(() => ({ post: vi.fn() }));

vi.mock("@/shared/lib/client-wrapper", () => ({
	client: { post, get: vi.fn(), raw: { post: vi.fn() } },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import {
	usersAuth,
	usersAuthState,
	usersDataArrAtom,
	usersRestrictState,
	usersRoles,
	usersState,
} from "./users.model";

const makeUser = (nickname: string, roleId = 1) => ({
	nickname,
	lower_case_nickname: nickname.toLowerCase(),
	uuid: `${nickname}-uuid`,
	created_at: "2024-01-01T00:00:00.000Z",
	avatar: "",
	player: null,
	role: { id: roleId, name: `role-${roleId}` },
	skin: null,
});

const seed = (ctx: Ctx) => {
	usersState.data(
		ctx,
		new Map([
			["steve", makeUser("steve")],
			["alex", makeUser("alex")],
		]),
	);
	usersRoles.fetch.dataAtom(ctx, [
		{ id: 1, name: "player" },
		{ id: 2, name: "moderator" },
	]);
};

const roleOf = (ctx: Ctx, nickname: string) =>
	ctx.get(usersDataArrAtom).find((user) => user.nickname === nickname)?.role;

const nicknames = (ctx: Ctx) => ctx.get(usersDataArrAtom).map((user) => user.nickname);

beforeEach(() => {
	post.mockReset();
});

describe("role change", () => {
	it("updates the row before the request settles", async () => {
		post.mockResolvedValue({ ok: true });
		const ctx = createCtx();
		seed(ctx);
		usersRestrictState.nicknames(ctx, new Set(["steve"]));

		const promise = usersRoles.submit(ctx, "change_role", 2);

		expect(roleOf(ctx, "steve")).toEqual({ id: 2, name: "moderator" });
		expect(roleOf(ctx, "alex")).toEqual({ id: 1, name: "role-1" });

		await promise;
		expect(roleOf(ctx, "steve")).toEqual({ id: 2, name: "moderator" });
	});

	it("does not touch other rows", async () => {
		post.mockResolvedValue({ ok: true });
		const ctx = createCtx();
		seed(ctx);
		usersRestrictState.nicknames(ctx, new Set(["alex"]));

		await usersRoles.submit(ctx, "change_role", 2);

		expect(roleOf(ctx, "alex")).toEqual({ id: 2, name: "moderator" });
		expect(roleOf(ctx, "steve")).toEqual({ id: 1, name: "role-1" });
	});
});

describe("delete user", () => {
	it("removes the row optimistically", async () => {
		post.mockResolvedValue({ nickname: "steve" });
		const ctx = createCtx();
		seed(ctx);
		usersAuthState.deleteUser.nickname(ctx, "steve");
		usersAuthState.deleteUser.isConfirmed(ctx, true);

		const promise = usersAuth.deleteUser.submit(ctx);

		expect(nicknames(ctx)).toEqual(["alex"]);
		await promise;
		expect(nicknames(ctx)).toEqual(["alex"]);
	});

	it("opens the confirm dialog with the requested nickname", () => {
		const ctx = createCtx();
		seed(ctx);

		usersAuth.requestDelete(ctx, "alex");

		expect(ctx.get(usersAuthState.deleteUser.nickname)).toBe("alex");
		expect(ctx.get(usersAuthState.deleteUser.isOpen)).toBe(true);
	});
});
