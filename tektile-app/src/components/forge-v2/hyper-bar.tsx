"use client";

import React from "react";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface HyperBarItemProps {
  icon: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  title: string;
}

export function HyperBarItem({ icon, active, onClick, title }: HyperBarItemProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={`
              relative p-3 rounded-xl transition-all duration-300 group
              ${active 
                ? "bg-primary/20 text-primary neo-glow" 
                : "text-white/40 hover:text-white/90 hover:bg-white/5"
              }
            `}
          >
            {icon}
            {active && (
              <motion.div
                layoutId="hyperbar-active"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full neo-glow"
              />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="glass-panel border-white/10 text-white font-medium">
          <p>{title}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function HyperBar({ children }: { children: React.ReactNode }) {
  return (
    <aside className="w-16 flex flex-col items-center py-6 gap-6 glass-panel border-r-0 rounded-none z-50">
      {children}
    </aside>
  );
}
