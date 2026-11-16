import { createCtx, type Ctx } from "@reatom/framework"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { get, post, del, toastError, toastSuccess, openDialog } = vi.hoisted(() => ({
	get: vi.fn(),
	post: vi.fn(),
	del: vi.fn(),
	toastError: vi.fn(),
	toastSuccess: vi.fn(),
	openDialog: vi.fn(),
}))

vi.mock("@/shared/lib/client-wrapper", () => ({
	client: { get, post, delete: del },
}))
vi.mock("sonner", () => ({ toast: { error: toastError, success: toastSuccess } }))
vi.mock("@/shared/components/config/alert-dialog/alert-dialog.model", () => ({
	alertDialog: { open: openDialog },
}))
vi.mock("@/shared/env", () => ({
	env: { VITE_API_URL: "https://api.test" },
}))
vi.mock("@/shared/models/current-user/index.model", async () => {
	const { atom } = await import("@reatom/framework")

	return { currentUserState: atom(null) }
})

import { currentUserState } from "@/shared/models/current-user/index.model"
import { connectionsModel } from "./settings-connections.model"

const { connections, connectionsControl, connectionsState } = connectionsModel()

const socialRow = (social: string) => ({
	social,
	value: `${social}-id`,
	created_at: "2026-01-01T00:00:00.000Z",
}) as never

const reset = (ctx: Ctx) => {
	connectionsState.isOpen(ctx, false)
	connectionsState.isProcessing(ctx, false)
	connectionsState.processingSocial.reset(ctx)
	connectionsState.warningIsConfirmed.reset(ctx)
	connectionsState.payload.reset(ctx)
	connectionsControl.addWrapper.errorAtom.reset(ctx)
	connections.fetchList.cacheAtom.reset(ctx)
	connections.fetchAvailable.cacheAtom.reset(ctx)
	currentUserState(ctx, null)
}

beforeEach(() => {
	get.mockReset()
	post.mockReset()
	del.mockReset()
	toastError.mockReset()
	toastSuccess.mockReset()
	openDialog.mockReset()
	reset(createCtx())
})

describe("addWrapper", () => {
	it("asks for confirmation before doing anything", async () => {
		const ctx = createCtx()

		await connectionsControl.addWrapper(ctx, "telegram")

		expect(openDialog).toHaveBeenCalled()
		expect(post).not.toHaveBeenCalled()
		expect(ctx.get(connectionsState.isOpen)).toBe(false)
	})

	it("shows the code from the API and refreshes the lists", async () => {
		post.mockResolvedValue({ payload: "ABCD", target: "telegram" })
		get.mockImplementation((path: string) => Promise.resolve(
			path.includes("/list/") ? [socialRow("telegram")] : [{ title: "Telegram", social: "telegram" }],
		))
		const ctx = createCtx()
		currentUserState(ctx, { nickname: "steve" } as never)
		connectionsState.warningIsConfirmed(ctx, true)

		await connectionsControl.addWrapper(ctx, "telegram")

		expect(post).toHaveBeenCalledWith("/server/socials/add", { json: { social: "telegram" } })
		expect(ctx.get(connectionsState.isOpen)).toBe(true)
		expect(ctx.get(connectionsState.payload)).toEqual({ payload: "ABCD", target: "telegram" })
		expect(ctx.get(connectionsState.isProcessing)).toBe(false)
		await vi.waitFor(() => expect(get).toHaveBeenCalled())
	})

	it("keeps the dialog open and stores the mapped error", async () => {
		post.mockRejectedValue(new Error("SAVED_SOCIAL_EXISTS"))
		const ctx = createCtx()
		connectionsState.warningIsConfirmed(ctx, true)

		await connectionsControl.addWrapper(ctx, "telegram").catch(() => undefined)

		expect(ctx.get(connectionsState.isOpen)).toBe(true)
		expect(ctx.get(connectionsState.processingSocial)).toBe("telegram")
		expect(ctx.get(connectionsState.isProcessing)).toBe(false)
		expect(ctx.get(connectionsControl.addWrapper.errorAtom)).toBeInstanceOf(Error)
		expect(toastError).not.toHaveBeenCalled()
	})

	it("opens the Discord link and resets the warning", async () => {
		const open = vi.spyOn(window, "open").mockReturnValue({} as Window)
		const ctx = createCtx()
		connectionsState.warningIsConfirmed(ctx, true)

		await connectionsControl.addWrapper(ctx, "discord")

		expect(open).toHaveBeenCalledWith("https://api.test/server/socials/add/discord")
		expect(ctx.get(connectionsState.warningIsConfirmed)).toBe(false)
		open.mockRestore()
	})

	it("reports a blocked popup", async () => {
		const open = vi.spyOn(window, "open").mockReturnValue(null)
		const ctx = createCtx()
		connectionsState.warningIsConfirmed(ctx, true)

		await connectionsControl.addWrapper(ctx, "discord")

		expect(toastError).toHaveBeenCalled()
		open.mockRestore()
	})
})

describe("remove", () => {
	it("asks for confirmation and keeps the account", async () => {
		const ctx = createCtx()

		await connectionsControl.removeBefore(ctx, "telegram")

		expect(openDialog).toHaveBeenCalled()
		expect(del).not.toHaveBeenCalled()
	})

	it("deletes the account and drops it from the list", async () => {
		del.mockResolvedValue({ social: "telegram" })
		const ctx = createCtx()
		connections.fetchList.dataAtom(ctx, [socialRow("telegram"), socialRow("discord")])

		await connectionsControl.remove(ctx, "telegram")

		expect(del).toHaveBeenCalledWith("/server/socials/{social}", {
			params: { path: { social: "telegram" } },
		})
		await vi.waitFor(() => expect(ctx.get(connections.fetchList.dataAtom)).toHaveLength(1))
		expect(ctx.get(connections.fetchList.dataAtom)[0]?.social).toBe("discord")
	})
})
