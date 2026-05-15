"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { 
  ChevronLeft, ChevronRight, Layout, Settings, Activity, 
  MessageSquare, Globe, Cpu, Clock, Calendar,
  ArrowRight, PlayCircle, ExternalLink, Box
} from "lucide-react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function ProjectDetailsPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { user } = useAuth();
  const router = useRouter();
  
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && projectId) {
      fetchProject();
    }
  }, [user, projectId]);

  const fetchProject = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();
    
    if (error) {
      console.error("Error fetching project:", error);
      router.push("/dashboard/projects");
    } else {
      setProject(data);
    }
    setLoading(false);
  };

  if (loading) return (
    <DashboardLayout>
      <div className="h-64 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </DashboardLayout>
  );

  if (!project) return null;

  const conversations = (project.adorable_conversations as any[]) || [];
  const status = project.deployment_status || "IDLE";

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <Link 
              href="/dashboard/projects" 
              className="flex items-center gap-2 text-xs font-bold text-white/40 hover:text-white transition-colors uppercase tracking-widest group"
            >
              <ChevronLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
              Back to Projects
            </Link>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center border border-white/10 shadow-2xl">
                <Box className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-black uppercase tracking-tighter">{project.name}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-white/40 text-sm font-medium flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Created {new Date(project.created_at).toLocaleDateString()}
                  </span>
                  <div className="w-1 h-1 bg-white/10 rounded-full" />
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                    status === "LIVE" ? "text-emerald-400 border-emerald-400/20 bg-emerald-400/10" : "text-white/40 border-white/10 bg-white/5"
                  )}>
                    {status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-3 rounded-2xl border border-white/5 bg-white/2 hover:bg-white/5 text-white/40 hover:text-white transition-all">
              <Settings className="w-5 h-5" />
            </button>
            <Link 
              href={`/project/${project.id}`}
              className="px-8 py-3 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 transition-all flex items-center gap-3 shadow-2xl shadow-primary/20 text-lg group"
            >
              <PlayCircle className="w-5 h-5" />
              Open Workspace
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Grid Stats/Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            icon={<MessageSquare className="text-blue-400" />} 
            label="Conversations" 
            value={conversations.length.toString()} 
            subValue="Active traces" 
          />
          <StatCard 
            icon={<Globe className="text-emerald-400" />} 
            label="Deployments" 
            value={project.deployment_url ? "1" : "0"} 
            subValue={project.deployment_url ? "Production Live" : "Not deployed"} 
          />
          <StatCard 
            icon={<Cpu className="text-amber-400" />} 
            label="Platform" 
            value="E2B" 
            subValue="Hyper-isolated Sandbox" 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            <div className="glass-dark rounded-3xl border border-white/5 overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/2">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Recent Conversations
                </h3>
              </div>
              <div className="divide-y divide-white/5">
                {conversations.length > 0 ? conversations.map((conv: any) => (
                  <Link 
                    key={conv.id}
                    href={`/project/${projectId}/${conv.id}`}
                    className="flex items-center justify-between px-6 py-4 hover:bg-white/2 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <MessageSquare className="w-5 h-5 text-white/20 group-hover:text-primary transition-colors" />
                      </div>
                      <div>
                        <p className="font-bold text-sm truncate max-w-[200px]">{conv.title}</p>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest">
                          {new Date(conv.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-white transition-colors" />
                  </Link>
                )) : (
                  <div className="px-6 py-12 text-center">
                    <p className="text-white/20 text-sm font-medium italic">No active conversations found.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-8">
            <div className="glass-dark p-6 rounded-3xl border border-white/5 space-y-6">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                Deployment
              </h3>
              
              {project.deployment_url ? (
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Production URL</p>
                    <a 
                      href={project.deployment_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-emerald-400 font-bold text-sm hover:underline flex items-center gap-2"
                    >
                      {project.deployment_url.replace('https://', '')}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <button className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-xs font-bold transition-all border border-white/5">
                    View Logs
                  </button>
                </div>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto">
                    <Activity className="w-6 h-6 text-white/10" />
                  </div>
                  <p className="text-white/40 text-xs font-medium px-4 leading-relaxed">
                    This project hasn't been deployed yet. Launch it from the workspace.
                  </p>
                </div>
              )}
            </div>

            <div className="glass-dark p-6 rounded-3xl border border-white/5 space-y-6 bg-linear-to-br from-primary/5 to-transparent">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Layout className="w-4 h-4 text-primary" />
                Quick Actions
              </h3>
              <div className="space-y-3">
                <QuickActionButton icon={<Settings className="w-4 h-4" />} label="Project Settings" />
                <QuickActionButton icon={<Calendar className="w-4 h-4" />} label="Usage History" />
                <QuickActionButton icon={<Box className="w-4 h-4" />} label="Clone Project" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon, label, value, subValue }: { icon: React.ReactNode, label: string, value: string, subValueText?: string, subValueTextClass?: string, subValue?: string }) {
  return (
    <div className="glass-dark p-6 rounded-3xl border border-white/5 space-y-4 hover:border-white/10 transition-all group">
      <div className="flex items-center justify-between">
        <div className="p-3 bg-white/5 rounded-2xl group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{label}</p>
      </div>
      <div>
        <h4 className="text-3xl font-black group-hover:text-primary transition-colors">{value}</h4>
        <p className="text-xs text-white/40 font-medium mt-1 italic">{subValue}</p>
      </div>
    </div>
  );
}

function QuickActionButton({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <button className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-sm font-medium transition-all border border-white/5 text-white/60 hover:text-white group text-left">
      <span className="group-hover:scale-110 transition-transform">{icon}</span>
      {label}
    </button>
  );
}
