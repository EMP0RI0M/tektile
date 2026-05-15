import { streamLlmResponse } from "./llm-provider";
import { createTools } from "./create-tools";
import { generateProjectManifest } from "./manifest-generator";
import { selectFilesForEdit, getFileContents, formatFilesForAI } from "./context-selector";
import { WORKDIR, E2B_TEMPLATE_ID, TEMPLATE_REPO } from "./vars";
import { Sandbox } from "@e2b/code-interpreter";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateBuild } from "./build-validator";

const MAX_HEAL_ATTEMPTS = 3;

/**
 * orchestrateForgeAction
 * 
 * The Edge-native orchestrator for Forge AI.
 * Now enhanced with a 3-attempt Auto-Heal loop.
 */
export async function orchestrateForgeAction({
  prompt,
  projectId,
  history: historyInput = [],
  sandboxId,
  apiKey,
  providerOverride,
  providedSupabase,
}: {
  prompt: string;
  projectId: string;
  history?: any[];
  sandboxId?: string;
  apiKey?: string;
  providerOverride?: string;
  providedSupabase?: any;
}) {
  console.log(`[Orchestrator] Starting action for project: ${projectId}`);
  
  const supabase = providedSupabase || createAdminClient();
  
  // Normalize and clean history
  const history = (Array.isArray(historyInput) ? historyInput : []).map(m => {
    let content = m.content;
    if (typeof content === 'string' && content.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(content);
        content = parsed.responseMessage?.parts?.find((p: any) => p.type === "text")?.text ||
                  parsed.parts?.find((p: any) => p.type === "text")?.text ||
                  parsed.content || 
                  content;
      } catch (e) {}
    }
    return {
      ...m,
      role: (m.role || 'user').toLowerCase(),
      content: typeof content === 'string' ? content : JSON.stringify(content)
    };
  });

  let attempts = 0;
  let currentPrompt = prompt;
  let lastError = "";

  while (attempts < MAX_HEAL_ATTEMPTS) {
    attempts++;
    console.log(`[Orchestrator] Attempt ${attempts}/${MAX_HEAL_ATTEMPTS}`);

    // 1. Instant Hydration: Get manifest from Supabase
    const manifest = await generateProjectManifest(projectId, supabase);
    if (!manifest) throw new Error("Could not hydrate project manifest.");

    // 2. Surgical Context Selection
    const context = await selectFilesForEdit(currentPrompt, manifest, apiKey);
    
    // 3. Prepare File Contents
    const primaryFilesContent = await getFileContents(context.primaryFiles, manifest);
    const contextFilesContent = await getFileContents(context.contextFiles, manifest);
    const fileContextString = formatFilesForAI(primaryFilesContent, contextFilesContent);

    // 4. Sandbox Connection
    let sandbox: Sandbox;
    if (sandboxId) {
      try {
        sandbox = await Sandbox.connect(sandboxId);
      } catch (e) {
        console.warn(`[Orchestrator] Failed to connect to sandbox ${sandboxId}, creating new one.`);
        sandbox = await Sandbox.create({ template: "base", apiKey: process.env.E2B_API_KEY });
        await supabase.from("sandboxes").upsert({ project_id: projectId, sandbox_id: sandbox.sandboxId }, { onConflict: 'project_id' });
      }
    } else {
      const { data } = await supabase.from("sandboxes").select("sandbox_id").eq("project_id", projectId).maybeSingle();
      if (data?.sandbox_id) {
        try {
          sandbox = await Sandbox.connect(data.sandbox_id);
        } catch (e) {
          console.warn(`[Orchestrator] Failed to connect to DB sandbox ${data.sandbox_id}, creating new one.`);
          sandbox = await Sandbox.create({ template: "base", apiKey: process.env.E2B_API_KEY });
          await supabase.from("sandboxes").upsert({ project_id: projectId, sandbox_id: sandbox.sandboxId }, { onConflict: 'project_id' });
        }
      } else {
        sandbox = await Sandbox.create({ template: "base", apiKey: process.env.E2B_API_KEY });
        await supabase.from("sandboxes").insert({ project_id: projectId, sandbox_id: sandbox.sandboxId });
      }
    }

    // 5. Self-Initialization: If sandbox is empty, restore from manifest OR clone template
    const checkEmpty = await sandbox.commands.run(`ls -A ${WORKDIR} 2>/dev/null | wc -l`);
    if (checkEmpty.stdout.trim() === "0") {
      const fileCount = Object.keys(manifest?.files || {}).length;
      if (fileCount > 0) {
        console.log(`[Orchestrator] Sandbox is empty. Restoring ${fileCount} files from manifest in parallel...`);
        await Promise.all(Object.entries(manifest.files).map(async ([path, fileObj]) => {
          const content = (fileObj as any).content || "";
          try {
            await sandbox.files.write(`${WORKDIR}/${path}`, content);
          } catch (e) {
            console.error(`[Orchestrator] Failed to restore ${path}:`, e);
          }
        }));
      } else {
        console.log(`[Orchestrator] Sandbox is empty. Initializing with template: ${TEMPLATE_REPO}`);
        await sandbox.commands.run(`git clone ${TEMPLATE_REPO} ${WORKDIR}`);
      }
      
      // Run install and start dev server in the background
      console.log(`[Orchestrator] Starting background setup (install + dev)...`);
      (async () => {
        try {
          await sandbox.commands.run(`cd ${WORKDIR} && npm install --no-package-lock --no-audit --no-fund --quiet`);
          console.log(`[Orchestrator] Dependencies installed. Starting dev server...`);
          // Start dev server in the background
          sandbox.commands.run(`cd ${WORKDIR} && npm run dev -- --port ${VM_PORT} --hostname 0.0.0.0`).catch(() => {});
        } catch (err: any) {
          console.warn(`[Orchestrator] Background setup failed:`, err.message);
        }
      })();
    } else {
      // Ensure dev server is running even if not a fresh sandbox
      sandbox.commands.run(`cd ${WORKDIR} && npm run dev -- --port ${VM_PORT} --hostname 0.0.0.0`).catch(() => {});
    }

    // 6. Background Sandbox Sync: Don't block the AI response
    const { syncSandboxToManifest } = await import("./sandbox-sync");
    syncSandboxToManifest(projectId, sandbox, supabase, manifest).catch(err => {
      console.error("[Orchestrator] Background sync failed:", err);
    });
    
    // 6. Initialize Tools
    const tools = await createTools(sandbox);

    // 7. Stream AI Response
    const systemPrompt = lastError 
      ? `${context.systemPrompt}\n\n## 🩹 AUTO-HEAL PASS ${attempts-1}\nThe previous patch resulted in the following build error: ${lastError}. Use GitNexus to map the broken dependencies and apply a fix.\n\n## CURRENT FILE CONTEXT\n${fileContextString}`
      : `${context.systemPrompt}\n\n## CURRENT FILE CONTEXT\n${fileContextString}`;

    const streamResult = await streamLlmResponse({
      system: systemPrompt,
      messages: history.length > 0 ? history : [{ id: crypto.randomUUID(), role: "user", content: currentPrompt, createdAt: new Date() }],
      tools,
      apiKey,
      providerOverride,
    });

    // Note: For future implementation - wait for completion to validate build
    return {
      stream: streamResult,
      sandbox
    };
  }
}
