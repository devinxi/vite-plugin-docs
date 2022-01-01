import { Switch, Match, Show, For, useContext, PropsWithChildren } from "solid-js";
import {
  DocNode,
  DocNodeFunction,
  DocNodeInterface,
  DocNodeTypeAlias,
  DocNodeNamespace,
  DocNodeVariable,
  JsDoc,
  ParamDef,
  ParamIdentifierDef,
  LiteralDef,
  LiteralDefBoolean,
  LiteralDefString,
  TsTypeRefDef,
  TsTypeDef,
  TsTypeParamDef,
  TsTypeTupleDef,
  TsTypeIntersectionDef,
  TsTypeTypeLiteralDef,
  TsTypeUnionDef,
  TsTypeFnOrConstructorDef,
  TsTypeKeywordDef,
  TsTypeDefLiteral,
  TsTypeTypeRefDef
} from "../../types";
import { createContext, createResource } from "solid-js";
import { Docs } from "./App";

const IndentContext = createContext(0);

function useIndent() {
  const context = useContext(IndentContext);
}

function Indent(props) {
  const context = useContext(IndentContext);
  return <IndentContext.Provider value={context + 2}>{props.children}</IndentContext.Provider>;
}

export function Node(props: { node: DocNode }) {
  return (
    <Switch>
      <Match when={props.node.kind === "function"}>
        <FunctionDoc node={props.node as DocNodeFunction} />
      </Match>
      <Match when={props.node.kind === "interface"}>
        <InterfaceDoc node={props.node as DocNodeInterface} />
      </Match>
      <Match when={props.node.kind === "typeAlias"}>
        <TypeAliasDoc node={props.node as DocNodeTypeAlias} />
      </Match>
      <Match when={props.node.kind === "namespace"}>
        <NamespaceDoc node={props.node as DocNodeNamespace} />
      </Match>
      <Match when={props.node.kind === "variable"}>
        <VariableDoc node={props.node as DocNodeVariable} />
      </Match>
    </Switch>
  );
}

function Space() {
  return <span> </span>;
}

function TypeAliasDoc(props: { node: DocNodeTypeAlias }) {
  return (
    <div class="flex flex-col">
      <Show when={props.node.jsDoc}>
        <Doc node={props.node.jsDoc!} />
      </Show>
      <pre>
        <Token type={"keyword"}>{"type"}</Token>
        <Space />
        <Token type={"identifier"}>{props.node.name}</Token>
        <Show when={props.node.typeAliasDef.typeParams.length}>
          <TypeParams typeParams={props.node.typeAliasDef.typeParams} />
        </Show>
        <Space />
        <Token type={"operator"}>{"="}</Token>
        <Space />
        <TsType node={props.node.typeAliasDef.tsType} />
      </pre>
    </div>
  );
}

function NamespaceDoc(props: { node: DocNodeNamespace }) {
  return (
    <div class="flex flex-col">
      <Show when={props.node.jsDoc}>
        <Doc node={props.node.jsDoc!} />
      </Show>
      <pre>
        <Token type={"keyword"}>{"namespace"}</Token>
        <Space />
        <Token type={"identifier"}>{props.node.name}</Token>
        {/* <Show when={props.node.namespaceDef.elements.length}> */}
        <Docs node={props.node.namespaceDef.elements} />
        {/* </Show> */}
        {/* <Space />
        <Token type={"operator"}>{"="}</Token>
        <Space />
        <TsType node={props.node.typeAliasDef.tsType} /> */}
      </pre>
    </div>
  );
}

