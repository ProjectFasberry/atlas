import { action, type Atom, atom, type Ctx, entries, isObject, reatomAsync, take, withAssign } from '@reatom/framework';
import { FolderApi, Pane } from 'tweakpane';
import { type ConfigItem, devtoolsConfig } from './config';
import { type DevtoolsCookieChildKey, devtoolsData } from './state.model';
import { isMap, isNullish } from "@/shared/lib/utils";

const devtoolsState = atom(null, "_devtoolsState").pipe(
  withAssign((_, name) => ({
    pane: atom<Nullable<Pane>>(null, `${name}.pane`),
    listeners: atom<(() => void)[]>([], `${name}.listeners`),
  }))
)

type AddBindingOptions = {
  bindings: (typeof devtoolsConfig)[keyof typeof devtoolsConfig],
  folder: FolderApi,
  folderPath: string,
  pane: Pane
}
function addBinding(ctx: Ctx, { bindings, folder, folderPath, pane }: AddBindingOptions) {
  function bind(keyName: string, configItem: ConfigItem<unknown>, fullPath: DevtoolsCookieChildKey) {
    const target = configItem.value

    if (isMap(target)) {
      (target as Map<string, Atom<unknown>>).forEach((atom, key) => {
        const value = {
          get [key]() {
            const state = ctx.get(atom);
            return typeof state === 'object' ? JSON.stringify(state, null, 2) : state;
          }
        };

        folder.addBinding(value, key, { readonly: true, multiline: true, rows: 12 })

        ctx.subscribe(atom, () => pane.refresh())
      })
    } else {
      let savedValue = devtoolsData.get(fullPath);

      if (!isNullish(savedValue) && typeof savedValue !== typeof target) {
        savedValue = null;
      }

      if (!isNullish(savedValue)) {
        const { applyAs, applyTarget } = configItem.__meta;

        if (applyAs === 'atom') {
          applyTarget?.(ctx, savedValue);
        }

        if (applyAs === 'static') {
          // configItem.__meta.onChange?.(savedValue)
        }
      }

      const value = { [keyName]: !isNullish(savedValue) ? savedValue : target };

      folder
        .addBinding(value, keyName)
        .on("change", ({ value: bindingVal }) => {
          if (isNullish(bindingVal)) return;

          devtoolsData.set(fullPath, bindingVal)

          const { applyAs, applyTarget } = configItem.__meta;

          if (applyAs === 'atom') {
            applyTarget?.(ctx, bindingVal);
          }

          if (applyAs === 'static') {
            configItem.__meta.onChange?.(ctx, bindingVal)
          }
        })
    }
  }

  for (const [key, val] of entries(bindings)) {
    if (isNullish(val)) continue;

    const item = val as unknown as ConfigItem<unknown>
    const fullPath = `${folderPath}.${key}` as DevtoolsCookieChildKey;

    if (isObject(item)) {
      if ('__meta' in item) {
        bind(key, item, fullPath);
        continue;
      }

      if (!Array.isArray(item)) {
        const subFolder = folder.addFolder({ title: key, expanded: false });
        addBinding(ctx, { bindings: item, folder: subFolder, folderPath: fullPath, pane });
      }
    }
  }
}

const DEVTOOLS_WIDTH = 360;
const DEVTOOLS_HEIGHT = 600;

const defineInitialStyle = (el: HTMLElement) => {
  Object.assign(el.style, {
    position: "fixed",
    zIndex: "9999",
    top: "16px",
    left: "16px",
    overflow: "hidden",
    touchAction: "none",
    maxHeight: `${DEVTOOLS_HEIGHT}px`,
    maxWidth: `${DEVTOOLS_WIDTH}px`
  });
}

function subscribeEventListener<
  T extends EventTarget,
  K extends keyof GlobalEventHandlersEventMap,
>(
  target: T,
  event: K,
  listener: (event: GlobalEventHandlersEventMap[K]) => void,
  options?: AddEventListenerOptions,
) {
  target.addEventListener(event, listener as EventListener, options)

  return () => {
    target.removeEventListener(event, listener as EventListener, options)
  }
}

export const devtools = atom(null, "_devtools").pipe(
  withAssign((_, name) => ({
    init: reatomAsync(async (ctx) => {
      if (import.meta.hot?.data.pane) {
        import.meta.hot.data.pane.dispose();
      }

      const devtoolsPane = devtoolsState.pane(ctx, new Pane()) as Pane
      if (import.meta.hot) {
        import.meta.hot.data.pane = devtoolsPane;
      };

      devtools.view.define(ctx, devtoolsPane.element)
      devtools.folders.define(ctx, devtoolsPane)
    }, `${name}.init`),
    folders: atom(null, `${name}.folders`).pipe(
      withAssign((_, name) => ({
        define: action((ctx, pane: Pane) => {
          const configEntries = entries(devtoolsConfig);
          const rootFolder = pane.addFolder({ title: "tools", expanded: true });

          configEntries.forEach(([folderName, bindings], index) => {
            const folderByChild = rootFolder.addFolder({
              title: folderName, expanded: true, index
            })

            addBinding(ctx, {
              bindings, folder: folderByChild, folderPath: folderName, pane
            })
          })
        }, `${name}.define`)
      }))
    ),
    view: atom(null, `${name}.view`).pipe(
      withAssign((_, name) => ({
        define: action((ctx, el: HTMLElement) => {
          defineInitialStyle(el);

          const resizeHandler = (e: UIEvent) => {
            if (!e) return;

            const actualWidth = window.innerWidth * (DEVTOOLS_WIDTH / 1920)
            el.style.width = `${actualWidth}px`;
            el.style.height = `${window.innerHeight}px`
          };

          const resizeListener = subscribeEventListener(
            document, "resize", resizeHandler
          );
          devtoolsState.listeners(ctx, (prev) => [...prev, resizeListener]);
        }, `${name}.define`)
      }))
    ),
    wrap: action(async (ctx, cb: (pane: Pane) => (() => void)) => {
      let instance = ctx.get(devtoolsState.pane);

      if (!instance) {
        instance = await take(ctx, devtoolsState.pane)
      }

      if (!instance) {
        console.warn('Skipping wrap devtools callback')
        throw new Error('Pane not found')
      }

      return cb(instance)
    })
  }))
)

devtools.init.onReject.onCall((_, e) => console.error(e))
