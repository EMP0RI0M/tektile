import { NextRequest, NextResponse } from "next/server";
import { generateProjectManifest } from "@/lib/orchestrator/manifest-generator";
import { zipSync, strToU8 } from "fflate";
import { supabase } from "@/lib/supabase";

/**
 * Project Export API
 * Fetches the latest manifest and bundles it into a ZIP archive.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;

    // 1. Auth Check
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch Manifest (Instant Hydration)
    const manifest = await generateProjectManifest(projectId);
    if (!manifest) {
      return NextResponse.json({ error: "Project manifest not found" }, { status: 404 });
    }

    // 3. Prepare ZIP structure
    const zipData: Record<string, Uint8Array> = {};
    
    for (const [path, fileInfo] of Object.entries(manifest.files)) {
      // Remove leading slash if present
      const cleanPath = path.startsWith('/') ? path.substring(1) : path;
      zipData[cleanPath] = strToU8(fileInfo.content);
    }

    // 4. Generate ZIP
    const zipped = zipSync(zipData);

    // 5. Return as Blob
    return new NextResponse(zipped, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="forge-project-${projectId}.zip"`,
      },
    });

  } catch (error: any) {
    console.error("[ExportAPI] Error generating ZIP:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
