"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, PanelRightClose, Send, Sparkles, User, Zap } from "lucide-react";
import { Assistant } from "@/components/assistant";

interface CommandCenterProps {
  projectId: string;
  conversationId: string;
  initialMessages: any[];
  onClose: () => void;
  onConversationChange: (pid: string, cid: string) => void;
}

export function CommandCenter({ 
  projectId, 
  conversationId, 
  initialMessages, 
  onClose,
  onConversationChange 
}: CommandCenterProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden bg-black/20">
      {/* Header */}
      <div className="h-14 px-6 flex items-center justify-between border-b border-white/5 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
              <Sparkles className="w-4 h-4 text-primary shadow-primary" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-[#111216] shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
          </div>
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-white/90">AI Architect</h2>
            <p className="text-[9px] text-white/40 uppercase tracking-[0.1em]">Intelligence v2.0</p>
          </div>
        </div>
        
        <button 
          onClick={onClose}
          className="p-2 hover:bg-white/5 rounded-xl text-white/40 hover:text-white transition-all group"
        >
          <PanelRightClose className="w-4 h-4 group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* Chat Area - We wrap the existing Assistant logic but with V2 styling injection */}
      <div className="flex-1 overflow-hidden">
        <Assistant 
          initialMessages={initialMessages}
          selectedProjectId={projectId} 
          selectedConversationId={conversationId}
          onActiveConversationChange={onConversationChange}
        />
      </div>
      
      {/* Visual Accents */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[1px] h-32 bg-linear-to-b from-transparent via-primary/50 to-transparent" />
    </div>
  );
}
