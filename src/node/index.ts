import { fileURLToPath } from "url";
import { dirname, resolve as pathResolve } from "path";
import _debug from "debug";
import { yellow } from "kolorist";
import type { ModuleNode, Plugin, ResolvedConfig, ViteDevServer } from "vite";
import sirv from "sirv";
import { parseURL } from "ufo";
import getDoc from "./docs-wrapped";
const debug = _debug("vite-plugin-docs");

import fs from "fs";
import path from "path";
import resolve from "resolve";

function resolvePackage(specifier, referrer) {
  try {
    const resolved = resolve.sync(specifier, {
      basedir: path.dirname(new URL(referrer).pathname),
      packageFilter: (pkg, _pkgPath) => {
        if (pkg.types?.length) {
          pkg.main = pkg.types;
        }
        return pkg;
      },
      extensions: [".ts", ".tsx", ".d.ts"]
    });
    console.log(resolved);
    return "file://" + resolved;
  } catch (e) {
    return null;
  }
}

async function getDocs(doc, url) {
  try {
    let result = await doc(url, {
      resolve: resolveFn
    });

    return result;
  } catch (e) {
    console.error(e);
  }
}

const _dirname =
  typeof __dirname !== "undefined" ? __dirname : dirname(fileURLToPath(import.meta.url));

export type FilterPattern = ReadonlyArray<string | RegExp> | string | RegExp | null;

export interface Options {
  /**
   * Enable the inspect plugin (could be some performance overhead)
   *
   * @default true
   */
  enabled?: boolean;

  /**
   * Filter for modules to be inspected
   */
  include?: FilterPattern;
  /**
   * Filter for modules to not be inspected
   */
  exclude?: FilterPattern;
}

function resolveFn(specifier, referrer) {
  if (specifier.startsWith(".") || specifier.startsWith("/")) {
    if (!specifier.endsWith(".ts") && !specifier.endsWith(".tsx")) {
      for (const p of [
        specifier + ".ts",
        specifier + ".tsx",
        specifier + ".d.ts",
        specifier + "/index.ts",
        specifier + "/index.tsx",
        specifier + "/index.d.ts"
      ]) {
        console.log(`resolve ${p} ${path.dirname(new URL(referrer).pathname)}`);
        let p1 = path.dirname(new URL(referrer).pathname);
        fs.existsSync(path.join(p1, p));
        if (fs.existsSync(path.join(p1, p))) {
          let resolved = path.join(path.dirname(referrer), p);
          return resolved;
        }
      }
    }
  } else {
    return resolvePackage(specifier, referrer);
  }
}

function PluginInspect(options: Options = {}): Plugin {
  const { enabled = true } = options;

  if (!enabled) {
    return {
      name: "vite-plugin-docs"
    } as any;
  }

  // const filter = createFilter(options.include, options.exclude);
  let config: ResolvedConfig;

  async function configureServer(server: ViteDevServer) {
    server.middlewares.use(
      "/__docs",
      sirv(pathResolve(_dirname, "../../dist/client"), {
        single: true,
        dev: true
      })
    );

    const doc = await getDoc({}, (await import("node-fetch")).default);

    server.middlewares.use("/__docs_api", async (req, res) => {
      const { pathname, search } = parseURL(req.url);
      console.log(pathname, resolveFn("." + pathname, "file://" + process.cwd() + "/index.js"));
      let id = resolveFn("." + pathname, "file://" + process.cwd() + "/index.js");

      console.log("resolved", id);
      if (id) {
        let result = await getDocs(doc, id);
        if (result) {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(result));
          return;
        }
      }
      res.write(JSON.stringify({ error: "Module Not Found", path: req.url }));
      res.end();
    });

    server.middlewares.use("/__package", async (req, res) => {
      let result = fs.readFileSync(path.join(process.cwd(), "package.json"), "utf-8");
      if (result) {
        res.setHeader("Content-Type", "application/json");
        res.end(result);
        return;
      }
      res.write(JSON.stringify({ error: "Module Not Found", path: req.url }));
      res.end();
    });

    server.middlewares.use("/__docs_package", async (req, res) => {
      const { pathname, search } = parseURL(req.url);
      console.log(pathname.slice(1), "file://" + process.cwd() + "/index.js");
      const id = resolvePackage(pathname.slice(1), "file://" + process.cwd() + "/index.js");

      if (!id) {
        res.write(JSON.stringify({ error: "Module Not Found", path: req.url }));
        res.end();
        return;
      }
      try {
        let result = await getDocs(doc, id);
        if (result) {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(result));
          return;
        }
      } catch (e) {
        res.write(req.url);
        res.end();
      }
    });

    server.httpServer?.once("listening", () => {
      const protocol = config.server.https ? "https" : "http";
      const port = config.server.port;
      setTimeout(() => {
        // eslint-disable-next-line no-console
        console.log(`  > Docs: ${yellow(`${protocol}://localhost:${port}/__docs/`)}\n`);
      }, 0);
    });
  }

  return <Plugin>{
    name: "vite-plugin-docs",
    apply: "serve",
    configResolved(_config) {
      config = _config;
    },
    configureServer
  };
}

export default PluginInspect;
