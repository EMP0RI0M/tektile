"use client";

import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { 
  LayoutDashboard, 
  FolderRoot, 
  Cpu, 
  CreditCard, 
  Settings, 
  LogOut, 
  Zap, 
  Plus,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Bell,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/signin");
    }
  }, [user, loading, router]);

  if (loading || !user) return (
    <div className="h-screen w-full flex items-center justify-center bg-[#0a0a0b]">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="size-10 border-4 border-primary border-t-transparent rounded-full shadow-[0_0_20px_rgba(59,130,246,0.3)]"
      />
    </div>
  );

  const navItems = [
    { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
    { icon: FolderRoot, label: "Projects", href: "/dashboard/projects" },
    { icon: Cpu, label: "Deployments", href: "/dashboard/deployments" },
    { icon: CreditCard, label: "Billing", href: "/dashboard/billing" },
    { icon: Settings, label: "Settings", href: "/dashboard/settings" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0b] text-white selection:bg-primary/30">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isCollapsed ? 80 : 280 }}
        className="relative border-r border-white/5 flex flex-col bg-[#0d0d0f] z-50 group shrink-0"
      >
        {/* Toggle Button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-12 size-6 rounded-full bg-[#1a1a1c] border border-white/10 flex items-center justify-center hover:bg-primary transition-colors z-50 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {isCollapsed ? <ChevronRight className="size-3" /> : <ChevronLeft className="size-3" />}
        </button>

        {/* Logo */}
        <div className="h-20 flex items-center px-6 mb-4">
          <Link href="/dashboard" className="flex items-center gap-3 group/logo">
            <div className="size-10 bg-primary rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.4)] group-hover/logo:scale-110 transition-transform duration-300">
              <Zap className="size-6 text-primary-foreground fill-current" />
            </div>
            {!isCollapsed && (
              <motion.span 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="font-black text-xl tracking-tighter uppercase italic"
              >
                Adorable <span className="text-primary">AI</span>
              </motion.span>
            )}
          </Link>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-4 space-y-2">
          <div className="mb-8">
            <Link href="/dashboard/projects/new">
              <Button 
                className={cn(
                  "w-full bg-primary hover:bg-primary/90 text-white font-bold transition-all duration-300 shadow-lg shadow-primary/20",
                  isCollapsed ? "px-0 justify-center h-12" : "justify-start gap-3 h-12 px-4"
                )}
              >
                <Plus className="size-5 shrink-0" />
                {!isCollapsed && <span>New Project</span>}
              </Button>
            </Link>
          </div>

          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex items-center rounded-xl transition-all duration-200 group/nav",
                    isCollapsed ? "justify-center size-12 mx-auto" : "gap-3 px-4 py-3",
                    isActive 
                      ? "text-primary bg-primary/5" 
                      : "text-white/40 hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon className={cn(
                    "size-5 shrink-0 transition-transform duration-200 group-hover/nav:scale-110",
                    isActive ? "text-primary" : "text-current"
                  )} />
                  {!isCollapsed && (
                    <span className="font-bold text-sm tracking-wide">{item.label}</span>
                  )}
                  <AnimatePresence>
                    {isActive && (
                      <>
                        <motion.div 
                          layoutId="activeGlow"
                          className="absolute inset-0 bg-primary/10 rounded-xl blur-md -z-10"
                        />
                        {!isCollapsed && (
                          <motion.div 
                            layoutId="activeIndicator"
                            className="absolute left-0 w-1 h-6 bg-primary rounded-full"
                          />
                        )}
                      </>
                    )}
                  </AnimatePresence>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Profile Section */}
        <div className="p-4 mt-auto border-t border-white/5 space-y-4 bg-[#0a0a0b]/50">
          {!isCollapsed && (
            <div className="flex items-center gap-3 px-2 py-2 rounded-2xl bg-white/5 border border-white/5">
              <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-sm font-black shadow-lg">
                {user.email?.[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black truncate uppercase tracking-widest text-white/90">{user.email?.split('@')[0]}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="size-3 text-primary" />
                  <span className="text-[9px] text-white/30 uppercase font-bold tracking-tighter">Pro Developer</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-1">
            <Button 
              variant="ghost" 
              onClick={() => signOut()}
              className={cn(
                "w-full text-white/40 hover:text-rose-400 hover:bg-rose-400/5 transition-all duration-300 group/logout",
                isCollapsed ? "px-0 justify-center h-12" : "justify-start gap-3 h-11 px-4"
              )}
            >
              <LogOut className="size-5 group-hover/logout:-translate-x-1 transition-transform" />
              {!isCollapsed && <span className="font-bold text-sm">Logout</span>}
            </Button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative custom-scrollbar flex flex-col bg-[#0a0a0b]">
        {/* Top Floating bar */}
        <header className="sticky top-0 z-40 w-full h-20 flex items-center justify-between px-8 bg-[#0a0a0b]/80 backdrop-blur-xl border-b border-white/5 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-white/20 font-bold uppercase tracking-widest text-[10px]">Dashboard</span>
              <span className="text-white/10">/</span>
              <span className="text-white/90 font-black uppercase tracking-tighter text-sm">
                {navItems.find(i => i.href === pathname)?.label || "Overview"}
              </span>
            </div>
            
            <div className="hidden md:flex items-center gap-2 ml-8 px-4 py-2 bg-white/5 rounded-xl border border-white/5 text-white/20 hover:text-white/40 transition-colors cursor-text min-w-[240px]">
              <Search className="size-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Search anything...</span>
              <span className="ml-auto text-[10px] bg-white/5 px-1.5 py-0.5 rounded border border-white/10">⌘K</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="size-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-all relative group">
              <Bell className="size-5 text-white/40 group-hover:text-white transition-colors" />
              <span className="absolute top-2.5 right-2.5 size-2 bg-primary rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
            </button>
            <div className="h-8 w-px bg-white/10 mx-2" />
            <Link href="/dashboard/settings">
              <div className="size-10 rounded-xl overflow-hidden border-2 border-primary/20 hover:border-primary transition-all p-0.5">
                <div className="w-full h-full rounded-lg bg-gradient-to-tr from-primary/20 to-purple-500/20 flex items-center justify-center text-xs font-black">
                  {user.email?.[0].toUpperCase()}
                </div>
              </div>
            </Link>
          </div>
        </header>

        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}
