import { resolve } from "path";
import { join } from "path/posix";
import { defineConfig } from "vite";
import Vue from "@vitejs/plugin-vue";
import Pages from "vite-plugin-pages";
import Icons from "unplugin-icons/vite";
// import IconsResolver from "unplugin-icons/resolver";
// import Components from "unplugin-vue-components/vite";
import AutoImport from "unplugin-auto-import/vite";
import WindiCSS from "vite-plugin-windicss";
import OptimizationPersist from "vite-plugin-optimize-persist";
import PkgConfig from "vite-plugin-package-config";
import Docs from "../node";
import Solid from "@vinxi/vite-preset-solid/solid";
export default defineConfig({
  base: "/__docs/",

  resolve: {
    alias: {
      "~/": __dirname
    }
  },

  plugins: [
    Vue(),
    Pages({
      pagesDir: "pages"
    }),
    Solid(),
    // vanillaExtractPlugin(),
    // icons({ compiler: "solid" }),
    // Components({
    //   dirs: ["components"],
    //   dts: join(__dirname, "components.d.ts"),
    //   resolvers: [
    //     IconsResolver({
    //       componentPrefix: ""
    //     })
    //   ]
    // }),
    Icons({ compiler: "solid" }),
    WindiCSS({
      scan: {
        dirs: [__dirname]
      }
    }),
    Docs({
      // include: /\.vue$/,
    }),
    PkgConfig({
      packageJsonPath: "vite.config.json"
    }),
    OptimizationPersist(),
    AutoImport({
      dts: join(__dirname, "auto-imports.d.ts"),
      imports: ["vue", "vue-router", "@vueuse/core"]
    })
  ],

  server: {
    fs: {
      strict: true
    }
  },

  build: {
    outDir: resolve(__dirname, "../../dist/client"),
    minify: false,
    emptyOutDir: true
  },

  optimizeDeps: {
    include: ["vue", "vue-router", "@vueuse/core"],
    exclude: ["vue-demi"]
  }
});
