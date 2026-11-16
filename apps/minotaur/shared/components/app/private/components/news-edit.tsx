import { reatomComponent, useUpdate } from "@reatom/npm-react";
import { Skeleton } from "@/shared/ui/skeleton";
import { Typography } from "@/shared/ui/typography";
import { Button } from "@/shared/ui/button";
import { editNews, editNewsState, newsList } from "../models/news.model";
import { ButtonXSubmit } from "./ui";
import { NewsEditor, NewsField, NewsImagePanel } from "./news-form";
import { storageModel } from "./storage";
import { normalizeTiptapContent } from "@/shared/lib/tiptap-content";
import { translate } from "@/shared/locales/helpers"

const { Storage } = storageModel({
  name: "edit-news",
  as: "drawer",
  Slot: (
    <Button background="default" className="h-8 shrink-0 text-sm font-semibold">
      {translate["panel.from-storage"]()}</Button>
  ),
  onSelectFile(ctx, fileName) {
    editNews.updateField(ctx, "imageUrl", fileName);
  },
});

export const EditNewsSubmit = reatomComponent(({ ctx }) => {
  const isDisabled = !ctx.spy(editNews.isValid) || ctx.spy(editNews.submit.statusesAtom).isPending;

  return <ButtonXSubmit onClick={() => editNews.submit(ctx)} disabled={isDisabled} />;
}, "EditNewsSubmit");

export const EditNewsForm = reatomComponent(({ ctx }) => {
  // The form is the owner of the edit state: fill it when it opens, clear it when it closes.
  useUpdate((ctx) => { editNews.reset(ctx) }, []);
  useUpdate((ctx, item) => { if (item) editNews.fill(ctx, item) }, [editNews.item]);

  const item = ctx.spy(editNews.item);

  if (!item) {
    const isLoading = ctx.spy(newsList.fetch.statusesAtom).isPending;

    if (isLoading) {
      return <Skeleton className="h-40 w-full" />;
    }

    return <Typography>{translate["panel.the-selected-object-was-not-found"]()}</Typography>;
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="grid w-full gap-3 sm:grid-cols-2">
        <NewsField
          label={translate["panel.title"]()}
          required
          value={ctx.spy(editNewsState.title)}
          onChange={(value) => editNews.updateField(ctx, "title", value)}
        />
        <NewsField
          label={translate["panel.description"]()}
          required
          value={ctx.spy(editNewsState.description)}
          onChange={(value) => editNews.updateField(ctx, "description", value)}
        />
      </div>
      <NewsImagePanel
        url={ctx.spy(editNewsState.imageUrl)}
        onUrlChange={(value) => editNews.updateField(ctx, "imageUrl", value)}
        onClear={() => editNews.updateField(ctx, "imageUrl", "")}
        storage={<Storage />}
      />
      <NewsEditor
        key={item.id}
        initValue={normalizeTiptapContent(item.content)}
        isValidAtom={editNews.contentIsValid}
        tempContentAtom={editNewsState.tempContent}
        saveAction={(json) => editNews.saveContent(ctx, json)}
      />
    </div>
  );
}, "EditNewsForm");
