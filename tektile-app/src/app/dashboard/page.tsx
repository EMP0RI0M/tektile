"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { motion } from "framer-motion";
import { Folder, Activity, Zap, ExternalLink, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";

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
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-white/40 mt-1">Welcome back, here's what's happening with your projects.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Total Projects" 
            value={stats.projects} 
            icon={<Folder className="w-5 h-5" />} 
            trend="+2 this week"
          />
          <StatCard 
            title="Deployments" 
            value={stats.deployments} 
            icon={<Zap className="w-5 h-5" />} 
          />
          <StatCard 
            title="Active Sandboxes" 
            value={stats.activeSandboxes} 
            icon={<Activity className="w-5 h-5" />} 
          />
        </div>

        {/* Recent Activity / CTA */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass-dark p-8 rounded-3xl border border-white/5 space-y-6">
            <h3 className="text-xl font-bold">Quick Start</h3>
            <div className="space-y-4">
              <QuickAction 
                title="Create a new Next.js App" 
                description="Start from a template or prompt from scratch."
                href="/dashboard/projects/new"
              />
              <QuickAction 
                title="View Documentation" 
                description="Learn how to orchestrate autonomous agents."
                href="#"
              />
            </div>
          </div>

          <div className="glass-dark p-8 rounded-3xl border border-white/5 flex flex-col items-center justify-center text-center space-y-4 min-h-[300px]">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20">
              <Zap className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold">No active deployments</h3>
            <p className="text-white/40 text-sm max-w-xs">
              Deploy your first project to see real-time performance metrics and logs here.
            </p>
            <Link 
              href="/dashboard/projects"
              className="text-primary text-sm font-bold flex items-center gap-2 hover:gap-3 transition-all"
            >
              View Projects <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ title, value, icon, trend }: { title: string, value: number | string, icon: React.ReactNode, trend?: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass-dark p-6 rounded-2xl border border-white/5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/60">
          {icon}
        </div>
        {trend && <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full">{trend}</span>}
      </div>
      <div>
        <p className="text-sm text-white/40 font-medium">{title}</p>
        <p className="text-3xl font-bold mt-1 tracking-tight">{value}</p>
      </div>
    </motion.div>
  );
}

function QuickAction({ title, description, href }: { title: string, description: string, href: string }) {
  return (
    <Link href={href} className="block group">
      <div className="p-4 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all flex items-center justify-between">
        <div>
          <h4 className="font-bold text-sm group-hover:text-primary transition-colors">{title}</h4>
          <p className="text-xs text-white/40 mt-1">{description}</p>
        </div>
        <ExternalLink className="w-4 h-4 text-white/20 group-hover:text-white transition-colors" />
      </div>
    </Link>
  );
}
