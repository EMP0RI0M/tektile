import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Sandbox } from "https://esm.sh/@e2b/sdk@0.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const e2bApiKey = Deno.env.get("E2B_API_KEY");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Validate Authentication
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { message, projectId } = await req.json();

    // 2. Save Message to Database
    await supabase.from("messages").insert({
      content: message,
      role: "USER",
      project_id: projectId,
      user_id: user.id
    });

    // 3. E2B Sandbox Management
    let sandboxId: string | null = null;
    
    // Check for existing sandbox
    const { data: existingSandbox } = await supabase
      .from("sandboxes")
      .select("sandbox_id")
      .eq("project_id", projectId)
      .single();

    if (existingSandbox) {
      sandboxId = existingSandbox.sandbox_id;
    } else if (e2bApiKey) {
      // Create new sandbox if API key is present
      const sb = await Sandbox.create({
        template: "base",
        apiKey: e2bApiKey
      });
      sandboxId = sb.sandboxID;
      
      await supabase.from("sandboxes").insert({
        project_id: projectId,
        sandbox_id: sandboxId
      });
    }

    // 4. AI Orchestration (Mocking for now)
    // In a real scenario, we would call an LLM here to generate code
    // and then use sandbox.files.write() to save it.
    
    const responseMessage = sandboxId 
      ? `I've initialized your secure E2B sandbox (${sandboxId}). I'm now setting up the file structure based on your request: "${message}"`
      : `I've received your request: "${message}". Please configure your E2B_API_KEY to enable live sandbox execution.`;

    // 5. Save Assistant Response
    const { data: assistantMsg } = await supabase.from("messages").insert({
      content: responseMessage,
      role: "ASSISTANT",
      project_id: projectId,
      user_id: user.id
    }).select().single();

    return new Response(JSON.stringify({ success: true, data: assistantMsg, sandboxId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});
