import { createCtx, type Ctx } from "@reatom/framework";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { toastError, validateToken, listenBackOnce, cleanup } = vi.hoisted(() => ({
	toastError: vi.fn(),
	validateToken: vi.fn(),
	listenBackOnce: vi.fn(() => vi.fn()),
	cleanup: vi.fn(),
}));

vi.mock("sonner", () => ({ toast: { error: toastError } }));
vi.mock("@/shared/lib/events", () => ({ listenBackOnce }));
vi.mock("../../auth/models/qr.model", () => ({
	qrLogin: { verify: { validateToken } },
}));

import { getQrToken, scan, scanReaderModel, scanState } from "./settings-devices.model";

const reset = (ctx: Ctx) => {
	scanState.isStarted(ctx, false);
	scanState.confirmDialogIsOpen(ctx, false);
	scanState.cleanup.reset(ctx);
};

beforeEach(() => {
	toastError.mockReset();
	validateToken.mockReset();
	listenBackOnce.mockReset();
	listenBackOnce.mockReturnValue(cleanup);
	cleanup.mockReset();
	reset(createCtx());
});

describe("getQrToken", () => {
	it("reads the token from http and https links", () => {
		expect(getQrToken("https://app.fasberry.fun/auth?token=abc")).toBe("abc");
		expect(getQrToken("http://127.0.0.1:3000/auth?token=def&x=1")).toBe("def");
	});

	it("rejects other protocols, malformed values and links without a token", () => {
		expect(getQrToken("ftp://app.fasberry.fun/auth?token=abc")).toBe(null);
		expect(getQrToken("not a url")).toBe(null);
		expect(getQrToken("https://app.fasberry.fun/auth")).toBe(null);
		expect(getQrToken("")).toBe(null);
	});
});

describe("scan.verify", () => {
	it("opens the confirmation dialog with the parsed token", () => {
		const ctx = createCtx();

		scan.verify(ctx, "https://app.fasberry.fun/auth?token=abc");

		expect(ctx.get(scanState.confirmDialogIsOpen)).toBe(true);
		expect(validateToken.mock.calls[0]?.[1]).toBe("abc");
	});

	it("ignores links without a token instead of throwing", () => {
		const ctx = createCtx();

		scan.verify(ctx, "https://app.fasberry.fun/store");

		expect(ctx.get(scanState.confirmDialogIsOpen)).toBe(false);
		expect(validateToken).not.toHaveBeenCalled();
		expect(validateToken).not.toThrow();
	});
});

describe("scanReaderModel.handleScan", () => {
	it("verifies only http links", () => {
		const ctx = createCtx();

		scanReaderModel.handleScan(ctx, [
			{ rawValue: "javascript:alert(1)" },
			{ rawValue: "https://app.fasberry.fun/auth?token=abc" },
		] as never);

		expect(validateToken.mock.calls[0]?.[1]).toBe("abc");
	});
});

describe("scanReaderModel.onError", () => {
	it("stops the scanner and releases the back handler", () => {
		const ctx = createCtx();
		scan.start(ctx);
		expect(ctx.get(scanState.isStarted)).toBe(true);

		scanReaderModel.onError(ctx, new Error("camera"));

		expect(ctx.get(scanState.isStarted)).toBe(false);
		expect(cleanup).toHaveBeenCalled();
		expect(toastError).toHaveBeenCalled();
	});
});
