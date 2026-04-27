import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Sandbox } from "https://esm.sh/@e2b/code-interpreter@1.0.1";

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

    const { projectId, filePath } = await req.json();

    // 2. Look up sandbox ID
    const { data: sandboxData, error: sandboxError } = await supabase
      .from("sandboxes")
      .select("sandbox_id")
      .eq("project_id", projectId)
      .single();

    if (sandboxError || !sandboxData) {
      // Fallback for development/demo if E2B is not configured
      if (!e2bApiKey) {
        return new Response(JSON.stringify({ 
          success: true, 
          content: `// DEBUG: No E2B_API_KEY set.\n// Project: ${projectId}\n// File: ${filePath}\n\nexport default function Demo() {\n  return <div>Hello World</div>;\n}` 
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ error: "Sandbox not found for this project. Please send a message first to initialize." }), { status: 404, headers: corsHeaders });
    }

    // 3. Connect to E2B and read file
    const sandbox = await Sandbox.reconnect({
      sandboxID: sandboxData.sandbox_id,
      apiKey: e2bApiKey
    });

    const content = await sandbox.files.read(filePath);

    return new Response(JSON.stringify({ success: true, content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});
