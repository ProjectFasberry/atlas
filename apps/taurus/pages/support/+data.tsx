import { useConfig } from 'vike-solid/useConfig';
import type { PageContextServer } from 'vike/types';
import { getStaticObject, wrapTitle } from '@/shared/lib/helpers';
import { createPageHead } from '@/shared/lib/page-head';
import { translate } from '@/shared/locales/helpers';
import { loadPageData, type EditablePageData } from '@/shared/api/page-data';
import { getLocale } from '@/paraglide/runtime';
import { fetchFaq, type FaqApiItem } from '@/shared/api/faq';

const image = getStaticObject("community", "dragon_dead.webp")

export type Data = EditablePageData & { faq: FaqApiItem[] }

export async function data(pageCtx: PageContextServer): Promise<Data> {
  const config = useConfig();

  const locale = getLocale()
  const [pageData, faq] = await Promise.all([
    loadPageData("support", pageCtx),
    fetchFaq("support", locale).catch(() => []),
  ]);

  const title = wrapTitle(translate["pages.support.title"]());
  const description = translate["pages.support.description"]()

  config({
    title,
    description,
    Head: createPageHead(pageCtx, { title, description, image })
  })

  return { ...pageData, faq }
}
