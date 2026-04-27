import { orchestrateForgeAction } from "@/lib/orchestrator/orchestrator";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const { projectId, messages: history, conversationId } = payload;
    
    // Vercel AI SDK sends the latest message as part of the 'messages' array
    const lastMsgObj = history?.[history.length - 1];
    let lastMessage = lastMsgObj?.content;

    // Handle AI SDK's 'parts' structure for multimodal messages
    if (!lastMessage && lastMsgObj?.parts) {
      const textPart = lastMsgObj.parts.find((part: any) => part.type === "text");
      if (textPart && textPart.text) {
        lastMessage = textPart.text;
      }
    }

    if (!lastMessage) {
      return NextResponse.json({ error: "No message provided" }, { status: 400 });
    }

    // 1. Get User Session (Server Side)
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Persistent Storage: Save user message
    await supabase.from("messages").insert({
      project_id: projectId,
      conversation_id: conversationId,
      role: "USER",
      content: typeof lastMessage === 'string' ? lastMessage : JSON.stringify(lastMessage),
      type: "RESULT"
    });

    // 3. Fetch Sandbox ID
    const { data: sandboxData } = await supabase
      .from("sandboxes")
      .select("sandbox_id")
      .eq("project_id", projectId)
      .single();

    // 4. Custom Credentials (from Cookies)
    const jar = await cookies();
    const userApiKey = jar.get("user-api-key")?.value;
    const userProvider = jar.get("user-api-provider")?.value;

    // 5. Execute Forge Intelligence Loop
    const { stream: streamResult, sandbox } = await orchestrateForgeAction({
      prompt: lastMessage,
      projectId,
      history,
      sandboxId: sandboxData?.sandbox_id,
      apiKey: userApiKey,
      providerOverride: userProvider,
      providedSupabase: supabase
    });
    
    // 6. Return streaming response with onFinish hook
    return streamResult.result.toUIMessageStreamResponse({
      onFinish: async (text) => {
        // 1. Save Assistant Response to Database
        await supabase.from("messages").insert({
          project_id: projectId,
          conversation_id: conversationId,
          role: "ASSISTANT",
          content: text,
          type: "RESULT"
        });

        // 2. Sync Sandbox State to Manifest (Persistence)
        const { syncSandboxToManifest } = await import("@/lib/orchestrator/sandbox-sync");
        await syncSandboxToManifest(projectId, sandbox, supabase);
      }
    });

  } catch (error: any) {
    console.error("API ROUTER ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

