'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Code2, AlertCircle } from 'lucide-react';

interface CodeViewerProps {
  projectId: string;
  filePath: string;
}

export function CodeViewer({ projectId, filePath }: CodeViewerProps) {
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (projectId && filePath) {
      fetchFileFragment();
    }
  }, [projectId, filePath]);

  const fetchFileFragment = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/files?projectId=${projectId}&filePath=${encodeURIComponent(filePath)}`);
      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Session expired. Please refresh.");
        }
        throw new Error(result.error || 'Failed to fetch file');
      }
      
      if (result.success) {
        setCode(result.content);
      } else {
        setError(result.error || "Failed to fetch file fragment");
      }
    } catch (err: any) {
      console.error("Error fetching file fragment:", err);
      setError(err.message || "Network error fetching file");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="h-full flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
      <p className="text-[10px] font-bold uppercase tracking-widest text-white/20">Fetching fragment...</p>
    </div>
  );

  if (error) return (
    <div className="h-full flex flex-col items-center justify-center space-y-4 text-destructive/60">
      <AlertCircle className="w-8 h-8" />
      <p className="text-xs font-medium">{error}</p>
      <button 
        onClick={fetchFileFragment}
        className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors underline"
      >
        Retry Fetch
      </button>
    </div>
  );

  return (
    <div className="h-full w-full overflow-y-auto p-8 font-mono text-[13px] leading-relaxed custom-scrollbar selection:bg-primary/30">
      <div className="flex gap-4">
        <div className="text-white/10 text-right select-none w-8 border-r border-white/5 pr-4">
          {(code || "").split('\n').map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <pre className="flex-1 text-white/80 whitespace-pre">
          {code || "// No content available"}
        </pre>
      </div>
    </div>
  );
}
