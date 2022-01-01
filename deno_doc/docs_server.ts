import { doc } from "https://deno.land/x/deno_doc/mod.ts";
import * as path from "https://deno.land/std@0.119.0/path/mod.ts";

function existsSync(path: string) {
  console.log("checking", path);
  try {
    Deno.statSync(path);
    return true;
  } catch (err) {
    return false;
  }
}

const resolveDoc = (specifier: string, referrer: string) => {
  console.log("resolving", specifier, referrer);
  const importMap = {
    "solid-js": "http://localhost:3000/node_modules/solid-js/types/index.d.ts"
  };

  if (specifier in importMap) {
    return importMap[specifier as keyof typeof importMap];
  }

  if (specifier === "solid-js") {
    return "http://localhost:4507/node_modules/.pnpm/solid-js@1.3.0-rc.0/node_modules/solid-js/types/index.d.ts";
  }
  if (specifier === "zustand/vanilla") {
    return "https://raw.githubusercontent.com/pmndrs/zustand/main/src/vanilla.ts";
  }
  if (specifier === "zustand/middleware") {
    return "http://localhost:4507/node_modules/.pnpm/zustand@3.6.8/node_modules/zustand/middleware.d.ts";
  }
  if (specifier === "three") {
    return "https://raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/master/types/three/index.d.ts";
  }

  if (!specifier.endsWith(".ts") && !specifier.endsWith(".tsx")) {
    if (referrer.startsWith("http://localhost")) {
      let tsxPath = path.join(Deno.cwd(), path.dirname(new URL(referrer).pathname));

      for (const p of [
        specifier + ".ts",
        specifier + ".tsx",
        specifier + ".d.ts",
        specifier + "/index.ts",
        specifier + "/index.tsx",
        specifier + "/index.d.ts"
      ]) {
        if (existsSync(path.join(tsxPath, p))) {
          let resolved = path.join(path.dirname(referrer), p);
          return resolved;
        }
      }
    }
  }

  throw new Error(`Could not resolve ${specifier} from ${referrer}`);
};

const loadDoc = async (url: string) => {
  console.log("loading", new URL(url).pathname);
  return {
    content: await Deno.readTextFile("." + new URL(url).pathname),
    specifier: url,
    headers: {}
  };
};

const colorsDoc = await doc("http://localhost:3000/node_modules/solid-js/types/index.d.ts", {
  resolve: resolveDoc,
  load: loadDoc
});

import { Application } from "https://deno.land/x/abc@v1.3.3/mod.ts";

const app = new Application();

console.log("http://localhost:8080/");

app
  .get("/p/:package/:entrypoint", async c => {
    const pkgJSON = await Deno.readTextFile(
      path.join(Deno.cwd(), "node_modules", c.params.package, "package.json")
    );

    return c.json(
      await doc(
        "http://localhost:3000/" +
          path.join("node_modules", c.params.package, "types", c.params.entrypoint, "index.d.ts"),
        {
          resolve: resolveDoc,
          load: loadDoc
        }
      )
    );
  })
  .get("/p/:package", async c => {
    const pkgJSON = await Deno.readTextFile(
      path.join(Deno.cwd(), "node_modules", c.params.package, "package.json")
    );

    return c.json(
      await doc(
        "http://localhost:3000/" +
          path.join("node_modules", c.params.package, "types", "index.d.ts"),
        {
          resolve: resolveDoc,
          load: loadDoc
        }
      )
    );
  })
  .start({ port: 8080 });

Deno.writeTextFileSync("./solid-docs.json", JSON.stringify(colorsDoc, null, 2));
