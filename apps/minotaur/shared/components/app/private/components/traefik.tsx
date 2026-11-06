import Editor, { type OnMount } from "@monaco-editor/react";
import { reatomComponent, useUpdate } from "@reatom/npm-react";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import {
  configAtom, isDirtyAtom, resetConfig, saveConfig, traefikConfig,
} from "../models/traefik.model";

export const ConfigEditor = reatomComponent(({ ctx }) => {
  useUpdate(traefikConfig, []);

  const config = ctx.spy(configAtom);
  const isDirty = ctx.spy(isDirtyAtom);
  const fetchStatus = ctx.spy(traefikConfig.statusesAtom);
  const fetchError = ctx.spy(traefikConfig.errorAtom);
  const saving = ctx.spy(saveConfig.statusesAtom).isPending;
  const saveError = ctx.spy(saveConfig.errorAtom);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (!ctx.get(isDirtyAtom) || ctx.get(saveConfig.statusesAtom).isPending) return;
      saveConfig(ctx);
    });
  };

  const isBusy = fetchStatus.isPending || saving;
  const error = fetchError ?? saveError;

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={() => saveConfig(ctx)}
          disabled={isBusy || !isDirty}
          variant="default"
          className="bg-white gap-2 text-black"
        >
          {saving ? "Сохранение" : "Сохранить (Ctrl+S)"}
          {saving && <Icon name="sprite:loader-2" className="size-4 animate-spin duration-300" />}
        </Button>
        <Button
          background="default"
          onClick={() => resetConfig(ctx)}
          disabled={isBusy || !isDirty}
        >
          Отменить
        </Button>
        <Button
          background="default"
          onClick={() => traefikConfig(ctx)}
          disabled={isBusy || isDirty}
          title={isDirty ? "Сначала сохраните или отмените изменения" : "Перечитать файл"}
        >
          <Icon name="sprite:refresh" className="size-4" />
          Обновить
        </Button>

        <span className={`text-sm font-semibold ${isDirty ? "text-yellow-400" : "text-neutral-500"}`}>
          {isDirty ? "Есть несохранённые изменения" : "Сохранено"}
        </span>
      </div>

      {error && (
        <span className="text-sm text-red">{error.message}</span>
      )}

      <div className="w-full overflow-hidden rounded-xl border border-neutral-800 h-[calc(100dvh-18rem)] min-h-[420px]">
        <Editor
          defaultLanguage="yaml"
          theme="vs-dark"
          height="100%"
          value={config}
          onChange={(value) => configAtom(ctx, value ?? "")}
          onMount={handleEditorDidMount}
          options={{
            fontFamily: "Consolas, monospace",
            fontSize: 13,
            renderLineHighlight: "all",
            cursorSmoothCaretAnimation: "on",
            smoothScrolling: true,
            minimap: { enabled: false },
          }}
        />
      </div>
    </div>
  );
}, "TraefikConfigEditor");
