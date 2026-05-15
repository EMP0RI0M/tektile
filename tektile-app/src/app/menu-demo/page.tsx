"use client";

import AppMenuBar from "@/components/ui/app-menu-bar";

export default function MenuDemoPage() {
  return (
    <div className="p-6 h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-slate-800">Menu Bar Integration</h1>
        <p className="text-slate-500 text-sm">
          Successfully integrated the shadcn-style menubar with custom application logic.
        </p>
        <AppMenuBar />
        
        <div className="mt-12 p-12 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-4 text-slate-400">
           <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center">
              <span className="text-2xl font-bold">🎯</span>
           </div>
           <p className="font-medium text-sm">Workspace Preview Area</p>
        </div>
      </div>
    </div>
  );
}
