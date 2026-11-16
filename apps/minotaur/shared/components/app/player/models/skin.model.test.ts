import { createCtx, type AtomMut, type Ctx } from "@reatom/framework"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { get, put, post, del, toastSuccess, toastError, logError } = vi.hoisted(() => ({
  get: vi.fn(),
  put: vi.fn(),
  post: vi.fn(),
  del: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  logError: vi.fn(),
}))

vi.mock("@/shared/lib/client-wrapper", () => ({
  client: { get, put, post, delete: del },
}))
vi.mock("sonner", () => ({ toast: { success: toastSuccess, error: toastError } }))
vi.mock("@/shared/lib/log", () => ({ logError }))
vi.mock("skinview3d", () => ({
  SkinViewer: class SkinViewer {},
  IdleAnimation: class IdleAnimation {},
  RunningAnimation: class RunningAnimation {},
  FlyingAnimation: class FlyingAnimation {},
}))
vi.mock("./player.model", async () => {
  const { atom } = await import("@reatom/framework")

  return {
    isIdentityAtom: atom(false),
    playerState: { nickname: atom<string | null>(null) },
  }
})

import type { SkinViewer } from "skinview3d"
import { RunningAnimation } from "skinview3d"
import { appState } from "@/shared/models/app/index.model"
import { isIdentityAtom, playerState } from "./player.model"
import { currentSkinAtom, skinModel } from "./skin.model"

const {
  SKIN_VARIANTS,
  getIsSelectSkinAtom,
  getIsUploadAvailableAtom,
  getSkinVariantIsActiveAtom,
  skin,
  skins,
  skinsState,
  skinSubmitIsDisabledAtom,
} = skinModel()

// The mocked module swaps the computed atom for a writable one.
const setIdentity = (ctx: Ctx, value: boolean) =>
  (isIdentityAtom as unknown as AtomMut<boolean>)(ctx, value)

const createObjectURL = vi.fn(() => "blob:skin")
const revokeObjectURL = vi.fn()
const createImageBitmap = vi.fn()

const row = (identifier: string) => ({
  skin_identifier: identifier,
  skin_url: `https://example.test/${identifier}.png`,
  skin_head_url: `https://example.test/${identifier}-head.png`,
  timestamp: 1_700_000_000,
  skin_variant: "classic",
}) as never

const file = (name = "skin.png", size = 512, type = "image/png") =>
  new File([new Uint8Array(size)], name, { type })

const bitmap = (width: number, height: number) => ({
  width,
  height,
  close: vi.fn(),
})

const reset = (ctx: Ctx) => {
  skinsState.preview(ctx, null)
  skinsState.control.file.reset(ctx)
  skinsState.control.variant(ctx, SKIN_VARIANTS[0])
  skinsState.control.isOpen(ctx, false)
  skins.fetch.dataAtom(ctx, null)
  setIdentity(ctx, false)
  playerState.nickname(ctx, null)
  skin.animation.viewer(ctx, null)
  skin.animation.isRotate(ctx, false)
  skin.animation.type(ctx, "idle")
}

// jsdom has no canvas: hardware acceleration detection and skinview3d stay inert.
HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext

beforeEach(() => {
  get.mockReset()
  put.mockReset()
  post.mockReset()
  del.mockReset()
  toastSuccess.mockReset()
  toastError.mockReset()
  logError.mockReset()
  createObjectURL.mockClear()
  revokeObjectURL.mockClear()
  createImageBitmap.mockReset()
  createImageBitmap.mockResolvedValue(bitmap(64, 64))
  vi.stubGlobal("createImageBitmap", createImageBitmap)
  URL.createObjectURL = createObjectURL
  URL.revokeObjectURL = revokeObjectURL
  reset(createCtx())
})

describe("currentSkinAtom", () => {
  it("maps the first history row to the applied skin", () => {
    const ctx = createCtx()
    skins.fetch.dataAtom(ctx, [row("Steve"), row("Alex")] as never)

    expect(ctx.get(currentSkinAtom)).toEqual({
      identifier: "Steve",
      skin_url: "https://example.test/Steve.png",
      skin_head_url: "https://example.test/Steve-head.png",
    })
  })

  it("returns null without history", () => {
    const ctx = createCtx()
    expect(ctx.get(currentSkinAtom)).toBe(null)

    skins.fetch.dataAtom(ctx, [] as never)
    expect(ctx.get(currentSkinAtom)).toBe(null)
  })
})