function InterfaceDoc(props: { node: DocNodeInterface }) {
  return (
    <div class="flex flex-col">
      <Show when={props.node.jsDoc}>
        <Doc node={props.node.jsDoc!} />
      </Show>
      <pre>
        <Token type={"keyword"}>{"interface"}</Token>
        <Space />
        <Token type={"identifier"}>{props.node.name}</Token>
        <Show when={props.node.interfaceDef.typeParams.length}>
          <TypeParams typeParams={props.node.interfaceDef.typeParams} />
        </Show>
        <Show when={props.node.interfaceDef.extends.length}>
          <Space />
          <Token type={"keyword"}>{"extends"}</Token>
          <Space />
          <For each={props.node.interfaceDef.extends}>
            {(extendsName, i) => (
              <>
                <TsType node={extendsName} />
                <Show when={i() < props.node.interfaceDef.extends.length - 1}>
                  <Token type={"punctuation"}>,</Token>
                  <Space />
                </Show>
              </>
            )}
          </For>
        </Show>
        <Space />
        <Token type={"punctuation"}>{"{"}</Token>
        <Space />
        <Indent>
          <Show when={props.node.interfaceDef.properties.length > 0}>
            <NewLine />
            <For each={props.node.interfaceDef.properties}>
              {(property, i) => (
                <>
                  <Token type={"parameter"}>{property.name}</Token>
                  <Token type={"punctuation"}>:</Token>
                  <Space />
                  <Show when={property.tsType} fallback={<Token type="keyword">unknown</Token>}>
                    <TsType node={property.tsType!} />
                  </Show>
                  {/* <Show when={i() < props.node.interfaceDef.properties.length - 1}> */}
                  <Token type={"punctuation"}>;</Token>
                  <Show when={i() < props.node.interfaceDef.properties.length - 1}>
                    <NewLine />
                  </Show>
                </>
              )}
            </For>
          </Show>
          <For each={props.node.interfaceDef.methods}>
            {(method, i) => (
              <>
                <Tab />
                <Token type={"parameter"}>{method.name}</Token>
                <Token type={"punctuation"}>:</Token>
                <Space />

                <Show when={method.returnType} fallback={<Token type="keyword">unknown</Token>}>
                  <TsType node={method.returnType!} />
                </Show>
                {/* <Show when={i() < props.node.interfaceDef.properties.length - 1}> */}
                <Token type={"punctuation"}>;</Token>
                <Show when={i() < props.node.interfaceDef.methods.length - 1}>
                  <NewLine />
                </Show>
                {/* </Show> */}
              </>
            )}
          </For>
        </Indent>
        <NewLine />
        <Token type={"punctuation"}>{"}"}</Token>
      </pre>
    </div>
  );
}

function Tab() {
  const indent = useContext(IndentContext);
  return <span>{Array.from([...new Array(indent)]).map(() => " ")}</span>;
}

function VariableDoc(props: { node: DocNodeVariable }) {
  // props.node.functionDef.decorators;
  return (
    <div class="flex flex-col">
      <Show when={props.node.jsDoc}>
        <Doc node={props.node.jsDoc!} />
      </Show>
      <pre>
        <Token type={"keyword"}>{"const"}</Token>
        <Space />
        <Token type={"identifier"}>{props.node.name}</Token>
        <Token type="punctuation">:</Token>
        <Space />
        <Show
          when={props.node.variableDef.tsType}
          fallback={<Token type="punctuation">unknown</Token>}
        >
          <TsType node={props.node.variableDef.tsType!} />
        </Show>
        {/* <Show when={props.node.functionDef.typeParams.length}>
          <TypeParams typeParams={props.node.functionDef.typeParams} />
        </Show>
        <Token type={"punctuation"}>(</Token>
        <Params node={props.node} />
        <Token type={"punctuation"}>)</Token>
        <Token type={"punctuation"}>:</Token> <TsType node={props.node.functionDef.returnType} /> */}
      </pre>
    </div>
  );
}

function FunctionDoc(props: { node: DocNodeFunction }) {
  // props.node.functionDef.decorators;
  return (
    <div class="flex flex-col">
      <Show when={props.node.declarationKind === "export"}>{"export"}</Show>
      <Show when={props.node.jsDoc}>
        <Doc node={props.node.jsDoc!} />
      </Show>
      <pre>
        <Token type={"keyword"}>{"function"}</Token>
        <Space />
        <Token type={"identifier"}>{props.node.name}</Token>
        <Show when={props.node.functionDef.typeParams.length}>
          <TypeParams typeParams={props.node.functionDef.typeParams} />
        </Show>
        <Token type={"punctuation"}>(</Token>
        <Params node={props.node.functionDef.params} />
        <Token type={"punctuation"}>)</Token>
        <Token type={"punctuation"}>:</Token>{" "}
        <Show
          when={props.node.functionDef.returnType}
          fallback={<Token type="punctuation">unknown</Token>}
        >
          <TsType node={props.node.functionDef.returnType!} />
        </Show>
      </pre>
    </div>
  );
}

function Doc(props: { node: JsDoc }) {
  return null;
  return <pre class="text-bg-cool-gray-500 text-xs">{props.node.doc}</pre>;
}
// const [data, setData] = createSignal(0);

