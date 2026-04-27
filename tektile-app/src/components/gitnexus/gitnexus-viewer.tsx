"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useSigma } from "./useSigma";
import { initParser } from "@/lib/gitnexus/wasm-loader";
import { buildGraphFromFiles } from "@/lib/gitnexus/graph-builder";
import { Loader2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface GitNexusViewerProps {
  files: Record<string, any>;
  projectId: string;
}

export default function GitNexusViewer({ files, projectId }: GitNexusViewerProps) {
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { 
    containerRef, 
    setGraph, 
    zoomIn, 
    zoomOut, 
    resetZoom, 
    isLayoutRunning
  } = useSigma({
    onNodeClick: (id) => console.log('Clicked node:', id),
  });

  const parserRef = useRef<any>(null);

  useEffect(() => {
    async function load() {
      try {
        if (!parserRef.current) {
          const { parser, languages } = await initParser();
          parserRef.current = { parser, languages };
        }
        
        // Extract raw content from manifest files
        const rawFiles: Record<string, string> = {};
        Object.entries(files).forEach(([path, info]) => {
          rawFiles[path] = info.content || "";
        });

        const graph = await buildGraphFromFiles(
          rawFiles, 
          parserRef.current.parser, 
          parserRef.current.languages
        );
        
        setGraph(graph);
        setIsInitializing(false);
      } catch (err: any) {
        console.error('[GitNexus] Init error:', err);
        setError(err.message);
        setIsInitializing(false);
      }
    }

    if (Object.keys(files).length > 0) {
      load();
    }
  }, [files, setGraph]);

  return (
    <div className="relative w-full h-full bg-[#0a0a0f] overflow-hidden group rounded-xl border border-white/5">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:radial-gradient(white,transparent)] opacity-10 pointer-events-none" />
      
      {/* Sigma Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Overlay UI */}
      <div className="absolute top-6 left-6 z-20 flex flex-col gap-4">
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl">
          <div className="flex items-center gap-3 mb-1">
            <div className="size-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--primary)]" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Relational Intel</h3>
          </div>
          <p className="text-[9px] font-mono text-white/30 uppercase tracking-wider">Zero-Server WASM Engine</p>
        </div>

        <div className="flex flex-col gap-2 p-1 bg-black/40 backdrop-blur-lg border border-white/5 rounded-xl">
           <button className="p-2 rounded-lg hover:bg-white/10 text-white/60 transition-colors" onClick={zoomIn}>
             <ZoomIn className="size-4" />
           </button>
           <button className="p-2 rounded-lg hover:bg-white/10 text-white/60 transition-colors" onClick={zoomOut}>
             <ZoomOut className="size-4" />
           </button>
           <button className="p-2 rounded-lg hover:bg-white/10 text-white/60 transition-colors" onClick={resetZoom}>
             <RotateCcw className="size-4" />
           </button>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="absolute bottom-6 right-6 z-20 flex items-center gap-4">
        {isLayoutRunning && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
            <Loader2 className="size-3 animate-spin text-primary" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-primary/80">Optimizing Topology</span>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isInitializing && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#0a0a0f]/80 backdrop-blur-sm">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
            <Loader2 className="size-12 animate-spin text-primary relative z-10" />
          </div>
          <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.4em] text-white/40 animate-pulse">Synthesis Phase: Relational Mapping</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-red-950/20 backdrop-blur-md">
           <div className="p-6 bg-black/80 border border-red-500/50 rounded-2xl max-w-md text-center">
              <h4 className="text-red-500 font-bold uppercase text-[11px] mb-2 tracking-widest">WASM Execution Fault</h4>
              <p className="text-white/60 text-[10px] font-mono leading-relaxed">{error}</p>
              <button className="mt-4 px-4 py-2 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-500 text-[9px] uppercase tracking-widest rounded-lg transition-colors" onClick={() => window.location.reload()}>
                 Retry Neural Link
              </button>
           </div>
        </div>
      )}
    </div>
  );
}
