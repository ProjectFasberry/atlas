import { describe, expect, it } from "vitest"
import {
	buildPlayerTags,
	getPlayerGroupMeta,
	isPlayerGroup,
	PLAYER_GROUPS,
	sortPlayerGroups,
} from "./groups"

describe("getPlayerGroupMeta", () => {
	it("resolves known groups case-insensitively", () => {
		expect(getPlayerGroupMeta("arkhont")?.color).toBe("#30ff5d")
		expect(getPlayerGroupMeta("  ARKHONT ")?.label).toBe("player.groups.arkhont")
		expect(getPlayerGroupMeta("Testers")?.label).toBe("player.groups.testers")
	})

	it("returns null for unknown groups", () => {
		expect(getPlayerGroupMeta("vip")).toBe(null)
		expect(getPlayerGroupMeta("")).toBe(null)
		expect(getPlayerGroupMeta("constructor")).toBe(null)
	})
})

describe("isPlayerGroup", () => {
	it("accepts only registry keys", () => {
		expect(Object.keys(PLAYER_GROUPS).every((group) => isPlayerGroup(group))).toBe(true)
		expect(isPlayerGroup("default")).toBe(true)
		expect(isPlayerGroup("vip")).toBe(false)
	})
})

describe("buildPlayerTags", () => {
	it("normalizes and deduplicates groups", () => {
		expect(buildPlayerTags("ARKHONT", "arkhont", " ArKhOnT ")).toEqual(["arkhont"])
	})

	it("drops empty values and keeps unknown groups", () => {
		expect(buildPlayerTags(null, undefined, "", "vip")).toEqual(["vip"])
	})
})

describe("sortPlayerGroups", () => {
	it("orders staff and donate groups by priority", () => {
		expect(sortPlayerGroups(["default", "loyal", "moder", "arkhont", "dev"]))
			.toEqual(["arkhont", "moder", "dev", "loyal", "default"])
	})

	it("puts unknown groups last and keeps the input stable by name", () => {
		expect(sortPlayerGroups(["vip", "loyal", "another", "default"]))
			.toEqual(["loyal", "default", "another", "vip"])
	})

	it("uses the registry priorities", () => {
		const priorities = Object.values(PLAYER_GROUPS).map((group) => group.priority)

		expect(new Set(priorities).size).toBe(priorities.length)
		expect(Math.max(...priorities)).toBe(PLAYER_GROUPS.arkhont.priority)
	})
})
