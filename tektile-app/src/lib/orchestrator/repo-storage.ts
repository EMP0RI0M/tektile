import { type UIMessage } from "ai";
import { createAdminClient } from "@/lib/supabase/admin";

export type RepoVmMetadata = {
  sandboxId: string;
  previewUrl?: string;
  devCommandTerminalUrl?: string;
  additionalTerminalsUrl?: string;
};

export type RepoConversationSummary = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type RepoDeploymentSummary = {
  commitSha: string;
  commitMessage: string;
  commitDate: string;
  domain: string;
  url: string;
  deploymentId: string | null;
  state: "idle" | "deploying" | "live" | "failed";
};

export type RepoMetadata = {
  version: 2;
  sourceRepoId: string;
  name?: string;
  vm: RepoVmMetadata;
  conversations: RepoConversationSummary[];
  deployments: RepoDeploymentSummary[];
  productionDomain: string | null;
  productionDeploymentId: string | null;
};

export const createConversationInRepo = async (
  projectId: string,
  metadata: RepoMetadata,
  conversationId: string,
  initialTitle?: string,
  providedSupabase?: any,
) => {
  const supabase = providedSupabase || createAdminClient();
  const now = new Date().toISOString();
  
  const { data } = await supabase
    .from("projects")
    .select("adorable_conversations")
    .eq("id", projectId)
    .single();
    
  const conversations = (data?.adorable_conversations as any[]) || [];
  const title = initialTitle || `Conversation ${conversations.length + 1}`;
  
  const newConv = {
    id: conversationId,
    title,
    createdAt: now,
    updatedAt: now,
  };
  
  conversations.unshift(newConv);
  
  const nextMetadata = {
    ...metadata,
    conversations: conversations.map(c => ({
        id: c.id,
        title: c.title,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt
    }))
  };
  
  await supabase
    .from("projects")
    .update({ 
        adorable_conversations: conversations,
        adorable_metadata: nextMetadata
    })
    .eq("id", projectId);
    
  return nextMetadata;
};

export const readRepoMetadata = async (
  projectId: string,
  providedSupabase?: any,
): Promise<RepoMetadata | null> => {
  const supabase = providedSupabase || createAdminClient();
  const { data, error } = await supabase
    .from("projects")
    .select("adorable_metadata")
    .eq("id", projectId)
    .single();

  if (error) {
    console.error(`[RepoStorage] readRepoMetadata error for ${projectId}:`, error);
    return null;
  }
  if (!data?.adorable_metadata) {
    console.error(`[RepoStorage] No adorable_metadata found for ${projectId}.`);
    return null;
  }
  
  let meta = data.adorable_metadata as any;
  
  if (!meta || Object.keys(meta).length === 0) {
    console.warn(`[RepoStorage] adorable_metadata for ${projectId} is empty. Initializing defaults.`);
    meta = {
      version: 2,
      sourceRepoId: projectId,
      vm: { sandboxId: "" },
      conversations: [],
      deployments: [],
      productionDomain: null,
      productionDeploymentId: null
    };
  }

  if (!meta.sourceRepoId) {
    console.warn(`[RepoStorage] adorable_metadata for ${projectId} missing sourceRepoId. Falling back to projectId.`);
    meta.sourceRepoId = projectId;
  }
  
  return meta as RepoMetadata;
};

export const writeRepoMetadata = async (
  projectId: string,
  metadata: RepoMetadata,
  providedSupabase?: any,
) => {
  const supabase = providedSupabase || createAdminClient();
  const { error } = await supabase
    .from("projects")
    .update({ adorable_metadata: metadata })
    .eq("id", projectId);
    
  if (error) {
    console.error(`[RepoStorage] Error writing metadata for ${projectId}:`, error);
    throw error;
  }
};

export const readConversationMessages = async (
  projectId: string,
  conversationId: string,
  providedSupabase?: any,
): Promise<UIMessage[]> => {
  const supabase = providedSupabase || createAdminClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("project_id", projectId)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error(`[RepoStorage] Error reading messages for ${conversationId}:`, error);
    return [];
  }
  
  return (data || []).map(m => ({
    id: m.id,
    role: m.role.toLowerCase() as any,
    content: m.content,
    createdAt: new Date(m.created_at),
    metadata: {
        images: m.images || []
    }
  }));
};

