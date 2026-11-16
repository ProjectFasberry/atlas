import { reatomComponent } from "@reatom/npm-react";
import { Button } from "@/shared/ui/button";
import { createNews, createNewsState } from "../models/news.model";
import { ButtonXSubmit } from "./ui";
import { NewsEditor, NewsField, NewsImagePanel } from "./news-form";
import { storageModel } from "./storage";

const { Storage } = storageModel({
  name: "create-news",
  as: "drawer",
  Slot: (
    <Button background="default" className="h-8 shrink-0 text-sm font-semibold">
      Из хранилища
    </Button>
  ),
  onSelectFile(ctx, fileName) {
    createNewsState.imageUrl.data(ctx, fileName);
    createNewsState.imageUrl.isError.reset(ctx);
    createNewsState.imageUrl.isLoading.reset(ctx);
    createNewsState.imageUrl.isOpen.reset(ctx);
  },
});

export const CreateNewsSubmit = reatomComponent(({ ctx }) => {
  const isDisabled = !ctx.spy(createNews.isValid) || ctx.spy(createNews.submit.statusesAtom).isPending;

  return <ButtonXSubmit onClick={() => createNews.submit(ctx)} disabled={isDisabled} />;
}, "CreateNewsSubmit");

export const CreateNewsForm = reatomComponent(({ ctx }) => {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="grid w-full gap-3 sm:grid-cols-2">
        <NewsField
          label="Заголовок"
          required
          value={ctx.spy(createNewsState.title)}
          onChange={(value) => createNewsState.title(ctx, value)}
        />
        <NewsField
          label="Описание"
          required
          value={ctx.spy(createNewsState.desc)}
          onChange={(value) => createNewsState.desc(ctx, value)}
        />
      </div>
      <NewsImagePanel
        url={ctx.spy(createNewsState.imageUrl.data)}
        loading={ctx.spy(createNewsState.imageUrl.isLoading)}
        onUrlChange={(value) => {
          createNewsState.imageUrl.isError(ctx, false);
          createNewsState.imageUrl.isLoading(ctx, false);
          createNewsState.imageUrl.data(ctx, value);
        }}
        onClear={() => {
          createNewsState.imageUrl.data(ctx, "");
          createNewsState.imageUrl.isError(ctx, false);
          createNewsState.imageUrl.isLoading(ctx, false);
        }}
        storage={<Storage />}
      />
      <NewsEditor
        isValidAtom={createNews.contentIsValid}
        tempContentAtom={createNewsState.tempContent}
        saveAction={(json) => createNews.saveContent(ctx, json)}
      />
    </div>
  );
}, "CreateNewsForm");
