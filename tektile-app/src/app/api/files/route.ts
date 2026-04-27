import { NextRequest, NextResponse } from "next/server";
import { Sandbox } from "@e2b/code-interpreter";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const filePath = searchParams.get("filePath");

    if (!projectId || !filePath) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get sandbox ID
    const { data: sandboxData, error: sandboxError } = await supabase
      .from("sandboxes")
      .select("sandbox_id")
      .eq("project_id", projectId)
      .single();

    if (sandboxError || !sandboxData) {
      console.warn(`[API/files] Sandbox entry not found in DB for project ${projectId}`);
      return NextResponse.json({ error: "Sandbox not found in project registry" }, { status: 404 });
    }

    // Connect to Sandbox and safely read file
    try {
      const sandbox = await Sandbox.connect(sandboxData.sandbox_id);
      
      // Normalize path for E2B (ensure it starts with /home/user/ if it's relative)
      let fullPath = filePath;
      if (!fullPath.startsWith('/')) {
        fullPath = `/home/user/${fullPath}`;
      }

      const content = await sandbox.files.read(fullPath);
      return NextResponse.json({ success: true, content });
    } catch (e: any) {
      console.warn(`[API/files] Sandbox connection or read failed (${e.message}), attempting recovery...`);
      
      // If path doesn't exist, it might be a new sandbox or different structure
      if (e.message.includes('does not exist')) {
        return NextResponse.json({ 
          success: false, 
          error: "File not found in sandbox", 
          content: "// This file hasn't been generated in the sandbox yet." 
        });
      }

      // Attempt to recreate if the error indicates a paused or missing sandbox
      try {
        const newSandbox = await Sandbox.create({ template: "base", apiKey: process.env.E2B_API_KEY });
        await supabase.from("sandboxes").upsert({ project_id: projectId, sandbox_id: newSandbox.sandboxId }, { onConflict: 'project_id' });
        
        return NextResponse.json({ 
          success: false, 
          error: "Sandbox was offline. Re-initialized. Please retry.",
          content: "// Sandbox was offline. Re-initializing environment..."
        });
      } catch (createError: any) {
        console.error("[API/files] Failed to create recovery sandbox:", createError);
        return NextResponse.json({ error: "Sandbox recovery failed: " + createError.message }, { status: 500 });
      }
    }
  } catch (error: any) {
    console.error("API ROUTER ERROR in /api/files:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
