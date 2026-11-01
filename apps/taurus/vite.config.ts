import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import vike from "vike/plugin";
import path from "node:path";
import vikeSolid from "vike-solid/vite";
import svg from '@neodx/svg/vite';
import { cloudflare } from '@cloudflare/vite-plugin'
import { analyzer, unstableRolldownAdapter } from 'vite-bundle-analyzer'
import { paraglideVitePlugin } from "@inlang/paraglide-js";
import utwm from 'unplugin-tailwindcss-mangle/vite'

type Stage = "prod" | "staging";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  const stage = process.env["STAGE"] as Maybe<Stage>
  const isProd = stage === 'prod';

  let isSSR = false;

  return {
    plugins: [
      vike(),
      vikeSolid(),
      cloudflare({
        viteEnvironment: {
          name: 'ssr'
        }
      }),
      tailwindcss(),
      utwm(),
      svg({
        inputRoot: 'assets/svg',
        output: 'public/sprites',
        fileName: '{name}.{hash:8}.svg',
        metadata: 'shared/sprite.gen.ts',
        resetColors: false
      }),
      paraglideVitePlugin({
        project: "./project.inlang",
        outdir: "./paraglide",
        strategy: ["cookie", "preferredLanguage", "baseLocale"],
      }),
      unstableRolldownAdapter(
        analyzer({
          enabled: !isProd,
          analyzerMode: 'static',
          fileName: path.resolve(__dirname, "./dist/bundle-stats.html"),
          openAnalyzer: false
        })
      ),
      {
        name: "log-on-client",
        configResolved(resolvedConfig) {
          isSSR = !!resolvedConfig.build.ssr;
        },
        buildStart() {
          if (!isSSR && process.env.NODE_ENV === 'production') {
            console.log(`Building for stage ${stage}`)
          }
        }
      },
    ],
    build: {
      target: "esnext",
      outDir: "dist",
      emptyOutDir: true,
      rolldownOptions: {
        output: {
          chunkFileNames: `${!isProd ? "[name]-" : ""}[hash].js`,
          codeSplitting: {
            groups: [
              {
                name: 'lib',
                test: /node_modules\/(reatom|zod|ky|@reatom)(\/|$)/,
                priority: 10
              },
              {
                name: 'editor',
                test: /node_modules\/(tiptap|@tiptap)(\/|$)/,
                priority: 10
              },
              {
                name: 'framework',
                test: /node_modules\/solid-js(\/|$)/,
                priority: 10
              }
            ]
          }
        }
      }
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./"),
        "tailwind-variants": path.resolve(__dirname, "./node_modules/tailwind-variants/dist/lite")
      },
      tsconfigPaths: true
    },
    ssr: {
      noExternal: process.env.NODE_ENV === 'production' || undefined
    },
    css: {
      postcss: {
        plugins: [
          {
            postcssPlugin: "replace-css-env",
            Once(root) {
              root.walkDecls((decl) => {
                if (decl.value.includes("_VOLUME_URL")) {
                  decl.value = decl.value.replaceAll("_VOLUME_URL", env.VITE_VOLUME_URL);
                }
              });
            },
          },
        ],
      },
    },
  };
});
