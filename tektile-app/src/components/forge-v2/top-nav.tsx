"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Globe, Layout, PlayCircle, Settings, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface V2TopNavProps {
  projectName: string;
  onDeploy: () => void;
}

export function V2TopNav({ projectName, onDeploy }: V2TopNavProps) {
  return (
    <header className="h-14 px-6 flex items-center justify-between border-b bg-background z-[100]">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/projects" className="group">
          <div className="size-9 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20 transition-all active:scale-95">
            <Zap className="size-5 text-primary-foreground" />
          </div>
        </Link>
        
        <div className="h-4 w-[1px] bg-border mx-2" />

        <div className="flex items-center gap-2 text-xs font-semibold tracking-tight">
          <span className="text-muted-foreground uppercase text-[10px] tracking-widest">Workspace</span>
          <ChevronRight className="size-3.5 text-muted-foreground/50" />
          <span className="text-foreground font-bold">{projectName}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <Shield className="size-3.5 text-emerald-500" />
          <span className="text-[10px] font-bold text-emerald-600 tracking-widest">SECURE</span>
        </div>

        <Button 
          onClick={onDeploy}
          size="sm"
          className="gap-2 font-bold tracking-tight shadow-md"
        >
          <PlayCircle className="size-4" />
          Deploy
        </Button>

        <Button variant="ghost" size="icon" className="size-9 rounded-lg">
          <Settings className="size-5 text-muted-foreground" />
        </Button>
      </div>
    </header>
  );
}
