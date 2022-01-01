import { Link, Route, Routes, useParams } from "solid-app-router";
import { DocNode } from "../../types";
import { createContext, createResource, Show, For, useContext, createSignal } from "solid-js";
import { Node } from "./AST";
import { createEffect, JSX } from "solid-js";
const PackageContext = createContext();
const EntryPointContext = createContext();

const Dependencies = () => {
  const [pkg] = createResource("", async () =>
    (await fetch(`http://localhost:3000/__package`)).json()
  );
  const [value, setValue] = createSignal("solid-js");
  const [data] = createResource(value, async pkg => {
    return (await fetch(`http://localhost:3000/__docs_package/${value()}`)).json() as Promise<
      DocNode[]
    >;
  });

  return (
    <main class={`space-y-3 p-8`}>
      <div class="flex flex-row">
        <pre>/__docs/@fs/src/App</pre>: Docs for file{" "}
      </div>
      <Show when={!pkg.loading}>
        <select
          class="border-2 py-2 px-2 rounded-md"
          value={value()}
          onInput={e => {
            setValue(e.currentTarget.value);
          }}
        >
          <For
            each={[
              ...Object.keys(pkg()?.dependencies ?? {}),
              ...Object.keys(pkg()?.devDependencies ?? {})
            ]}
          >
            {(item, index) => (
              <option value={item} selected={item === value()}>
                {item}
              </option>
            )}
          </For>
        </select>
      </Show>
      <main class={`space-y-8 p-8`}>
        <pre class={`text-[2.5rem]`}>{value()}</pre>
        <div class="space-y-2">
          <Show when={!data.loading}>
            <Docs node={data()!} />
          </Show>
        </div>
      </main>
    </main>
  );
};

export function Docs(props: { node: DocNode[] }) {
  console.log(props.node);
  return (
    <>
      <For each={props.node}>
        {node => (
          <Show when={node.declarationKind === "export"}>
            <Node node={node} />
          </Show>
        )}
      </For>
      <For each={props.node}>
        {node => (
          <Show when={node.declarationKind === "declare"}>
            <Node node={node} />
          </Show>
        )}
      </For>
      <For each={props.node}>
        {node => (
          <Show when={node.declarationKind === "private"}>
            <Node node={node} />
          </Show>
        )}
      </For>
    </>
  );
}

function FileDocs() {
  const params = useParams();
  const [data] = createResource(params.all, async pkg => {
    return (await fetch(`http://localhost:3000/__docs_api/${pkg}`)).json() as Promise<DocNode[]>;
  });

  return (
    <main class={`space-y-8 p-8`}>
      <pre class={`text-[2.5rem]`}>{params.all}</pre>
      <div class="space-y-2">
        <Show when={!data.loading}>
          <Docs node={data()!} />
        </Show>
      </div>
    </main>
  );
}

function PackageDocs() {
  const params = useParams();
  const [data] = createResource(params.all, async pkg => {
    return (await fetch(`http://localhost:3000/__docs_package/${pkg}`)).json() as Promise<
      DocNode[]
    >;
  });

  return (
    <main class={`space-y-8 p-8`}>
      <pre class={`text-[2.5rem]`}>{params.all}</pre>
      <div class="space-y-2">
        <Show when={!data.loading}>
          <Docs node={data()!} />
        </Show>
      </div>
    </main>
  );
}

function App(): JSX.Element {
  return (
    <>
      <Routes>
        <Route path="/@pkg/*all" component={PackageDocs} />
        <Route path="/@fs/*all" component={FileDocs} />
        <Route path="/" component={Dependencies} />
      </Routes>
    </>
  );
}

export default App;