describe("getIsSelectSkinAtom", () => {
  it("stays off for other players", () => {
    const ctx = createCtx()
    skins.fetch.dataAtom(ctx, [row("Steve")] as never)
    skinsState.preview(ctx, { identifier: "Alex", skin_url: null, skin_head_url: null })

    expect(ctx.get(getIsSelectSkinAtom)).toBe(false)
  })

  it("compares the preview with the applied skin case-insensitively", () => {
    const ctx = createCtx()
    setIdentity(ctx, true)
    skins.fetch.dataAtom(ctx, [row("Steve")] as never)

    skinsState.preview(ctx, { identifier: "steve", skin_url: null, skin_head_url: null })
    expect(ctx.get(getIsSelectSkinAtom)).toBe(false)

    skinsState.preview(ctx, { identifier: "Alex", skin_url: null, skin_head_url: null })
    expect(ctx.get(getIsSelectSkinAtom)).toBe(true)
  })
})

describe("getIsUploadAvailableAtom", () => {
  it("follows the identity flag", () => {
    const ctx = createCtx()
    expect(ctx.get(getIsUploadAvailableAtom)).toBe(false)

    setIdentity(ctx, true)
    expect(ctx.get(getIsUploadAvailableAtom)).toBe(true)
  })
})

describe("getSkinVariantIsActiveAtom", () => {
  it("compares the selected variant", () => {
    const ctx = createCtx()
    const isSlim = getSkinVariantIsActiveAtom("slim")
    expect(ctx.get(isSlim)).toBe(false)

    skinsState.control.variant(ctx, "slim")
    expect(ctx.get(isSlim)).toBe(true)
  })
})

describe("skinSubmitIsDisabledAtom", () => {
  it("requires a file without a validation error", () => {
    const ctx = createCtx()
    expect(ctx.get(skinSubmitIsDisabledAtom)).toBe(true)

    skinsState.control.file(ctx, file())
    expect(ctx.get(skinSubmitIsDisabledAtom)).toBe(false)

    skinsState.control.fileError(ctx, "invalid-file")
    expect(ctx.get(skinSubmitIsDisabledAtom)).toBe(true)
  })
})

describe("skins.control.setupSkinData", () => {
  const waitForFile = async (ctx: Ctx) => {
    await vi.waitFor(() => expect(ctx.get(skinsState.control.fileData)).not.toBe(null))
  }

  it("accepts a 64x64 png and exposes an object url", async () => {
    const ctx = createCtx()
    const target = file()
    skinsState.control.file(ctx, target)

    await waitForFile(ctx)

    expect(createObjectURL).toHaveBeenCalledWith(target)
    expect(ctx.get(skinsState.control.fileData)).toEqual({
      name: "skin.png",
      size: 512,
      url: "blob:skin",
    })
  })

  it("accepts a 64x32 png", async () => {
    createImageBitmap.mockResolvedValue(bitmap(64, 32))
    const ctx = createCtx()
    skinsState.control.file(ctx, file())

    await waitForFile(ctx)
    expect(ctx.get(skinsState.control.fileError)).toBe(null)
  })

  it("rejects files above one megabyte", async () => {
    const ctx = createCtx()
    skinsState.control.file(ctx, file("skin.png", 1024 * 1024 + 1))

    await vi.waitFor(() => expect(ctx.get(skinsState.control.fileError)).toBe("invalid-file"))
    expect(createObjectURL).not.toHaveBeenCalled()
    expect(createImageBitmap).not.toHaveBeenCalled()
  })

  it("rejects non-png files", async () => {
    const ctx = createCtx()
    skinsState.control.file(ctx, file("skin.jpg", 512, "image/jpeg"))

    await vi.waitFor(() => expect(ctx.get(skinsState.control.fileError)).toBe("invalid-file"))
    expect(createObjectURL).not.toHaveBeenCalled()
  })

  it("rejects unexpected dimensions and unreadable images", async () => {
    createImageBitmap.mockResolvedValue(bitmap(128, 64))
    const ctx = createCtx()
    skinsState.control.file(ctx, file())

    await vi.waitFor(() => expect(ctx.get(skinsState.control.fileError)).toBe("invalid-file"))

    createImageBitmap.mockRejectedValue(new Error("decode"))
    skinsState.control.fileError.reset(ctx)
    skinsState.control.file(ctx, file())

    await vi.waitFor(() => expect(ctx.get(skinsState.control.fileError)).toBe("invalid-file"))
    expect(createObjectURL).not.toHaveBeenCalled()
  })
})

