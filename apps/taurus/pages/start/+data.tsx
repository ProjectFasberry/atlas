import { useConfig } from 'vike-solid/useConfig';
import type { PageContextServer } from 'vike/types';
import { wrapTitle, getStaticObject } from '@/shared/lib/helpers';
import { createPageHead } from '@/shared/lib/page-head';
import { translate } from '@/shared/locales/helpers';
import { loadPageData, type EditablePageData } from '@/shared/api/page-data';

const image = getStaticObject("backgrounds", "rules_background.png")

export type Data = EditablePageData

export async function data(pageCtx: PageContextServer): Promise<Data> {
  const config = useConfig()

  const pageData = await loadPageData("start", pageCtx)

  const title = wrapTitle(translate["pages.start-play.title"]());
  const description = translate["pages.start-play.description"]()

  config({
    title,
    description,
    Head: createPageHead(pageCtx, { title, description, image })
  })

  return pageData
}
