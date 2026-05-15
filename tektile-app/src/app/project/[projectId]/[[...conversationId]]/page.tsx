"use client";

import { useAuth } from "@/hooks/use-auth";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { 
  Files, Search, GitBranch, Activity, 
  Settings, Share, CheckCircle2, Zap, Monitor
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { FileExplorer } from "@/components/new-ui/file-explorer";
import { FileCollection } from "@/types/new-ui";
import { Assistant } from "@/components/assistant";
import { RepoWelcome } from "@/components/assistant-ui/repo-welcome";

const GitNexusViewer = dynamic(() => import("@/components/gitnexus/gitnexus-viewer"), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center text-muted-foreground/20">Loading Architecture...</div>
});

export default function ProjectWorkspace() {
  const params = useParams();
  const projectId = params.projectId as string;
  const conversationId = Array.isArray(params.conversationId) 
    ? params.conversationId[0] 
    : params.conversationId;

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<"explorer" | "architecture" | "preview">("explorer");
  const [manifest, setManifest] = useState<{ files: FileCollection }>({ files: {} });

  const [initialMessages, setInitialMessages] = useState<any[]>([]);
  const previewUrl = project?.adorable_metadata?.vm?.previewUrl;
  const [messagesLoading, setMessagesLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/signin");
    } else if (projectId) {
      fetchProject();
      fetchManifest();
      
      if (conversationId) {
        fetchMessages();
      } else {
        // Try to find the latest conversation for this project
        const findLatestConversation = async () => {
          const { data, error } = await supabase
            .from("messages")
            .select("conversation_id")
            .eq("project_id", projectId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (!error && data?.conversation_id) {
            router.replace(`/project/${projectId}/${data.conversation_id}`);
          } else {
            setMessagesLoading(false);
          }
        };
        findLatestConversation();
      }
    }
  }, [user, authLoading, projectId, conversationId, router]);

  const fetchProject = async () => {
    if (!projectId || projectId === "undefined" || projectId === "null") {
      console.error("Invalid project ID:", projectId);
      router.push("/dashboard/projects");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();
      
      if (error) {
        console.error("Error fetching project:", {
          projectId,
          error: JSON.parse(JSON.stringify(error)), // Force serialize all properties
          raw: error
        });
        router.push("/dashboard/projects");
      } else {
        setProject(data);
      }
    } catch (err) {
      console.error("Unexpected error fetching project:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchManifest = async () => {
    const { data, error } = await supabase
      .from("project_versions")
      .select("manifest")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (!error && data?.manifest) {
      setManifest(data.manifest);
    } else {
      setManifest({ files: {} });
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("project_id", projectId)
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (!error && data) {
        const formattedMessages = data.map(m => {
          let extractedContent = m.content;
          
          // Helper to recursively extract text from potentially complex or stringified content
          const resolveContent = (val: any): string => {
            if (typeof val === "string") {
              const trimmed = val.trim();
              if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
                try {
                  const parsed = JSON.parse(trimmed);
                  // Case 1: Assistant UI / AI SDK Response object
                  if (parsed.responseMessage?.parts) {
                    return parsed.responseMessage.parts
                      .filter((p: any) => p.type === "text")
                      .map((p: any) => p.text)
                      .join("\n");
                  }
                  // Case 2: Simple object with 'text' property
                  if (parsed.text) return parsed.text;
                  // Case 3: Just return stringified version if no clear text field
                  return val;
                } catch (e) {
                  return val;
                }
              }
              return val;
            }
            if (Array.isArray(val)) {
              const textPart = val.find((part: any) => part.type === "text");
              return textPart ? textPart.text : JSON.stringify(val);
            }
            if (typeof val === "object" && val !== null) {
              return val.text || JSON.stringify(val);
            }
            return String(val || "");
          };

          const finalContent = resolveContent(extractedContent);

          return {
            id: m.id,
            role: m.role.toLowerCase(),
            content: finalContent,
            parts: [{ type: "text", text: finalContent }],
            createdAt: new Date(m.created_at),
          };
        });
        setInitialMessages(formattedMessages);
      }
    } catch (e) {
      console.error("Error fetching messages:", e);
    } finally {
      setMessagesLoading(false);
    }
  };

  if (loading || authLoading) return (
    <div className="h-screen w-full flex items-center justify-center">
      <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Header */}
      <header className="h-12 border-b flex items-center justify-between px-4 bg-muted/20 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Zap className="size-5 text-primary fill-primary" />
            <span className="font-bold text-sm tracking-tight">Adorable AI</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <span className="text-sm font-medium text-muted-foreground">{project?.name || "Project"}</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity">
            Deploy
          </button>
          <Settings className="size-4 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" />
        </div>
      </header>

      {/* Main Workspace Area */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          
          {/* Left Panel: AI Chat */}
          <ResizablePanel defaultSize={30} minSize={20}>
            <div className="h-full border-r bg-muted/5">
              {!messagesLoading && (
                <Assistant
                  initialMessages={initialMessages}
                  selectedRepoId={projectId}
                  selectedConversationId={conversationId || ""}
                  welcome={<RepoWelcome />}
                />
              )}
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Panel: Code/Preview Area */}
          <ResizablePanel defaultSize={70} minSize={30}>
            <div className="h-full flex flex-col overflow-hidden">
              <div className="h-10 border-b flex items-center px-4 bg-muted/30 gap-4 shrink-0">
                <button 
                  onClick={() => setActiveView("explorer")}
                  className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${activeView === "explorer" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Files
                </button>
                <button 
                  onClick={() => setActiveView("architecture")}
                  className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${activeView === "architecture" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Architecture
                </button>
                <button 
                  onClick={() => setActiveView("preview")}
                  className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${activeView === "preview" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Preview
                </button>
              </div>
              
              <div className="flex-1 overflow-hidden relative">
                <AnimatePresence mode="wait">
                  {activeView === "explorer" && (
                    <motion.div
                      key="explorer"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full"
                    >
                      <FileExplorer files={manifest.files} />
                    </motion.div>
                  )}
                  {activeView === "architecture" && (
                    <motion.div
                      key="architecture"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.02 }}
                      className="h-full p-8"
                    >
                      <div className="h-full w-full border rounded-3xl overflow-hidden shadow-sm bg-background">
                        <GitNexusViewer files={manifest.files} projectId={projectId} />
                      </div>
                    </motion.div>
                  )}
                  {activeView === "preview" && (
                    <motion.div
                      key="preview"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full"
                    >
                      {previewUrl ? (
                        <iframe 
                          src={previewUrl} 
                          className="h-full w-full border-none"
                          title="App Preview"
                        />
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4">
                          <Monitor className="size-8 opacity-20" />
                          <p className="text-sm">No preview available for this project yet.</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Status Bar */}
      <div className="h-6 border-t bg-muted/50 flex items-center justify-between px-4 text-[10px] text-muted-foreground font-medium shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="size-2 rounded-full bg-emerald-500" />
            <span>Connected to Edge Runtime</span>
          </div>
          <span>v2.4.0-stable</span>
        </div>
        <div className="flex items-center gap-4 uppercase tracking-widest">
          <span>Adorable AI Cloud</span>
        </div>
      </div>
    </div>
  );
}