export const saveConversationMessages = async (
  projectId: string,
  metadata: RepoMetadata,
  conversationId: string,
  messages: UIMessage[],
  providedSupabase?: any,
) => {
  const supabase = providedSupabase || createAdminClient();
  const now = new Date().toISOString();

  // 1. Get the latest message (the one we are saving/updating)
  const lastMessage = messages[messages.length - 1];
  if (!lastMessage) return metadata;

  // 2. Upsert the message into the 'messages' table
  // We use the message ID if provided, otherwise the index/timestamp
  const { error: msgError } = await supabase
    .from("messages")
    .upsert({
      id: lastMessage.id || undefined, // Supabase will generate UUID if null
      project_id: projectId,
      conversation_id: conversationId,
      content: typeof lastMessage.content === 'string' ? lastMessage.content : JSON.stringify(lastMessage.content),
      role: lastMessage.role.toUpperCase(),
      type: 'RESULT', // Defaulting to RESULT for now
      images: [], // Images handling can be added later
      updated_at: now
    }, { onConflict: 'id' });

  if (msgError) {
    console.error(`[RepoStorage] Error saving message to 'messages' table:`, msgError);
  }

  // 3. Update the conversation summary in the 'projects' table for the sidebar list
  const { data: projData } = await supabase
    .from("projects")
    .select("adorable_conversations")
    .eq("id", projectId)
    .single();
    
  const conversations = (projData?.adorable_conversations as any[]) || [];
  const existingIndex = conversations.findIndex((c: any) => c.id === conversationId);
  const title = deriveConversationTitle(messages, `Conversation ${conversations.length + 1}`);
  
  const summary = {
    id: conversationId,
    title,
    updatedAt: now,
    createdAt: existingIndex >= 0 ? conversations[existingIndex].createdAt : now,
  };

  if (existingIndex >= 0) {
    conversations[existingIndex] = summary;
  } else {
    conversations.unshift(summary);
  }

  await supabase
    .from("projects")
    .update({ 
        adorable_conversations: conversations,
        adorable_metadata: {
            ...metadata,
            conversations: conversations.map(c => ({
                id: c.id,
                title: c.title,
                createdAt: c.createdAt,
                updatedAt: c.updatedAt
            }))
        }
    })
    .eq("id", projectId);
    
  return metadata;
};

const deriveConversationTitle = (
  messages: UIMessage[] | undefined,
  fallback: string,
): string => {
  if (!Array.isArray(messages) || messages.length === 0) {
    return fallback;
  }

  const userMessage = messages.find((m) => m.role === "user");
  const text = typeof userMessage?.content === 'string' ? userMessage.content : "";
  const clean = text.trim().replace(/\s+/g, " ");
  if (!clean) return fallback;
  return clean.slice(0, 60);
};

export const resolveSourceRepoId = async (projectId: string): Promise<string> => {
    const meta = await readRepoMetadata(projectId);
    return meta?.sourceRepoId || projectId;
};

export const setRepoProductionDomain = async (
    projectId: string,
    metadata: RepoMetadata,
    domain: string
) => {
    const nextMetadata = {
        ...metadata,
        productionDomain: domain
    };
    await writeRepoMetadata(projectId, nextMetadata);
    
    // Also update the main project table for easier querying
    const supabase = createAdminClient();
    await supabase
        .from("projects")
        .update({ deployment_url: `https://${domain}` })
        .eq("id", projectId);
        
    return nextMetadata;
};

export const promoteRepoDeploymentToProduction = async (
    projectId: string,
    metadata: RepoMetadata,
    deploymentId: string
) => {
    const nextMetadata = {
        ...metadata,
        productionDeploymentId: deploymentId
    };
    await writeRepoMetadata(projectId, nextMetadata);
    
    // Update deployment status in main table
    const supabase = createAdminClient();
    await supabase
        .from("projects")
        .update({ 
            deployment_status: "LIVE",
            last_deployed_at: new Date().toISOString()
        })
        .eq("id", projectId);
        
    return nextMetadata;
};
