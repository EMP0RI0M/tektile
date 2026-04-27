import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createConversationInRepo, readRepoMetadata } from "@/lib/orchestrator/repo-storage";

const getAuthorizedProjectClient = async (projectId: string) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  return data ? supabase : null;
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const supabase = await getAuthorizedProjectClient(projectId);

  if (!supabase) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const metadata = await readRepoMetadata(projectId, supabase);
  if (!metadata) {
    return NextResponse.json(
      { error: "Project metadata not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ conversations: metadata.conversations });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;

  let requestedTitle: string | undefined;
  try {
    const payload = (await req.json()) as { title?: string };
    const nextTitle = payload?.title?.trim();
    requestedTitle = nextTitle ? nextTitle : undefined;
  } catch {
    requestedTitle = undefined;
  }

  const supabase = await getAuthorizedProjectClient(projectId);
  if (!supabase) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const metadata = await readRepoMetadata(projectId, supabase);
  if (!metadata) {
    return NextResponse.json(
      { error: "Project metadata not found" },
      { status: 404 },
    );
  }

  const conversationId = randomUUID();
  const next = await createConversationInRepo(
    projectId,
    metadata,
    conversationId,
    requestedTitle,
    supabase
  );

  return NextResponse.json({
    conversationId,
    conversations: next.conversations,
  });
}
