import { writeFile, readFile, listFiles } from "./file";
import { executeCommand, runBuild, checkLint } from "./terminal";

/**
 * Registry of all available tools for the agent brain.
 * This can be used for tool-selection by AI in a more advanced loop.
 */
export const toolRegistry = {
  writeFile,
  readFile,
  listFiles,
  executeCommand,
  runBuild,
  checkLint
};

export type ToolName = keyof typeof toolRegistry;

export function getTool<T extends ToolName>(name: T): typeof toolRegistry[T] {
  return toolRegistry[name];
}
