import { createCtx } from "@reatom/framework"
import { describe, expect, it } from "vitest"
import { appearanceState, isStoreView, STORE_VIEWS } from "./settings-appearance.model"

describe("isStoreView", () => {
	it("accepts the supported layouts", () => {
		expect(STORE_VIEWS.map(isStoreView)).toEqual([true, true])
		expect(isStoreView("table")).toBe(false)
		expect(isStoreView(undefined)).toBe(false)
	})
})

describe("appearanceState", () => {
	it("uses web-friendly defaults", () => {
		const ctx = createCtx()

		expect(ctx.get(appearanceState.storeView)).toBe("grid")
		expect(ctx.get(appearanceState.soundsEnabled)).toBe(true)
		expect(ctx.get(appearanceState.reduceMotion)).toBe(false)
		expect(ctx.get(appearanceState.hideHeaderBalance)).toBe(false)
		expect(ctx.get(appearanceState.staticSkin)).toBe(false)
	})
})
