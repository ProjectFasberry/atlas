import { createPrivatedSectionModel } from "../models/shared.model";
import { CreateNewsForm, CreateNewsSubmit } from "./news-create";
import { EditNewsForm, EditNewsSubmit } from "./news-edit";
import { NewsList } from "./news-list";

export const newsSection = createPrivatedSectionModel({
  event: "news",
  components: {
    header: {
      create: <CreateNewsSubmit />,
      edit: <EditNewsSubmit />,
    },
    content: {
      create: <CreateNewsForm />,
      edit: <EditNewsForm />,
      view: <NewsList />,
    },
  },
});
