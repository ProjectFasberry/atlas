import { describe, expect, it } from "vitest"
import { detectBrowserLocale, isAvailableLang } from "./locale"

describe("detectBrowserLocale", () => {
	it("picks the first supported browser language", () => {
		expect(detectBrowserLocale(["de-DE", "ru-RU", "en-US"])).toBe("ru")
		expect(detectBrowserLocale(["fr-FR", "en-GB"])).toBe("en")
	})

	it("falls back to the base locale", () => {
		expect(detectBrowserLocale([])).toBe("ru")
		expect(detectBrowserLocale(["de-DE", "fr-FR"])).toBe("ru")
	})
})

describe("isAvailableLang", () => {
	it("accepts only configured locales", () => {
		expect(isAvailableLang("ru")).toBe(true)
		expect(isAvailableLang("en")).toBe(true)
		expect(isAvailableLang("de")).toBe(false)
		expect(isAvailableLang("")).toBe(false)
	})
})
