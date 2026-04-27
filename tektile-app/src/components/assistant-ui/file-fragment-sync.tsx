"use client";

import { useAuiState } from "@assistant-ui/react";
import { useEffect, useRef } from "react";

export const FileFragmentSync = ({ projectId }: { projectId: string | null }) => {
  const lastMergedTextRef = useRef<string>("");
  
  // Get the last assistant message content
  const lastMessageText = useAuiState(({ thread }) => {
    const messages = thread.messages;
    const lastAssistant = messages.findLast(m => m.role === "assistant");
    if (!lastAssistant) return "";
    
    // assistant-ui message content structure
    const content = (lastAssistant as any).content;
    if (Array.isArray(content)) {
        return content.find(p => p.type === "text")?.text || "";
    }
    return typeof content === "string" ? content : "";
  });

  const isRunning = useAuiState(({ thread }) => thread.isRunning);

  useEffect(() => {
    if (!projectId) return;

    if (lastMessageText && lastMessageText !== lastMergedTextRef.current) {
        const files: Record<string, string> = {};
        const regex = /<file path="([^"]+)">([\s\S]*?)<\/file>/g;
        let match;
        
        while ((match = regex.exec(lastMessageText)) !== null) {
            files[match[1]] = match[2];
        }

        if (Object.keys(files).length > 0) {
            lastMergedTextRef.current = lastMessageText;
            
            console.log(`[FileFragmentSync] Detected ${Object.keys(files).length} files, dispatching update...`);
            
            // Dispatch custom event for ProjectWorkspace to consume
            window.dispatchEvent(
              new CustomEvent("tektile:files-streamed", {
                detail: { 
                    projectId, 
                    files 
                },
              })
            );
        }
    }
  }, [lastMessageText, projectId]);

  return null;
};
