"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { motion } from "framer-motion";
import { Plus, Layout, Sparkles, ArrowRight, Loader2, Code2, Globe } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";

export default function NewProjectPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("blank");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .insert({ name, user_id: user.id })
      .select()
      .single();

    if (error) {
      console.error("Error creating project:", error);
      alert("Failed to create project");
      setLoading(false);
    } else if (data) {
      router.push(`/project/${data.id}`);
    }
  };

  const templates = [
    { id: "blank", name: "Blank Slate", description: "Start with a clean canvas and a blank sandbox.", icon: <Layout className="w-5 h-5" /> },
    { id: "nextjs", name: "Next.js App", description: "Full-stack framework with App Router and Tailwind.", icon: <Code2 className="w-5 h-5" /> },
    { id: "landing", name: "Landing Page", description: "High-conversion glossy landing page template.", icon: <Globe className="w-5 h-5" /> },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-12 space-y-12">
        <div className="text-center space-y-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary border border-primary/20 mx-auto"
          >
            <Sparkles className="w-8 h-8" />
          </motion.div>
          <h1 className="text-4xl font-bold tracking-tight">Create New Project</h1>
          <p className="text-white/40 max-w-md mx-auto">
            Initialize a secure sandbox and start orchestrating your autonomous AI agent.
          </p>
        </div>

        <form onSubmit={handleCreate} className="space-y-12">
          {/* Project Name */}
          <div className="glass-dark p-8 rounded-3xl border border-white/5 space-y-6 shadow-2xl shadow-primary/5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">Project Name</label>
              <input 
                type="text" 
                placeholder="My Awesome App"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-lg font-bold focus:outline-none focus:border-primary/50 transition-all placeholder:text-white/10"
                required
                autoFocus
              />
            </div>
          </div>

          {/* Template Selection */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest ml-1">Select Template</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`p-6 rounded-3xl border transition-all text-left space-y-4 group ${
                    selectedTemplate === template.id 
                    ? "bg-primary/10 border-primary/40 shadow-lg shadow-primary/5" 
                    : "bg-white/5 border-white/5 hover:border-white/10"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    selectedTemplate === template.id ? "bg-primary text-white" : "bg-white/5 text-white/40 group-hover:text-white/60"
                  }`}>
                    {template.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{template.name}</h4>
                    <p className="text-xs text-white/40 mt-1 leading-relaxed">{template.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center pt-8">
            <button 
              type="submit"
              disabled={loading || !name}
              className="px-12 py-4 bg-white text-black font-bold rounded-2xl hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-2xl shadow-white/10 flex items-center gap-3 text-lg"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <>
                  Initialize Workspace
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