describe("skinsState.control.file.reset", () => {
  it("revokes the object url and clears the upload state", async () => {
    const ctx = createCtx()
    skinsState.control.file(ctx, file())
    await vi.waitFor(() => expect(ctx.get(skinsState.control.fileData)?.url).toBe("blob:skin"))
    skinsState.control.fileError(ctx, "invalid-file")

    skinsState.control.file.reset(ctx)

    expect(revokeObjectURL).toHaveBeenCalledWith("blob:skin")
    expect(ctx.get(skinsState.control.file)).toBe(null)
    expect(ctx.get(skinsState.control.fileData)).toBe(null)
    expect(ctx.get(skinsState.control.fileError)).toBe(null)
  })
})

describe("skins.control.set", () => {
  it("does nothing without a preview", async () => {
    const ctx = createCtx()

    await skins.control.set(ctx)

    expect(put).not.toHaveBeenCalled()
  })

  it("applies the previewed skin", async () => {
    put.mockResolvedValue({ ok: true })
    const ctx = createCtx()
    skinsState.preview(ctx, { identifier: "Steven", skin_url: null, skin_head_url: null })

    await skins.control.set(ctx)

    expect(put).toHaveBeenCalledWith("/server/skin/current", {
      json: { skinName: "Steven" },
      retry: 1,
    })
    expect(toastSuccess).toHaveBeenCalled()
    expect(ctx.get(skinsState.preview)?.identifier).toBe("Steven")
  })

  it("restores the applied skin when the request fails", async () => {
    put.mockRejectedValue(new Error("SKIN_FORBIDDEN"))
    const ctx = createCtx()
    skins.fetch.dataAtom(ctx, [row("Steve")] as never)
    skinsState.preview(ctx, { identifier: "Alex", skin_url: null, skin_head_url: null })

    await skins.control.set(ctx).catch(() => undefined)

    expect(toastError).toHaveBeenCalled()
    expect(ctx.get(skinsState.preview)).toEqual({
      identifier: "Steve",
      skin_url: "https://example.test/Steve.png",
      skin_head_url: "https://example.test/Steve-head.png",
    })
  })
})

describe("skins.control.change", () => {
  it("skips both an empty file and an invalid one", async () => {
    const ctx = createCtx()
    expect(await skins.control.change(ctx)).toBe(null)

    skinsState.control.file(ctx, file())
    skinsState.control.fileError(ctx, "invalid-file")
    expect(await skins.control.change(ctx)).toBe(null)
    expect(post).not.toHaveBeenCalled()
  })

  it("uploads the file with the selected variant and resets the dialog", async () => {
    post.mockResolvedValue({ ok: true })
    const ctx = createCtx()
    const target = file()
    skinsState.control.file(ctx, target)
    skinsState.control.variant(ctx, "slim")
    skinsState.control.isOpen(ctx, true)
    await vi.waitFor(() => expect(ctx.get(skinsState.control.fileData)).not.toBe(null))

    await skins.control.change(ctx)

    const body = post.mock.calls[0]?.[1]?.body as FormData
    expect(post).toHaveBeenCalledWith("/server/skin/upload", expect.objectContaining({ body }))
    expect(body.get("file")).toBe(target)
    expect(body.get("variant")).toBe("slim")
    await vi.waitFor(() => expect(ctx.get(skinsState.control.isOpen)).toBe(false), { timeout: 3000 })
    await vi.waitFor(() => expect(ctx.get(skinsState.control.file)).toBe(null), { timeout: 3000 })
    expect(ctx.get(skinsState.control.variant)).toBe(SKIN_VARIANTS[0])
  })

  it("keeps the dialog open and reports a failed upload", async () => {
    post.mockRejectedValue(new Error("SKIN_NOT_FOUND"))
    const ctx = createCtx()
    skinsState.control.file(ctx, file())
    skinsState.control.isOpen(ctx, true)

    await skins.control.change(ctx).catch(() => undefined)

    expect(toastError).toHaveBeenCalled()
    expect(logError).toHaveBeenCalled()
    expect(ctx.get(skinsState.control.isOpen)).toBe(true)
  })
})

