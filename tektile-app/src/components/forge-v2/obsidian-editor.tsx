"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Code2, X, Maximize2, Terminal as TerminalIcon, Globe } from "lucide-react";
import { CodeViewer } from "@/components/code-viewer";
import { TerminalPreview } from "@/components/terminal-preview";

interface ObsidianEditorProps {
  projectId: string;
  activeFile: string;
  activeView: "explorer" | "architecture";
  executionLogStream: string;
  onViewChange: (view: "explorer" | "architecture") => void;
  ArchitectureViewer: React.ComponentType<any>;
  manifestFiles: Record<string, any>;
}

export function ObsidianEditor({
  projectId,
  activeFile,
  activeView,
  executionLogStream,
  ArchitectureViewer,
  manifestFiles
}: ObsidianEditorProps) {
  const fileName = activeFile.split('/').pop() || "";

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-transparent">
      {/* Tab Bar */}
      <div className="h-12 flex items-center bg-black/40 border-b border-white/5 px-4 gap-2 overflow-x-auto no-scrollbar">
        <div className={`
          h-8 flex items-center gap-2 px-4 rounded-xl border border-white/5 transition-all cursor-pointer
          bg-white/[0.08] text-white neo-glow
        `}>
          <Code2 className="w-4 h-4 text-primary" />
          <span className="text-[12px] font-medium whitespace-nowrap">{fileName}</span>
          <X className="w-3.5 h-3.5 text-white/20 hover:text-white transition-colors" />
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 relative overflow-hidden mesh-bg">
        <AnimatePresence mode="wait">
          {activeView === "explorer" ? (
            <motion.div
              key="editor"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute inset-0"
            >
              <CodeViewer projectId={projectId} filePath={activeFile} />
            </motion.div>
          ) : (
            <motion.div
              key="arch"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="absolute inset-0 p-8"
            >
              <div className="h-full w-full glass-panel rounded-3xl p-6 overflow-hidden">
                <ArchitectureViewer files={manifestFiles} projectId={projectId} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Terminal Bar */}
      <div className="absolute bottom-6 left-6 right-6 h-48 glass-panel rounded-2xl p-4 flex flex-col group overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <TerminalIcon className="w-4 h-4 text-white/40" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">E2B Sandbox Console</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] text-green-500/80 font-bold tracking-widest">LIVE</span>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <TerminalPreview executionLogStream={executionLogStream} />
        </div>
      </div>
    </div>
  );
}
