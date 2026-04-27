import Graph from 'graphology';
import type Parser from 'web-tree-sitter';

export interface GraphNodeAttributes {
  label: string;
  x: number;
  y: number;
  size: number;
  color: string;
  type: 'file' | 'function' | 'class' | 'variable';
  filePath: string;
}

export interface GraphEdgeAttributes {
  label: string;
  size: number;
  color: string;
  type: 'contains' | 'imports' | 'calls' | 'references';
}

export async function buildGraphFromFiles(
  files: Record<string, string>,
  parser: Parser,
  languages: Record<string, Parser.Language>
): Promise<Graph<GraphNodeAttributes, GraphEdgeAttributes>> {
  const graph = new Graph<GraphNodeAttributes, GraphEdgeAttributes>({ multi: true });

  const fileNodes = new Map<string, string>();

  // 1. Create File Nodes
  Object.keys(files).forEach((path, index) => {
    const id = `file:${path}`;
    const angle = (index / Object.keys(files).length) * Math.PI * 2;
    const radius = 100;

    graph.addNode(id, {
      label: path.split('/').pop() || path,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      size: 10,
      color: path.endsWith('.tsx') ? '#61dafb' : path.endsWith('.ts') ? '#3178c6' : '#f7df1e',
      type: 'file',
      filePath: path,
    });
    fileNodes.set(path, id);
  });

  // 2. Parse Files for Dependencies (Basic Imports)
  for (const [path, content] of Object.entries(files)) {
    const isTS = path.endsWith('.ts') || path.endsWith('.tsx');
    if (!isTS) continue;

    parser.setLanguage(path.endsWith('.tsx') ? languages.tsx : languages.typescript);
    
    try {
        const tree = parser.parse(content);
        const query = (path.endsWith('.tsx') ? languages.tsx : languages.typescript).query(`
            (import_statement
                source: (string (string_fragment) @import_path))
        `);
        
        const matches = query.matches(tree.rootNode);
        matches.forEach(match => {
            const importPathRaw = match.captures[0].node.text;
            // Clean up path (very basic resolution)
            let targetPath = importPathRaw;
            if (targetPath.startsWith('./') || targetPath.startsWith('../')) {
                // In a real app we'd resolve this properly
                // For now just try to match suffix
                const possibleMatch = Object.keys(files).find(f => f.includes(targetPath.replace(/^\.\//, '')));
                if (possibleMatch) {
                    const sourceId = fileNodes.get(path)!;
                    const targetId = fileNodes.get(possibleMatch)!;
                    if (sourceId && targetId && !graph.hasEdge(sourceId, targetId)) {
                        graph.addEdge(sourceId, targetId, {
                            label: 'imports',
                            size: 1,
                            color: '#444466',
                            type: 'imports',
                        });
                    }
                }
            }
        });
    } catch (e) {
        console.warn(`[GraphBuilder] Failed to parse ${path}:`, e);
    }
  }

  return graph;
}
