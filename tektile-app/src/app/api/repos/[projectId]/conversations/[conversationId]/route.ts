import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { readConversationMessages } from "@/lib/orchestrator/repo-storage";

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

export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string; conversationId: string }> },
) {
  const { projectId, conversationId } = await params;

  if (!(await assertProjectAccess(req, projectId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const messages = await readConversationMessages(projectId, conversationId);
  return NextResponse.json({ messages });
}
