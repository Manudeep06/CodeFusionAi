import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import JsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import CssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
import HtmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
import TsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";

/**
 * Monaco runs its language services (symbols, rename, formatting, diagnostics)
 * in web workers. Without this, "Go to Symbol", "Change All Occurrences" and
 * "Format Document" have nothing to talk to and silently do nothing.
 */
self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === "json") return new JsonWorker();
    if (label === "css" || label === "scss" || label === "less") return new CssWorker();
    if (label === "html" || label === "handlebars" || label === "razor") return new HtmlWorker();
    if (label === "typescript" || label === "javascript") return new TsWorker();
    return new EditorWorker();
  },
};

// JSX in .jsx/.tsx files: let the TS service parse it instead of flagging every tag.
const compilerOptions = {
  jsx: monaco.languages.typescript.JsxEmit.React,
  allowJs: true,
  allowNonTsExtensions: true,
  target: monaco.languages.typescript.ScriptTarget.ESNext,
  module: monaco.languages.typescript.ModuleKind.ESNext,
  moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
};
monaco.languages.typescript.javascriptDefaults.setCompilerOptions(compilerOptions);
monaco.languages.typescript.typescriptDefaults.setCompilerOptions(compilerOptions);
// Imports of packages that live only in the WebContainer can't be resolved here.
const diagnostics = { noSemanticValidation: true, noSyntaxValidation: false };
monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions(diagnostics);
monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions(diagnostics);

/* Basic brace-indent formatter for languages Monaco ships no formatter for. */
const indentFormat = (text) => {
  let indent = 0;
  return text.split("\n").map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return "";
    if (/^[}\])]/.test(trimmed)) indent = Math.max(0, indent - 1);
    const out = "    ".repeat(indent) + trimmed;
    if (/[{[(]$/.test(trimmed) && !trimmed.startsWith("//")) indent++;
    return out;
  }).join("\n");
};

for (const lang of ["cpp", "c", "java", "csharp", "go", "rust", "php"]) {
  monaco.languages.registerDocumentFormattingEditProvider(lang, {
    provideDocumentFormattingEdits: (model) => [{ range: model.getFullModelRange(), text: indentFormat(model.getValue()) }],
  });
  monaco.languages.registerDocumentRangeFormattingEditProvider(lang, {
    provideDocumentRangeFormattingEdits: (model, range) => [{ range, text: indentFormat(model.getValueInRange(range)) }],
  });
}

loader.config({ monaco });

export { monaco };
