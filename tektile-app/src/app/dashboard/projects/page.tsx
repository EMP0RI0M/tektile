"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { Plus, Calendar, Search, Filter, Globe, Cpu, CheckCircle2, Loader2, AlertCircle, FolderRoot, ArrowUpRight, Terminal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function ProjectsListPage() {
  const { user } = useAuth();
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
      <div className="space-y-10 pb-20">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em]">
              <FolderRoot className="size-3" />
              Project Registry
            </div>
            <h1 className="text-6xl font-black uppercase tracking-tighter italic italic leading-none">
              Infrastructures
            </h1>
            <p className="text-white/40 max-w-md font-medium text-sm leading-relaxed">
              Orchestrate and monitor your autonomous agent deployments across the global sandbox network.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-white/20 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Search projects..."
                className="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-3.5 text-xs focus:outline-none focus:border-primary/50 transition-all w-64 font-black uppercase tracking-widest placeholder:text-white/10"
              />
            </div>
            <Button variant="outline" className="rounded-2xl h-[52px] w-[52px] p-0 bg-white/5 border-white/10 hover:bg-white/10">
              <Filter className="size-5 text-white/40" />
            </Button>
            <Link href="/dashboard/projects/new">
              <Button className="h-[52px] px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20">
                <Plus className="size-4 mr-2" />
                Initialize New
              </Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 bg-[#0d0d0f] rounded-[32px] border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0d0d0f] p-20 rounded-[48px] border border-white/5 flex flex-col items-center justify-center text-center space-y-8"
          >
            <div className="size-32 bg-primary/5 rounded-[40px] flex items-center justify-center text-primary/20 border border-primary/5 group">
              <FolderRoot className="size-16 group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="space-y-3">
              <h3 className="text-3xl font-black uppercase tracking-tighter">Empty Environment</h3>
              <p className="text-white/40 max-w-sm mx-auto font-medium text-sm leading-relaxed">
                Your registry is currently empty. Synchronize your first repository to begin the orchestration process.
              </p>
            </div>
            <Link href="/dashboard/projects/new">
              <Button className="h-14 px-10 rounded-2xl bg-white text-black hover:bg-primary hover:text-white font-black uppercase tracking-widest text-xs transition-all duration-300">
                <Plus className="size-5 mr-3" />
                Create First Node
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {projects.map((project, index) => (
                <ProjectCard key={project.id} project={project} index={index} />
              ))}
            </AnimatePresence>
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
      case "LIVE": return "text-emerald-400 border-emerald-400/20 bg-emerald-400/5";
      case "BUILDING":
      case "DEPLOYING": return "text-amber-400 border-amber-400/20 bg-amber-400/5";
      case "FAILED": return "text-rose-400 border-rose-400/20 bg-rose-400/5";
      default: return "text-white/40 border-white/10 bg-white/5";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -8 }}
      className="relative group bg-[#0d0d0f] p-8 rounded-[40px] border border-white/5 hover:border-primary/20 transition-all duration-500 overflow-hidden"
    >
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[80px] rounded-full group-hover:bg-primary/20 transition-all duration-500" />
      
      <div className="relative z-10 flex flex-col h-full space-y-8">
        <div className="flex items-start justify-between">
          <div className="size-16 bg-white/5 rounded-3xl flex items-center justify-center border border-white/5 group-hover:border-primary/30 group-hover:bg-primary/5 transition-all duration-500">
            <Terminal className="size-8 text-white/20 group-hover:text-primary transition-colors" />
          </div>
          
          <div className={cn(
            "flex items-center gap-2 px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-[0.2em] shadow-sm backdrop-blur-xl",
            getStatusColor(status)
          )}>
            <div className={cn("size-1.5 rounded-full", 
              status === 'LIVE' ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 
              status === 'FAILED' ? 'bg-rose-400' : 'bg-white/20'
            )} />
            {status}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl font-black uppercase tracking-tighter truncate leading-tight group-hover:text-primary transition-colors">
            {project.name}
          </h3>
          <div className="flex items-center gap-3 text-[10px] font-bold text-white/20 uppercase tracking-widest">
            <Calendar className="size-3" />
            Updated {new Date(project.updated_at || project.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>

        {project.deployment_url ? (
          <a 
            href={project.deployment_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between bg-white/5 hover:bg-emerald-400/10 px-5 py-4 rounded-[20px] text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 transition-all duration-300 border border-white/5 hover:border-emerald-400/20 group/link"
          >
            <div className="flex items-center gap-3">
              <Globe className="size-4" />
              <span>Network Active</span>
            </div>
            <ArrowUpRight className="size-4 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
          </a>
        ) : (
          <div className="h-[52px] flex items-center px-5 rounded-[20px] bg-white/5 border border-white/5 opacity-50">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 italic">Offline Environment</span>
          </div>
        )}

        <div className="flex items-center gap-3 pt-4">
          <Link href={`/dashboard/projects/${project.id}`} className="flex-1">
            <Button variant="ghost" className="w-full h-12 bg-white/5 hover:bg-white/10 rounded-2xl font-black uppercase tracking-widest text-[9px] border border-white/5">
              Parameters
            </Button>
          </Link>
          <Link href={`/project/${project.id}`} className="flex-1">
            <Button className="w-full h-12 bg-primary hover:bg-primary/90 rounded-2xl font-black uppercase tracking-widest text-[9px] shadow-lg shadow-primary/20">
              Launch IDE
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
