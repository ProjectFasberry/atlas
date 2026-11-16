import { createCtx, type Ctx } from "@reatom/framework";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { get, del, toastError, openDialog } = vi.hoisted(() => ({
	get: vi.fn(),
	del: vi.fn(),
	toastError: vi.fn(),
	openDialog: vi.fn(),
}));

vi.mock("@/shared/lib/client-wrapper", () => ({
	client: { get, delete: del },
}));
vi.mock("sonner", () => ({ toast: { error: toastError, success: vi.fn() } }));
vi.mock("@/shared/components/config/alert-dialog/alert-dialog.model", () => ({
	alertDialog: { open: openDialog },
}));

import { sessions, sessionsState } from "./settings-security.model";

const session = (id: string, created = "2026-01-01T00:00:00.000Z") => ({
	nickname: "steve",
	ip: "127.0.0.1",
	created_at: created,
	id,
	browser: { name: "Chrome", version: "120" },
	os: { name: "macOS", versionName: "14" },
	platform: { type: "desktop" },
}) as never;

const current = session("current");

const reset = (ctx: Ctx) => {
	sessionsState.activeList(ctx, null);
	sessionsState.current(ctx, null);
	sessionsState.isConfirmed(ctx, false);
	sessions.fetchCurrent.cacheAtom.reset(ctx);
	sessions.fetchActive.cacheAtom.reset(ctx);
};

const mockSessionApi = () => {
	get.mockImplementation((path: string) => Promise.resolve(
		path === "/auth/session/current" ? current : [current, session("other")],
	));
};

beforeEach(() => {
	get.mockReset();
	del.mockReset();
	toastError.mockReset();
	openDialog.mockReset();
	reset(createCtx());
});

describe("sessions.init", () => {
	it("loads the current session and filters it out of the active list", async () => {
		mockSessionApi();
		const ctx = createCtx();

		sessions.init(ctx);

		await vi.waitFor(() => expect(ctx.get(sessionsState.current)?.id).toBe("current"));
		await vi.waitFor(() => expect(ctx.get(sessionsState.activeList)).toHaveLength(1));
		expect(ctx.get(sessionsState.activeList)?.[0]?.id).toBe("other");
		expect(get).toHaveBeenCalledWith("/auth/session/current");
		expect(get).toHaveBeenCalledWith("/auth/session/list", expect.objectContaining({}));
	});

	it("stores an empty active list as null", async () => {
		get.mockImplementation((path: string) => Promise.resolve(
			path === "/auth/session/current" ? current : [current],
		));
		const ctx = createCtx();

		sessions.init(ctx);

		await vi.waitFor(() => expect(get).toHaveBeenCalledWith("/auth/session/list", expect.anything()));
		await vi.waitFor(() => expect(ctx.get(sessionsState.activeList)).toEqual([]));
	});
});

describe("sessions.terminateById", () => {
	it("deletes the session by id and refetches", async () => {
		mockSessionApi();
		del.mockResolvedValue({ data: "OK" });
		const ctx = createCtx();

		await sessions.terminateById(ctx, "other");

		expect(del).toHaveBeenCalledWith("/auth/session/{id}", {
			params: { path: { id: "other" } },
		});
		expect(get).toHaveBeenCalledWith("/auth/session/current");
	});

	it("explains the security delay on INSUFFICIENT_PERMISSION_BY_TIME", async () => {
		del.mockRejectedValue(new Error("INSUFFICIENT_PERMISSION_BY_TIME"));
		const ctx = createCtx();

		await sessions.terminateById(ctx, "other").catch(() => undefined);

		expect(openDialog.mock.calls[0]?.[1]).toMatchObject({
			withCancel: false,
			confirmLabel: "",
		});
		expect(toastError).not.toHaveBeenCalled();
	});

	it("refreshes the list when the acting session is gone", async () => {
		del.mockRejectedValue(new Error("INSUFFICIENT_PERMISSION_BY_EXISTANCE"));
		const ctx = createCtx();

		await sessions.terminateById(ctx, "other").catch(() => undefined);

		expect(toastError).toHaveBeenCalled();
		expect(openDialog).not.toHaveBeenCalled();
		expect(get).toHaveBeenCalledWith("/auth/session/current");
	});

	it("reports the current session guard", async () => {
		del.mockRejectedValue(new Error("CANNOT_DELETE_CURRENT"));
		const ctx = createCtx();

		await sessions.terminateById(ctx, "other").catch(() => undefined);

		expect(toastError).toHaveBeenCalled();
		expect(openDialog).not.toHaveBeenCalled();
	});
});

describe("sessions.terminateAll", () => {
	it("asks for confirmation before deleting", async () => {
		const ctx = createCtx();

		await sessions.terminateAll(ctx);

		expect(openDialog).toHaveBeenCalled();
		expect(del).not.toHaveBeenCalled();
	});

	it("deletes every other session once confirmed", async () => {
		mockSessionApi();
		del.mockResolvedValue({ data: "OK" });
		const ctx = createCtx();
		sessionsState.isConfirmed(ctx, true);

		await sessions.terminateAll(ctx);

		expect(del).toHaveBeenCalledWith("/auth/session/all");
		expect(ctx.get(sessionsState.isConfirmed)).toBe(false);
	});

	it("uses the stricter confirmation message for the remaining sessions", async () => {
		del.mockRejectedValue(new Error("INSUFFICIENT_PERMISSION_BY_TIME"));
		const ctx = createCtx();
		sessionsState.isConfirmed(ctx, true);

		await sessions.terminateAll(ctx).catch(() => undefined);

		expect(openDialog.mock.calls[0]?.[1]).toMatchObject({ withCancel: false });
	});
});
