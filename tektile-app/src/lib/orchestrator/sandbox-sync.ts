import { Sandbox } from "@e2b/code-interpreter";
import { saveProjectManifest } from "./manifest-generator";
import { FileManifest } from "@/types/file-manifest";

/**
 * syncSandboxToManifest
 * 
 * Scans the E2B sandbox for all files and updates the Supabase project manifest.
 * This ensures the UI is always in sync with the actual state of the AI's workspace.
 */
export async function syncSandboxToManifest(
  projectId: string,
  sandbox: Sandbox,
  supabase: any,
  existingManifest?: FileManifest
) {
  console.log(`[SandboxSync] Scanning sandbox for project: ${projectId}`);
  
  try {
    // 1. Recursive list of all project files in possible workdirs
    const output = await sandbox.commands.run(`find /code /home/user /workspace -maxdepth 4 -not -path '*/.*' -not -path '*/node_modules*' -not -path '*/.next*' -type f 2>/dev/null`);
    
    if (output.exitCode !== 0) {
      console.warn(`[SandboxSync] Failed to list files: ${output.stderr}`);
      return;
    }

    const paths = output.stdout.split("\n").filter(p => p && p !== "." && (p.endsWith(".tsx") || p.endsWith(".ts") || p.endsWith(".jsx") || p.endsWith(".js") || p.endsWith(".css")));
    const files: Record<string, any> = { ...(existingManifest?.files || {}) };
    
    // 2. Fetch content for each file
    // Note: In a production app, we'd only fetch changed files using mtime
    for (const p of paths) {
      const cleanPath = p.replace("/code/", "").replace("/home/user/", "").replace("/workspace/", "").replace(/^\.\//, "");
      try {
        const content = await sandbox.files.read(p); // Use absolute path to read
        files[cleanPath] = {
          content,
          lastModified: Date.now(),
          componentInfo: existingManifest?.files[cleanPath]?.componentInfo
        };
      } catch (err) {
        console.warn(`[SandboxSync] Could not read ${cleanPath}:`, err);
      }
    }

    // 3. Construct the new manifest
    const newManifest: FileManifest = {
      projectId,
      entryPoint: existingManifest?.entryPoint || "src/app/page.tsx",
      files,
      styleFiles: existingManifest?.styleFiles || ["src/app/globals.css"],
      routes: existingManifest?.routes || [],
      componentTree: existingManifest?.componentTree || {}
    };

    // 4. Save to Supabase
    await saveProjectManifest(projectId, newManifest, supabase);
    console.log(`[SandboxSync] Successfully synced ${Object.keys(files).length} files to Supabase.`);
    
  } catch (error) {
    console.error(`[SandboxSync] Critical error during sync:`, error);
  }
}
