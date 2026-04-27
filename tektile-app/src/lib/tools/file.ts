import fs from "fs";
import path from "path";

/**
 * Common file system tools for the agentic loop.
 * Always respects the project's root.
 */
export async function writeFile(filePath: string, content: string) {
  const fullPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
  
  // Basic security check: Don't write outside project root
  if (!fullPath.startsWith(process.cwd())) {
      throw new Error(`Permission denied: Path is outside project root: ${filePath}`);
  }

  // Ensure parent directory exists
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, "utf-8");
  return { success: true, path: fullPath };
}

export async function readFile(filePath: string) {
  const fullPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${filePath}`);
  }
  return fs.readFileSync(fullPath, "utf-8");
}

export async function listFiles(dirPath: string = ".") {
  const fullPath = path.isAbsolute(dirPath) ? dirPath : path.join(process.cwd(), dirPath);
  return fs.readdirSync(fullPath, { withFileTypes: true }).map(dirent => ({
      name: dirent.name,
      isDirectory: dirent.isDirectory()
  }));
}
