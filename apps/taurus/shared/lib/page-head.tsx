import type { PageContext } from "vike/types"
import { getUrl } from "./helpers"

type PageHeadOptions = {
  title: string
  description?: string
  image?: string
  imageType?: string
}

/** Canonical, Open Graph and Twitter tags shared by every landing page. */
export function createPageHead(pageCtx: Pick<PageContext, "urlPathname">, options: PageHeadOptions) {
  const url = getUrl(pageCtx as PageContext)
  const image = options.image
  const description = options.description

  return (
    <>
      <link rel="canonical" href={url} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={options.title} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:site_name" content={options.title} />
      {image && <meta property="og:image" content={image} />}
      {image && <meta property="og:image:type" content={options.imageType ?? "image/jpeg"} />}
      {image && <meta property="og:image:width" content="1200" />}
      {image && <meta property="og:image:height" content="630" />}
      <meta name="twitter:title" content={options.title} />
      {description && <meta name="twitter:description" content={description} />}
      {image && <meta name="twitter:image" content={image} />}
      {image && <meta property="twitter:image:type" content={options.imageType ?? "image/jpeg"} />}
      {image && <meta property="twitter:image:width" content="1200" />}
      {image && <meta property="twitter:image:height" content="630" />}
    </>
  )
}
