import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { readRepoMetadata, setRepoProductionDomain } from "@/lib/orchestrator/repo-storage";

const PRODUCTION_SUFFIX = ".tektile.app"; // Adjusted for our platform

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

const normalizeDomain = (domain: string) => {
  const trimmed = domain.trim().toLowerCase();
  const withoutProtocol = trimmed.replace(/^https?:\/\//, "");
  return withoutProtocol.split("/")[0] ?? "";
};

const isValidProductionDomain = (domain: string) => {
  // Allow custom domains but validate format
  return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9-]+)*$/.test(domain);
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;

  if (!(await assertProjectAccess(req, projectId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let requestedDomain = "";
  try {
    const payload = (await req.json()) as { domain?: string };
    requestedDomain = payload?.domain ?? "";
  } catch {
    requestedDomain = "";
  }

  const domain = normalizeDomain(requestedDomain);
  if (!domain || !isValidProductionDomain(domain)) {
    return NextResponse.json(
      { error: "Domain must be a valid hostname" },
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

  const nextMetadata = await setRepoProductionDomain(projectId, metadata, domain);

  return NextResponse.json({
    productionDomain: nextMetadata.productionDomain,
    productionDeploymentId: nextMetadata.productionDeploymentId,
  });
}
