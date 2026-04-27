"use client";

import { useAuth } from "@/hooks/use-auth";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Files, Search, GitBranch, Activity, 
  Settings, Share, CheckCircle2, Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

// New UI Components
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { FileExplorer } from "@/components/new-ui/file-explorer";
import { V2TopNav } from "@/components/forge-v2/top-nav";
import { CommandCenter } from "@/components/forge-v2/command-center";
import { FileCollection } from "@/types/new-ui";

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
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<"explorer" | "architecture">("explorer");
  const [manifest, setManifest] = useState<{ files: FileCollection }>({ files: {} });

  const [initialMessages, setInitialMessages] = useState<any[]>([]);
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
        setMessagesLoading(false);
      }
    }
  }, [user, authLoading, projectId, conversationId, router]);

  const fetchProject = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();
    
    if (error) {
      console.error("Error fetching project:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        projectId
      });
      router.push("/dashboard/projects");
    } else {
      setProject(data);
    }
    setLoading(false);
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
      // We need to convert the manifest files to FileCollection if they aren't already
      // The current FileExplorer expects content in the value, but manifest might only have metadata
      // For now, we'll assume manifest.files is Record<string, string> or handle it accordingly
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

      if (error) {
        console.error("Error fetching messages:", error);
      } else if (data) {
        const formattedMessages = data.map(m => {
          let extractedContent = m.content;
          if (Array.isArray(m.content)) {
            const textPart = m.content.find((part: any) => part.type === "text");
            extractedContent = textPart ? textPart.text : JSON.stringify(m.content);
          } else if (typeof m.content === "object" && m.content !== null) {
            extractedContent = m.content.text || JSON.stringify(m.content);
          }
          return {
            id: m.id,
            role: m.role.toLowerCase(),
            content: extractedContent,
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
      {/* Top Navigation */}
      <V2TopNav projectName={project?.name || "Initializing..."} onDeploy={() => {}} />

      {/* Main Workspace Area */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          
          {/* Left Panel: Explorer or Architecture */}
          <ResizablePanel defaultSize={75} minSize={30}>
            <div className="h-full flex flex-col overflow-hidden border-r">
              <div className="h-10 border-b flex items-center px-4 bg-muted/30 gap-4">
                <button 
                  onClick={() => setActiveView("explorer")}
                  className={`text-xs font-bold uppercase tracking-widest transition-colors ${activeView === "explorer" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Files
                </button>
                <button 
                  onClick={() => setActiveView("architecture")}
                  className={`text-xs font-bold uppercase tracking-widest transition-colors ${activeView === "architecture" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Architecture
                </button>
              </div>
              
              <div className="flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                  {activeView === "explorer" ? (
                    <motion.div
                      key="explorer"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full"
                    >
                      <FileExplorer files={manifest.files} />
                    </motion.div>
                  ) : (
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
                </AnimatePresence>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Panel: AI Command Center */}
          <ResizablePanel defaultSize={25} minSize={20}>
            <div className="h-full bg-sidebar border-l">
              {!messagesLoading && (
                <CommandCenter 
                  projectId={projectId}
                  conversationId={conversationId}
                  initialMessages={initialMessages}
                  onClose={() => {}} // In a resizable layout, close might mean collapsing the panel
                  onConversationChange={(pid, cid) => router.push(`/project/${pid}/${cid}`)}
                />
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Subtle Bottom Bar */}
      <div className="h-6 border-t bg-muted/50 flex items-center justify-between px-4 text-[10px] text-muted-foreground font-medium">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="size-2 rounded-full bg-emerald-500" />
            <span>Connected to Edge Runtime</span>
          </div>
          <span>v2.4.0-stable</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="uppercase tracking-widest">Adorable AI Cloud</span>
        </div>
      </div>
    </div>
  );
}