describe("skins.remove", () => {
  it("deletes the skin by identifier", async () => {
    del.mockResolvedValue({ ok: true })
    const ctx = createCtx()

    await skins.remove(ctx, "sr-steve")

    expect(del).toHaveBeenCalledWith("/server/skin/{skinName}", {
      params: { path: { skinName: "sr-steve" } },
      retry: 0,
    })
    expect(toastSuccess).toHaveBeenCalled()
  })

  it("reports a failed removal", async () => {
    del.mockRejectedValue(new Error("RATE_LIMITED"))
    const ctx = createCtx()

    await skins.remove(ctx, "sr-steve").catch(() => undefined)

    expect(toastError).toHaveBeenCalled()
    expect(logError).toHaveBeenCalled()
  })
})

describe("skins.fetch", () => {
  it("loads the history and previews its first row", async () => {
    get.mockResolvedValue([row("Steve"), row("Alex")])
    const ctx = createCtx()

    await skins.fetch(ctx, "steve")

    expect(get).toHaveBeenCalledWith("/server/skin/history/{nickname}", {
      signal: expect.anything(),
      params: { path: { nickname: "steve" } },
    })
    expect(ctx.get(skinsState.preview)).toEqual({
      identifier: "Steve",
      skin_url: "https://example.test/Steve.png",
      skin_head_url: "https://example.test/Steve-head.png",
    })
    expect(ctx.get(skins.fetch.dataAtom)).toHaveLength(2)
  })

  it("stores an empty history as null", async () => {
    get.mockResolvedValue([])
    const ctx = createCtx()

    await skins.fetch(ctx, "steve")

    expect(ctx.get(skins.fetch.dataAtom)).toBe(null)
    expect(ctx.get(skinsState.preview)).toBe(null)
  })

  it("logs a failed history request", async () => {
    get.mockRejectedValue(new Error("network"))
    const ctx = createCtx()

    await skins.fetch(ctx, "steve").catch(() => undefined)

    expect(logError).toHaveBeenCalled()
  })
})

describe("skins.init", () => {
  it("does nothing without hardware acceleration", async () => {
    const ctx = createCtx()
    appState.inited.hardwaveIsEnabled(ctx, false)
    playerState.nickname(ctx, "steve")
    get.mockClear()

    skins.init(ctx)

    expect(get).not.toHaveBeenCalled()
  })

  it("resets the preview and loads the history when acceleration is on", async () => {
    const ctx = createCtx()
    appState.inited.hardwaveIsEnabled(ctx, false)
    playerState.nickname(ctx, "steve")
    skinsState.preview(ctx, { identifier: "Alex", skin_url: null, skin_head_url: null })
    appState.inited.hardwaveIsEnabled(ctx, true)
    get.mockResolvedValue([row("Steve")])

    skins.init(ctx)

    await vi.waitFor(() => expect(get).toHaveBeenCalledWith(
      "/server/skin/history/{nickname}",
      expect.objectContaining({ params: { path: { nickname: "steve" } } }),
    ))
    await vi.waitFor(() => expect(ctx.get(skinsState.preview)?.identifier).toBe("Steve"))
  })
})

describe("skins.updateSkinAndHead", () => {
  it("skips the refetch without a nickname", () => {
    const ctx = createCtx()

    skins.updateSkinAndHead(ctx)

    expect(get).not.toHaveBeenCalled()
  })
})

describe("skin.animation", () => {
  const viewer = () => ({ autoRotate: false, animation: null }) as unknown as SkinViewer

  it("applies rotation to the viewer", () => {
    const ctx = createCtx()
    const target = viewer()
    skin.animation.viewer(ctx, target)

    skin.animation.isRotate(ctx, true)

    expect(target.autoRotate).toBe(true)
  })

  it("swaps the animation class", () => {
    const ctx = createCtx()
    const target = viewer()
    skin.animation.viewer(ctx, target)

    skin.animation.type(ctx, "run")

    expect(target.animation).toBeInstanceOf(RunningAnimation)
  })
})
