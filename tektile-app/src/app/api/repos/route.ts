import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Sandbox } from "@e2b/code-interpreter";
import {
  type RepoMetadata,
  createConversationInRepo,
  writeRepoMetadata,
} from "@/lib/orchestrator/repo-storage";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items = projects.map((p) => ({
    id: p.id,
    name: p.name || "Untitled Project",
    metadata: p.adorable_metadata,
  }));

  return NextResponse.json({
    repositories: items,
  });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let requestedName: string | undefined;
  let requestedConversationTitle: string | undefined;
  
  try {
    const payload = await req.json();
    requestedName = payload?.name?.trim();
    requestedConversationTitle = payload?.conversationTitle?.trim();
  } catch {
    // Ignore parse errors
  }

  const inferredName = requestedName || "New Project";

  // 1. Create Project in Supabase
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      name: inferredName,
      user_id: user.id,
      deployment_status: "IDLE"
    })
    .select()
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: projectError?.message || "Failed to create project" }, { status: 500 });
  }

  // 2. Initialize E2B Sandbox
  // Note: We use the base template to ensure a clean slate for the AI
  const sandbox = await Sandbox.create({ 
    template: "base", 
    apiKey: process.env.E2B_API_KEY 
  });
  
  await supabase.from("sandboxes").insert({
    project_id: project.id,
    sandbox_id: sandbox.sandboxId
  });

  const initialMetadata: RepoMetadata = {
    version: 2,
    sourceRepoId: project.id,
    name: inferredName,
    vm: {
      sandboxId: sandbox.sandboxId,
      previewUrl: `https://${sandbox.sandboxId}.e2b.dev`
    },
    conversations: [],
    deployments: [],
    productionDomain: null,
    productionDeploymentId: null,
  };

  await writeRepoMetadata(project.id, initialMetadata, supabase);

  const conversationId = randomUUID();
  const metadata = await createConversationInRepo(
    project.id,
    initialMetadata,
    conversationId,
    requestedConversationTitle,
    supabase
  );

  return NextResponse.json({
    id: project.id,
    metadata,
    conversationId,
  });
}

