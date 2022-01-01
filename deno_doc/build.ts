let text = Deno.readTextFileSync("./docs-bundled.js");
Deno.writeTextFileSync(
  "./docs-wrapped.js",
  `export default async (Deno, fetch) => {
    ${text.replace("export { doc1 as doc }", "return doc1")}
  }`
);
