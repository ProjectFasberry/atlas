import { type BuildEnvironmentOptions, defineConfig, loadEnv, type PreviewOptions } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import vike from "vike/plugin";
import svg from '@neodx/svg/vite';
import tsconfigPaths from 'vite-tsconfig-paths'
import path from "node:path"
import { paraglideVitePlugin } from "@inlang/paraglide-js";
import { SVG_OPTIONS } from "./shared/consts/svg";
import { analyzer } from 'vite-bundle-analyzer'

type Stage = "staging" | "prod"

type StageOpts = Partial<BuildEnvironmentOptions> & Partial<{
  chunksHashing: boolean,
  chunksGroping: boolean,
  visualizer: boolean
}>

const STAGES: Partial<Record<Stage, StageOpts>> = {
  "staging": {
    sourcemap: true,
    minify: false,
    chunksHashing: true,
    chunksGroping: true,
    visualizer: true
  },
  "prod": {
    sourcemap: false,
    minify: "esbuild",
    chunksHashing: false,
    chunksGroping: true,
    visualizer: false
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd()) as ImportMetaEnv;

  const host = process.env.NODE_ENV === 'development' ? "0.0.0.0" : new URL(env.VITE_API_URL).hostname;
  const port = Number(env.VITE_APP_PORT)

  const previewAndServerOpts: PreviewOptions = {
    host,
    port,
    allowedHosts: true
  }

  const stage = process.env["STAGE"] as Maybe<Stage>
  const stageOpts: StageOpts = stage ? (STAGES[stage] ?? {}) : {};

  let isSSR = false;

  const {
    chunksGroping, chunksHashing, visualizer: visualizerIsEnabled,
    ...stageBuildOpts
  } = stageOpts;

  return {
    logLevel: 'info',
    plugins: [
      vike(),
      react(),
      tailwindcss(),
      tsconfigPaths({
        ignoreConfigErrors: true
      }),
      svg(SVG_OPTIONS),
      {
        name: "log-on-client",
        configResolved(resolvedConfig) {
          isSSR = !!resolvedConfig.build.ssr;
        },
        buildStart() {
          if (!isSSR && process.env.NODE_ENV === 'production') {
            console.log(`Building for stage: ${stage}`, stageOpts)
          }
        }
      },
      paraglideVitePlugin({
        project: "./project.inlang",
        outdir: "./paraglide",
        strategy: ["cookie", "preferredLanguage", "baseLocale"]
      }),
      analyzer({
        enabled: visualizerIsEnabled,
        analyzerMode: 'static',
        openAnalyzer: true
      }),
    ],
    ssr: {
      noExternal: process.env.NODE_ENV === 'production' || undefined
    },
    build: {
      ...stageBuildOpts,
      emptyOutDir: true,
      target: "esnext",
      rollupOptions: {
        output: {
          chunkFileNames: chunksHashing ? 'assets/[name]-[hash].js' : 'assets/[hash].js',
          manualChunks(id) {
            if (!id.includes('node_modules')) return;

            if (
              id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/scheduler/')
            ) {
              return 'react-core';
            }

            if (id.includes('@scure/bip39/wordlists/english.js')) {
              return 'english-wordlist';
            }
            if (id.includes('tweakpane')) {
              return 'devonly';
            }
            if (['@reatom', 'reatom', 'zod', 'ky'].some(lib => id.includes(`node_modules/${lib}`))) {
              return 'core-vendor';
            }
            if (["@tiptap", "tiptap"].some(lib => id.includes(`node_modules/${lib}`))) {
              return 'editor';
            }
            if (id.includes('zag-js') || id.includes('ark-ui')) {
              return 'uikit-new';
            }
          }
        }
      }
    },
    resolve: {
      alias: [
        { find: "@", replacement: new URL("./", import.meta.url).pathname },
        {
          find: "consola",
          replacement: "consola",
          customResolver(updatedId, importer, options) {
            const isServerBuild = options && "ssr" in options && options.ssr === true;

            if (!isServerBuild && mode === 'production') {
              return path.resolve(__dirname, './shared/lib/noop.ts');
            }

            return this.resolve(updatedId, importer, { skipSelf: true, ...options });
          }
        },
        { find: "tailwind-variants", replacement: path.resolve(__dirname, './node_modules/tailwind-variants/dist/lite') }
      ]
    },
    preview: {
      ...previewAndServerOpts
    },
    server: {
      ...previewAndServerOpts
    },
  }
});
