"use client";

import { Browser } from "@/components/ui/browser-simulator";

export default function BrowserDemoPage() {
  return (
    <div className="p-12 min-h-screen bg-slate-100 flex flex-col items-center justify-center gap-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Browser Simulator</h1>
        <p className="text-slate-500 max-w-md mx-auto">
          A pixel-perfect browser UI simulator for mockups and documentation.
        </p>
      </div>
      
      <div className="p-8 bg-white rounded-[40px] shadow-2xl border border-white/20">
        <Browser />
      </div>
      
      <div className="flex gap-4 mt-8">
         <div className="px-4 py-2 bg-slate-200 rounded-full text-[10px] font-bold uppercase tracking-widest text-slate-600">Tailwind CSS</div>
         <div className="px-4 py-2 bg-slate-200 rounded-full text-[10px] font-bold uppercase tracking-widest text-slate-600">React</div>
         <div className="px-4 py-2 bg-slate-200 rounded-full text-[10px] font-bold uppercase tracking-widest text-slate-600">TypeScript</div>
      </div>
    </div>
  );
}
