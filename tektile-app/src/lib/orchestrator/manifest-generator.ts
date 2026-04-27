import { createAdminClient } from "@/lib/supabase/admin";
import { FileManifest } from "@/types/file-manifest";

/**
 * Instant Hydration: Fetches the latest project manifest from Supabase.
 * This avoids cold-boot latency by reading from JSONB instead of the sandbox.
 */
export async function generateProjectManifest(
  projectId: string,
  providedSupabase?: any
): Promise<FileManifest | null> {
  const supabase = providedSupabase || createAdminClient();
  
  console.log(`[ManifestGenerator] Fetching latest version for project: ${projectId}`);
  
  // Query the project_versions table for the latest manifest
  const { data, error } = await supabase
    .from("project_versions")
    .select("manifest")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(`[ManifestGenerator] Error fetching manifest:`, error);
  }

  if (data?.manifest) {
    return data.manifest as FileManifest;
  }

  // Fallback: Try to read from project metadata if versions are missing
  const { data: projectData } = await supabase
    .from("projects")
    .select("adorable_metadata")
    .eq("id", projectId)
    .single();
    
  if (projectData?.adorable_metadata?.manifest) {
    return projectData.adorable_metadata.manifest as FileManifest;
  }
  
  // Return empty manifest for brand new projects
  return {
    projectId,
    entryPoint: "",
    files: {},
    styleFiles: [],
    routes: [],
    componentTree: {}
  };
}

/**
 * Saves a new version of the project manifest to Supabase.
 */
export async function saveProjectManifest(
  projectId: string, 
  manifest: FileManifest,
  providedSupabase?: any
) {
  const supabase = providedSupabase || createAdminClient();
  
  const { error } = await supabase
    .from("project_versions")
    .insert({
      project_id: projectId,
      manifest: manifest,
      created_at: new Date().toISOString()
    });

  if (error) {
    console.error(`[ManifestGenerator] Error saving manifest version:`, error);
    throw error;
  }
}
