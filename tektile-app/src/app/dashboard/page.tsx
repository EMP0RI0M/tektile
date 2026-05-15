"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { motion } from "framer-motion";
import { FolderRoot, Zap, Activity, ExternalLink, ArrowRight, MousePointer2, Sparkles, Code2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function DashboardOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ projects: 0, deployments: 0, activeSandboxes: 0 });

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    const { count: projectCount } = await supabase
      .from("projects")
      .select("*", { count: "exact", head: true });
    
    setStats({
      projects: projectCount || 0,
      deployments: 0,
      activeSandboxes: 0
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-12 pb-20">
        {/* Welcome Header */}
        <section className="relative overflow-hidden p-10 rounded-[32px] bg-gradient-to-br from-primary/10 via-transparent to-purple-600/10 border border-white/5">
          <div className="relative z-10 space-y-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em]"
            >
              <Sparkles className="size-3" />
              Intelligence Core Active
            </motion.div>
            <h1 className="text-5xl font-black tracking-tighter italic uppercase italic leading-none">
              Welcome back, <span className="text-primary">{user?.email?.split('@')[0]}</span>
            </h1>
            <p className="text-white/40 max-w-lg font-medium">
              Your autonomous infrastructure is running optimally. You have {stats.projects} active project{stats.projects !== 1 ? 's' : ''} currently synchronized with the Adorable Network.
            </p>
          </div>
          
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-from),transparent_70%)] from-primary" />
          </div>
        </section>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Active Infrastructure" 
            value={stats.projects} 
            icon={<FolderRoot className="size-5" />} 
            trend="+2 this week"
            color="primary"
          />
          <StatCard 
            title="Total Deployments" 
            value={stats.deployments} 
            icon={<Zap className="size-5" />} 
            color="purple"
          />
          <StatCard 
            title="Virtual Sandboxes" 
            value={stats.activeSandboxes} 
            icon={<Activity className="size-5" />} 
            color="emerald"
          />
        </div>

        {/* Action Center */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black uppercase tracking-tighter">Command Center</h3>
              <Link href="/dashboard/projects" className="text-xs font-black text-primary uppercase tracking-widest hover:underline">View All</Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <QuickAction 
                title="Synchronize Repository" 
                description="Import your existing GitHub codebase into the sandbox."
                href="/dashboard/projects/new"
                icon={<Code2 className="size-5" />}
              />
              <QuickAction 
                title="Launch New Instance" 
                description="Start a fresh Next.js environment from an AI prompt."
                href="/dashboard/projects/new"
                icon={<MousePointer2 className="size-5" />}
              />
            </div>
          </div>

          <div className="relative group overflow-hidden bg-[#0d0d0f] p-8 rounded-[32px] border border-white/5 flex flex-col items-center justify-center text-center space-y-6">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative size-20 bg-white/5 rounded-[24px] flex items-center justify-center border border-white/10 group-hover:border-primary/50 group-hover:scale-110 transition-all duration-500">
              <Zap className="size-10 text-white/20 group-hover:text-primary transition-colors" />
            </div>
            
            <div className="space-y-2 relative">
              <h3 className="text-xl font-black uppercase tracking-tighter">No Active Bursts</h3>
              <p className="text-white/40 text-xs font-medium max-w-[200px] leading-relaxed">
                Connect your first node to visualize real-time performance bursts and log streams.
              </p>
            </div>

            <Link href="/dashboard/projects" className="relative w-full">
              <Button className="w-full h-12 bg-white/5 hover:bg-primary hover:text-white border border-white/10 hover:border-primary transition-all duration-300 font-black uppercase tracking-widest text-[10px]">
                Initialize Network <ArrowRight className="size-3 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ title, value, icon, trend, color }: { title: string, value: number | string, icon: React.ReactNode, trend?: string, color: 'primary' | 'purple' | 'emerald' }) {
  const colors = {
    primary: 'from-blue-500/20 to-transparent text-blue-400 border-blue-500/10',
    purple: 'from-purple-500/20 to-transparent text-purple-400 border-purple-500/10',
    emerald: 'from-emerald-500/20 to-transparent text-emerald-400 border-emerald-500/10'
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="relative overflow-hidden p-8 rounded-[32px] bg-[#0d0d0f] border border-white/5 group hover:border-white/10 transition-colors"
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500", colors[color])} />
      
      <div className="relative z-10 space-y-6">
        <div className="flex items-center justify-between">
          <div className="size-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-white transition-colors border border-white/5">
            {icon}
          </div>
          {trend && (
            <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full uppercase tracking-widest">
              {trend}
            </span>
          )}
        </div>
        <div>
          <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em]">{title}</p>
          <p className="text-5xl font-black mt-2 tracking-tighter">{value}</p>
        </div>
      </div>
    </motion.div>
  );
}

function QuickAction({ title, description, href, icon }: { title: string, description: string, href: string, icon: React.ReactNode }) {
  return (
    <Link href={href} className="block group">
      <div className="p-6 rounded-[24px] bg-[#0d0d0f] hover:bg-[#121214] border border-white/5 hover:border-primary/20 transition-all duration-300 flex items-center gap-6">
        <div className="size-14 shrink-0 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white/20 group-hover:text-primary group-hover:border-primary/20 transition-all duration-300">
          {icon}
        </div>
        <div className="flex-1">
          <h4 className="font-black text-sm uppercase tracking-tight group-hover:text-white transition-colors">{title}</h4>
          <p className="text-[11px] text-white/30 mt-1 font-medium leading-relaxed">{description}</p>
        </div>
        <ArrowRight className="size-4 text-white/10 group-hover:text-primary group-hover:translate-x-1 transition-all" />
      </div>
    </Link>
  );
}
