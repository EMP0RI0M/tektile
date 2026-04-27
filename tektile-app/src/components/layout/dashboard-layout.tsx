"use client";

import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect } from "react";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/signin");
    }
  }, [user, loading, router]);

  if (loading || !user) return (
    <div className="h-screen w-full flex items-center justify-center">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="size-8 border-2 border-primary border-t-transparent rounded-full"
      />
    </div>
  );

  const navItems = [
    { icon: <Cpu className="size-4" />, label: "Overview", href: "/dashboard" },
    { icon: <Folder className="size-4" />, label: "Projects", href: "/dashboard/projects" },
    { icon: <Activity className="size-4" />, label: "Deployments", href: "/dashboard/deployments" },
    { icon: <CreditCard className="size-4" />, label: "Billing", href: "/dashboard/billing" },
    { icon: <Settings className="size-4" />, label: "Settings", href: "/dashboard/settings" },
  ];

  return (
    <div className="h-screen overflow-y-auto bg-background">
      <div className="p-8 max-w-7xl mx-auto">
        {children}
      </div>
    </div>
  );
}
