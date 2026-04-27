import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  promoteRepoDeploymentToProduction,
  readRepoMetadata,
} from "@/lib/orchestrator/repo-storage";

const assertProjectAccess = async (req: Request, projectId: string) => {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return false;

  const { data } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  return !!data;
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;

  if (!(await assertProjectAccess(req, projectId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let deploymentId = "";
  try {
    const payload = (await req.json()) as { deploymentId?: string };
    deploymentId = payload?.deploymentId?.trim() ?? "";
  } catch {
    deploymentId = "";
  }

  if (!deploymentId) {
    return NextResponse.json(
      { error: "deploymentId is required" },
      { status: 400 },
    );
  }

  const metadata = await readRepoMetadata(projectId);
  if (!metadata) {
    return NextResponse.json(
      { error: "Project metadata not found" },
      { status: 404 },
    );
  }

  // In our E2B/Cloudflare flow, promotion is handled by updating the 
  // Cloudflare Pages alias or DNS record. 
  // For now, we update the Supabase metadata to track the 'Live' version.

  const nextMetadata = await promoteRepoDeploymentToProduction(
    projectId,
    metadata,
    deploymentId,
  );

  return NextResponse.json({
    productionDomain: nextMetadata.productionDomain,
    productionDeploymentId: nextMetadata.productionDeploymentId,
  });
}
