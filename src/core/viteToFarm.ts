import { readFile } from "fs/promises"
import { parse } from "@babel/parser"
import traverse from "@babel/traverse"
import generator from "@babel/generator"
import * as t from "@babel/types"
import { writeFileSync } from "fs"
import { resolve } from "path"
export async function parseViteConfig(configFile: string) {
  const code = await readFile(configFile, "utf-8")
  return parse(code, {
    sourceType: "module",
    attachComment: false,
    plugins: ['typescript'],
  })
}
let globalStatements: t.Statement[] = [];
let configObject: t.ObjectExpression | null = null;
export async function viteToFarm(configFile: string) {
  const ast = await parseViteConfig(configFile)
  const input = t.objectProperty(t.identifier("input"), t.objectExpression([]));
  const output = t.objectProperty(t.identifier("output"), t.objectExpression([]));
  const resolve = t.objectProperty(t.identifier("resolve"), t.objectExpression([]));
  const define = t.objectProperty(t.identifier("define"), t.objectExpression([]));
  const external = t.objectProperty(t.identifier("external"), t.objectExpression([]));
  const css = t.objectProperty(t.identifier("css"), t.objectExpression([]));
  const externalNodeBuiltins = t.objectProperty(t.identifier("externalNodeBuiltins"), t.booleanLiteral(true));
  const mode = t.objectProperty(t.identifier("mode"), t.stringLiteral("development"));
  const assets = t.objectProperty(t.identifier("assets"), t.objectExpression([]));
  const root = t.objectProperty(t.identifier("root"), t.stringLiteral(''));
  const script = t.objectProperty(t.identifier("root"), t.stringLiteral('esnext'));
  const html = t.objectProperty(t.identifier("html"), t.objectExpression([]));
  const sourcemap = t.objectProperty(t.identifier("sourcemap"), t.booleanLiteral(true));
  const partialBundling = t.objectProperty(t.identifier("build"), t.objectExpression([]));
  const lazyCompilation = t.objectProperty(t.identifier("lazyCompilation"), t.booleanLiteral(true));
  const treeShaking = t.objectProperty(t.identifier("treeShaking"), t.booleanLiteral(true));
  const minify = t.objectProperty(t.identifier("minify"), t.booleanLiteral(false));
  const presetEnv = t.objectProperty(t.identifier("presetEnv"), t.objectExpression([]));
  const persistentCache = t.objectProperty(t.identifier("persistentCache"), t.booleanLiteral(true));
  const progress = t.objectProperty(t.identifier("progress"), t.booleanLiteral(true));
  const comments = t.objectProperty(t.identifier("comments"), t.stringLiteral('license'));

  // server
  const server = t.objectProperty(t.identifier("server"), t.objectExpression([]));
  const port = t.objectProperty(t.identifier("port"), t.numericLiteral(9000));
  const hmr = t.objectProperty(t.identifier("hmr"), t.objectExpression([]));
  const proxy = t.objectProperty(t.identifier("proxy"), t.objectExpression([]));
  const open = t.objectProperty(t.identifier("open"), t.booleanLiteral(false));
  const host = t.objectProperty(t.identifier("host"), t.stringLiteral('localhost'));
  const serverPlugins = t.objectProperty(t.identifier("plugins"), t.arrayExpression([]));

  // universal
  const clearScreen = t.objectProperty(t.identifier("clearScreen"), t.booleanLiteral(true));
  const envDir = t.objectProperty(t.identifier("envDir"), t.stringLiteral(''));
  const envPrefix = t.objectProperty(t.identifier("envPrefix"), t.arrayExpression([]));
  const publicDir = t.objectProperty(t.identifier("publicDir"), t.stringLiteral('public'));
  const plugins = t.objectProperty(t.identifier("plugins"), t.arrayExpression([]));
  const vitePlugins = t.objectProperty(t.identifier("vitePlugins"), t.arrayExpression([]));

  traverse(ast, {
    CallExpression(path) {
      if (t.isIdentifier(path.node.callee) && path.node.callee.name === "defineConfig") {
        const arg = path.node.arguments[0];
        if (t.isFunctionExpression(arg) || t.isArrowFunctionExpression(arg)) {
          const body = (arg.body as t.BlockStatement).body;
          body.forEach(node => {
            if (t.isReturnStatement(node)) {
              configObject = node.argument as t.ObjectExpression;
            } else {
              globalStatements.push(node);
            }
          });
          if (configObject) {
            const compilationNode = t.objectProperty(t.identifier("compilation"), t.objectExpression([]));
            configObject.properties.forEach((prop) => {
              if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
                let properties = (compilationNode.value as t.ObjectExpression).properties;
                switch (prop.key.name) {
                  case "plugins":
                    properties.push(prop);
                    break;
                  case "resolve":
                    properties.push(resolve);
                    break;
                  case "define":
                    properties.push(define);
                    break;
                  case "external":
                    const externalProperties = (prop.value as t.ObjectExpression).properties;
                    externalProperties.push(externalNodeBuiltins);
                    properties.push(external);
                    break;
                  case "css":
                    properties.push(css);
                    break;
                  case "mode":
                    properties.push(mode);
                    break;
                  case "root":
                    properties.push(root);
                    break;
                  case "build":

                  
                  default:
                    break
                }
              }
              // if (t.isObjectProperty(prop)) {
              //   if (t.isIdentifier(prop.key)) {
              //     if (prop.key.name === "plugins") {
              //       prop.key.name = "vitePlugins"
              //       return true
              //     } else if (prop.key.name !== "server" && prop.key.name !== "build") {
              //       (compilationNode.value as t.ObjectExpression).properties.push(prop)
              //       return false
              //     } else if (prop.key.name == "server") {
              //       return true
              //     } else if (prop.key.name == "build") {
              //       traverse(prop.value, {
              //         noScope: true,
              //         ObjectProperty(path) {
              //           if (t.isIdentifier(path.node.key)) {
              //             if (path.node.key.name !== "rollupOptions") {
              //               (compilationNode.value as t.ObjectExpression).properties.push(path.node)
              //             }
              //           }
              //         }
              //       })
              //       return false
              //     }
              //   }
              // }
            });
            configObject.properties.unshift(compilationNode);
            path.node.arguments[0] = configObject;
          }
        }
      }
    },
    ImportDeclaration(path) {
      if (path.node.source.value === "vite") {
        path.node.source.value = "@farmfe/core"
      }
    }
  })

  // const importLastIdx = ast.program.body.findLastIndex(node => t.isImportDeclaration(node));
  // ast.program.body.splice(importLastIdx + 1, 0, ...globalStatements);
  // const farmConfigCode = generator(ast).code
  // writeFileSync(resolve(__filename, "./../../test/farm.config.ts"), farmConfigCode);
}
console.log('start')
viteToFarm(resolve(__filename, "./../../test/vite.config.ts"))
