"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, FileCode2, Folder, MoreHorizontal, Search } from "lucide-react";

interface GlassExplorerProps {
  files: Record<string, any>;
  activeFile: string;
  onFileSelect: (path: string) => void;
}

export function GlassExplorer({ files, activeFile, onFileSelect }: GlassExplorerProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const renderTree = (obj: any, name: string, depth = 0, path = "") => {
    const isFile = obj._isFile;
    const fullPath = path ? `${path}/${name}` : name;
    
    if (isFile) {
      const isActive = activeFile === obj.path;
      return (
        <motion.button
          key={obj.path}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => onFileSelect(obj.path)}
          className={`
            w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] transition-all
            ${isActive 
              ? "bg-primary/10 text-white border border-primary/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]" 
              : "text-white/40 hover:text-white/80 hover:bg-white/5"
            }
          `}
          style={{ paddingLeft: `${(depth * 12) + 12}px` }}
        >
          <FileCode2 className={`w-4 h-4 ${isActive ? "text-primary shadow-primary" : "text-white/20"}`} />
          <span className="truncate">{name}</span>
        </motion.button>
      );
    }

    return (
      <FolderNode key={fullPath} name={name} depth={depth}>
        {Object.entries(obj)
          .filter(([key]) => key !== "_isFile" && key !== "path")
          .map(([key, value]) => renderTree(value, key, depth + 1, fullPath))}
      </FolderNode>
    );
  };

  // Build tree logic
  const tree: any = {};
  Object.keys(files).forEach(path => {
    const parts = path.split('/');
    let current = tree;
    parts.forEach((part, i) => {
      if (i === parts.length - 1) {
        current[part] = { _isFile: true, path };
      } else {
        current[part] = current[part] || {};
        current = current[part];
      }
    });
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">Explorer</h2>
          <MoreHorizontal className="w-4 h-4 text-white/20 hover:text-white transition-colors cursor-pointer" />
        </div>
        
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 group-focus-within:text-primary transition-colors" />
          <input 
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/5 rounded-xl py-2 pl-9 pr-4 text-[13px] focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-10 space-y-0.5 custom-scrollbar">
        {Object.entries(tree).map(([key, value]) => renderTree(value, key))}
      </div>
    </div>
  );
}

function FolderNode({ name, children, depth }: { name: string, children: React.ReactNode, depth: number }) {
  const [isOpen, setIsOpen] = useState(depth < 1);

  return (
    <div className="space-y-0.5">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all group"
        style={{ paddingLeft: `${(depth * 12) + 12}px` }}
      >
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight className="w-3.5 h-3.5 text-white/20" />
        </motion.div>
        <Folder className="w-4 h-4 text-secondary/60 group-hover:text-secondary transition-colors" />
        <span>{name}</span>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
