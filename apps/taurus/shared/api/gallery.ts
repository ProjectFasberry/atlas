import { mainClient } from "./client"
import type { paths } from "../types/gen"

type GalleryOperation = paths["/site/gallery"]["get"]
type GalleryQuery = NonNullable<GalleryOperation["parameters"]["query"]>

export type GalleryApiItem = GalleryOperation["responses"][200]["content"]["application/json"]["data"][number]
export type GalleryCounts = GalleryOperation["responses"][200]["content"]["application/json"]["meta"]["counts"]
export type GalleryPage = GalleryOperation["responses"][200]["content"]["application/json"]
export type GalleryTag = NonNullable<GalleryQuery["tag"]>
export type GalleryFilter = "all" | GalleryTag
type GalleryLocale = NonNullable<GalleryQuery["locale"]>

export const GALLERY_PAGE_SIZE = 8

export async function fetchGallery(params: {
  locale: GalleryLocale
  tag?: GalleryTag
  cursor?: string
  limit?: number
}): Promise<GalleryPage> {
  const { data, error, response } = await mainClient.GET("/site/gallery", {
    params: {
      query: {
        locale: params.locale,
        tag: params.tag,
        cursor: params.cursor,
        limit: params.limit ?? GALLERY_PAGE_SIZE,
      },
    },
  })

  if (error) throw new Error("Gallery request failed")
  if (!data) throw new Error("Empty gallery response")

  return data
}