// useTippy(() => ref, {
//   props: {
//     get content() {
//       return `${data()}`;
//     }
//   }
// });
function Token(props: PropsWithChildren<{ type: string }>) {
  // let ref;

  // setInterval(() => {
  //   setData(d => d + 1);
  // }, 1000);

  return (
    <>
      <span
        // ref={ref}
        classList={{
          "text-green-600": props.type === "identifier",
          "text-gray-400": props.type === "punctuation",
          "text-blue-700": props.type === "parameter",
          "text-red-700": props.type === "keyword",
          "text-violet-700": props.type === "typeName",
          "text-green-300": props.type === "string"
        }}
      >
        {props.children}
      </span>
    </>
  );
}

function Params(props: { node: ParamDef[] }) {
  return (
    <>
      <For each={props.node}>
        {(param, i) => (
          <>
            <Switch fallback={param.kind}>
              <Match when={param.kind === "identifier"}>
                <Token type={"parameter"}>{(param as ParamIdentifierDef).name}</Token>
              </Match>
              <Match when={param.kind === "rest"}>
                <Token type={"parameter"}>...{"rest"}</Token>
              </Match>
              {/* <Match>{param.kind}</Match> */}
            </Switch>
            <Token type={"punctuation"}>:</Token>{" "}
            <Show when={param.tsType} fallback={<Token type="keyword">unknown</Token>}>
              <TsType node={param.tsType!} />
            </Show>
            <Show when={i() < props.node.length - 1}>
              <Token type={"punctuation"}>,</Token>
              <Space />
            </Show>
          </>
        )}
      </For>
    </>
  );
}

function TsLiteral(props: { node: LiteralDef }) {
  return (
    <Switch>
      <Match when={props.node.kind === "boolean"}>
        <Token type="boolean">{(props.node as LiteralDefBoolean).boolean}</Token>
      </Match>
      <Match when={props.node.kind === "string"}>
        <Token type="string">
          {'"'}
          {(props.node as LiteralDefString).string}
          {'"'}
        </Token>
      </Match>
    </Switch>
  );
}

function TsTypeRef(props: { node: TsTypeRefDef }) {
  return (
    <>
      <Token type="typeName">{props.node.typeName}</Token>
      <Show when={props.node.typeParams}>
        <TsTypeRefParams typeParams={props.node.typeParams!} />
      </Show>
    </>
  );
}

function TsTypeRefParams(props: { typeParams: TsTypeDef[] }) {
  return (
    <>
      <Token type="punctuation">{"<"}</Token>
      <For each={props.typeParams}>
        {(param, i) => (
          <>
            <TsType node={param} />
            <Show when={i() < props.typeParams.length - 1}>
              <Token type="punctuation">,</Token>
              <Space />
            </Show>
          </>
        )}
      </For>
      <Token type="punctuation">{">"}</Token>
    </>
  );
}

function TypeParams(props: { typeParams: TsTypeParamDef[] }) {
  return (
    <>
      <Token type="punctuation">{"<"}</Token>
      <For each={props.typeParams}>
        {(param, i) => (
          <>
            <Token type="type_param">{param.name}</Token>
            <Show when={i() < props.typeParams.length - 1}>, </Show>
          </>
        )}
      </For>
      <Token type="punctuation">{">"}</Token>
    </>
  );
}

function TsTupleDef(props: { node: TsTypeTupleDef }) {
  return (
    <>
      <Token type="punctuation">[</Token>
      <For each={props.node.tuple}>
        {(param, i) => (
          <>
            <TsType node={param} />
            <Show when={i() < props.node.tuple.length - 1}>
              <Token type="punctuation">,</Token>
              <Space />
            </Show>
          </>
        )}
      </For>
      <Token type="punctuation">]</Token>
    </>
  );
}

function TsIntersection(props: { node: TsTypeIntersectionDef }) {
  return (
    <>
      {/* <Token type="punctuation">[</Token> */}
      <For each={props.node.intersection}>
        {(param, i) => (
          <>
            <TsType node={param} />
            <Show when={i() < props.node.intersection.length - 1}>
              <Space />
              <Token type="punctuation">&</Token>
              <Space />
            </Show>
          </>
        )}
      </For>
      {/* <Token type="punctuation">]</Token> */}
    </>
  );
}

function NewLine() {
  return (
    <>
      <br />
      <Tab />
    </>
  );
}

