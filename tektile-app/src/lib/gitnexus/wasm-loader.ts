export async function initParser() {
  const ParserModule = await import('web-tree-sitter');
  const Parser = ParserModule.default || ParserModule;
  
  await Parser.init({
    locateFile(scriptName: string) {
      return `/wasm/${scriptName}`;
    },
  });
  
  const parser = new Parser();
  
  // Pre-load common languages for the AI builder
  const languages: Record<string, any> = {
    typescript: await Parser.Language.load('/wasm/tree-sitter-typescript.wasm'),
    tsx: await Parser.Language.load('/wasm/tree-sitter-tsx.wasm'),
    javascript: await Parser.Language.load('/wasm/tree-sitter-javascript.wasm'),
  };

  return { parser, languages };
}
