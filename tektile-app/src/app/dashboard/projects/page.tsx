"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { Plus, Folder, Calendar, Search, Filter, MoreVertical, ExternalLink, Globe, Cpu, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function ProjectsListPage() {
  const { user, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    setError(null);
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching projects:", error);
      if (error.code === 'PGRST303' || error.message?.includes('JWT expired')) {
        router.push("/signin");
      } else {
        setError(error.message);
      }
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="relative space-y-8">
        {/* Subtle Grid Background */}
        <div className="absolute -inset-8 bg-size-[24px_24px] bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] opacity-50 pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Brutalist Accent from Copy */}
            <div className="h-10 w-4 bg-primary border-2 border-white/20 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]" />
            <div>
              <h1 className="text-4xl font-black uppercase tracking-tighter">Your Projects</h1>
              <p className="text-white/40 mt-1 font-medium text-sm">Manage and orchestrate your agentic applications.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Search projects..."
                className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 transition-all w-64 font-medium"
              />
            </div>
            <button className="p-2.5 rounded-xl border border-white/10 text-white/40 hover:text-white transition-colors bg-white/5">
              <Filter className="w-4 h-4" />
            </button>
            <Link 
              href="/dashboard/projects/new"
              className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
            >
              <Plus className="w-4 h-4" />
              New
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 glass-dark rounded-3xl border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="glass-dark p-12 rounded-3xl border border-white/5 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary border border-primary/20">
              <Folder className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">No projects yet</h3>
              <p className="text-white/40 max-w-sm mx-auto">
                Create your first agentic project to start building autonomous software.
              </p>
            </div>
            <Link 
              href="/dashboard/projects/new"
              className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Project
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function ProjectCard({ project, index }: { project: any, index: number }) {
  const status = project.deployment_status || "IDLE";
  
  const getStatusColor = (s: string) => {
    switch (s) {
      case "LIVE": return "text-emerald-400 border-emerald-400/20 bg-emerald-400/10";
      case "BUILDING":
      case "DEPLOYING": return "text-amber-400 border-amber-400/20 bg-amber-400/10";
      case "FAILED": return "text-rose-400 border-rose-400/20 bg-rose-400/10";
      default: return "text-white/40 border-white/10 bg-white/5";
    }
  };

  const getStatusIcon = (s: string) => {
    switch (s) {
      case "LIVE": return <CheckCircle2 className="w-3 h-3" />;
      case "BUILDING":
      case "DEPLOYING": return <Loader2 className="w-3 h-3 animate-spin" />;
      case "FAILED": return <AlertCircle className="w-3 h-3" />;
      default: return <Cpu className="w-3 h-3" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass-dark p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-all group relative overflow-hidden"
    >
      {/* Animated Glow Backdrop */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full group-hover:bg-primary/10 transition-all" />

      <div className="flex items-start justify-between mb-6 relative z-10">
        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform border border-white/5">
          <Folder className="w-6 h-6 text-white/40 group-hover:text-primary transition-colors" />
        </div>
        
        <div className={cn(
          "flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest backdrop-blur-md shadow-sm",
          getStatusColor(status)
        )}>
          {getStatusIcon(status)}
          {status}
        </div>
      </div>

      <div className="space-y-1 mb-6 relative z-10">
        <h3 className="text-xl font-bold group-hover:text-primary transition-colors truncate">{project.name}</h3>
        <p className="text-xs text-white/40 flex items-center gap-1.5">
          <Calendar className="w-3 h-3" />
          Updated {new Date(project.updated_at || project.created_at).toLocaleDateString()}
        </p>
      </div>

      {project.deployment_url && (
        <a 
          href={project.deployment_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between bg-white/5 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-all border border-white/5 hover:border-emerald-400/20 mb-4 group/link"
        >
          <div className="flex items-center gap-2">
            <Globe className="w-3 h-3" />
            <span>Live Preview</span>
          </div>
          <ExternalLink className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform" />
        </a>
      )}

      <div className="flex items-center gap-2 pt-4 border-t border-white/5 relative z-10">
        <Link 
          href={`/dashboard/projects/${project.id}`}
          className="flex-1 py-2.5 text-center bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-all border border-white/5 hover:border-white/20"
        >
          Manage
        </Link>
        <Link 
          href={`/project/${project.id}`}
          className="flex-1 py-2.5 text-center bg-primary text-white rounded-xl text-xs font-bold transition-all border border-primary/20 hover:bg-primary/90 shadow-lg shadow-primary/10"
        >
          Open IDE
        </Link>
      </div>
    </motion.div>
  );
}