function TsTypeLiteral(props: { node: TsTypeTypeLiteralDef }) {
  return (
    <>
      <Token type="punctuation">{"{"}</Token>
      <Indent>
        <Show when={props.node.typeLiteral.properties.length > 0}>
          <For each={props.node.typeLiteral.callSignatures}>
            {(member, i) => (
              <>
                <Params node={member.params} />
                {/* <Token type="parameter">{member.}</Token> */}
                {/* <Token type="type_param">{member.}</Token>
            <Token type="punctuation">:</Token>
            <TsType node={member.tsType} />
            <Show when={i() < props.node.members.length - 1}>
              <Token type="punctuation">,</Token>
              <Space />
            </Show> */}
              </>
            )}
          </For>
        </Show>
        <Show when={props.node.typeLiteral.properties.length > 0}>
          <NewLine />
          <For each={props.node.typeLiteral.properties}>
            {(member, i) => (
              <>
                <Token type="parameter">{member.name}</Token>
                <Params node={member.params} />
                <Token type="punctuation">:</Token>
                <Space />
                <Show when={member.tsType} fallback={<Token type="punctuation">unknown</Token>}>
                  <TsType node={member.tsType!} />
                </Show>
                <Show when={i() < props.node.typeLiteral.properties.length - 1}>
                  <NewLine />
                </Show>
              </>
            )}
          </For>
        </Show>

        <Show when={props.node.typeLiteral.indexSignatures.length > 0}>
          <NewLine />
          <For each={props.node.typeLiteral.indexSignatures}>
            {(member, i) => (
              <>
                <Token type="punctuation">[</Token>
                <Params node={member.params} />
                <Token type="punctuation">]</Token>
                <Token type="punctuation">:</Token>
                <Space />
                <Show when={member.tsType} fallback={<Token type="punctuation">unknown</Token>}>
                  <TsType node={member.tsType!} />
                </Show>
                <Show when={i() < props.node.typeLiteral.properties.length - 1}>
                  <NewLine />
                </Show>
              </>
            )}
          </For>
        </Show>
      </Indent>
      <NewLine />
      <Token type="punctuation">{"}"}</Token>
    </>
  );
}

function TsTypeUnion(props: { node: TsTypeUnionDef }) {
  return (
    <>
      <For each={props.node.union}>
        {(param, i) => (
          <>
            <TsType node={param} />
            <Show when={i() < props.node.union.length - 1}>
              <Space />
              <Token type="punctuation">|</Token>
              <Space />
            </Show>
          </>
        )}
      </For>
    </>
  );
}

function TsFnOrContstructor(props: { node: TsTypeFnOrConstructorDef }) {
  return (
    <>
      <Show when={props.node.fnOrConstructor.constructor}>{"new"}</Show>
      <Params node={props.node.fnOrConstructor.params} />
      <Show when={props.node.fnOrConstructor.typeParams.length}>
        <TypeParams typeParams={props.node.fnOrConstructor.typeParams} />
      </Show>
      <TsType node={props.node.fnOrConstructor.tsType} />
      {/* <Match when={props.node.fnOrConstructor.callSignatures}> */}
    </>
  );
}

function TsType(props: { node: TsTypeDef }) {
  return (
    <>
      <Switch fallback={props.node.kind}>
        <Match when={props.node.kind === "keyword"}>
          <Token type={"keyword"}>{(props.node as TsTypeKeywordDef).keyword}</Token>
        </Match>
        <Match when={props.node.kind === "literal"}>
          <TsLiteral node={(props.node as TsTypeDefLiteral).literal as LiteralDef} />
        </Match>
        <Match when={props.node.kind === "typeRef"}>
          <TsTypeRef node={(props.node as TsTypeTypeRefDef).typeRef} />
        </Match>
        <Match when={props.node.kind === "tuple"}>
          <TsTupleDef node={props.node as TsTypeTupleDef} />
        </Match>
        <Match when={props.node.kind === "typeLiteral"}>
          <TsTypeLiteral node={props.node as TsTypeTypeLiteralDef} />
        </Match>
        <Match when={props.node.kind === "intersection"}>
          <TsIntersection node={props.node as TsTypeIntersectionDef} />
        </Match>
        <Match when={props.node.kind === "union"}>
          <TsTypeUnion node={props.node as TsTypeUnionDef} />
        </Match>
        <Match when={props.node.kind === "fnOrConstructor"}>
          <TsFnOrContstructor node={props.node as TsTypeFnOrConstructorDef} />
        </Match>
      </Switch>
    </>
  );
}
