"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Zap, Shield, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const router = useRouter();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      // In a real integration, this would call the API to create a project
      // For now, we'll redirect to the dashboard with the prompt as a query param
      router.push(`/dashboard/projects/new?prompt=${encodeURIComponent(prompt)}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="size-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl tracking-tight">Adorable AI</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <Link href="/dashboard/projects" className="hover:text-foreground transition-colors">Projects</Link>
            <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
            <Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/signin">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center pt-32 pb-20 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl w-full text-center space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <Sparkles className="size-3" />
            <span>Now in Public Beta</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground leading-tight">
            Build software with <br />
            <span className="text-primary italic">autonomous agents</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Create full-stack applications, websites, and backend services by simply describing what you want. Adorable AI handles the rest.
          </p>

          <div className="max-w-3xl mx-auto w-full pt-8">
            <form 
              onSubmit={handleCreate}
              className="relative group p-1.5 bg-background border rounded-2xl shadow-xl focus-within:ring-2 focus-within:ring-primary/20 transition-all"
            >
              <Input
                placeholder="Describe the app you want to build..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="h-14 bg-transparent border-none focus-visible:ring-0 text-lg px-6"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <Button type="submit" size="lg" className="rounded-xl px-8 h-12">
                  Generate
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </div>
            </form>
            <div className="flex flex-wrap justify-center gap-2 mt-4 text-[13px] text-muted-foreground">
              <span>Try:</span>
              {["SaaS Dashboard", "Portfolio with Blog", "AI Chat App", "Inventory Manager"].map((s) => (
                <button 
                  key={s}
                  onClick={() => setPrompt(s)}
                  className="hover:text-primary hover:underline transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Social Proof / Tech Stack */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="mt-32 w-full max-w-5xl border-t pt-12"
        >
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-8">Powered by the best tech stack</p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-40 grayscale">
            <Image src="/next.svg" alt="Next.js" width={100} height={20} />
            <Image src="/vercel.svg" alt="Vercel" width={100} height={20} />
            <Image src="/supabase.svg" alt="Supabase" width={100} height={20} />
            <Image src="/tailwind.svg" alt="Tailwind CSS" width={100} height={20} />
          </div>
        </motion.div>
      </main>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-muted/30 border-t">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <FeatureCard 
              icon={<Zap className="size-6 text-primary" />}
              title="Lightning Fast"
              description="From prompt to production in minutes. No more boilerplate or configuration hell."
            />
            <FeatureCard 
              icon={<Shield className="size-6 text-primary" />}
              title="Secure by Default"
              description="Built-in authentication, database security, and best practices integrated into every app."
            />
            <FeatureCard 
              icon={<Globe className="size-6 text-primary" />}
              title="Global Scale"
              description="Automatically deployed to the edge for zero-latency performance worldwide."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Zap className="size-5 text-primary" />
            <span className="font-bold text-lg">Adorable AI</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 Adorable AI Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="https://github.com/tektile" className="text-muted-foreground hover:text-foreground">
              <GithubIcon className="size-5" />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="space-y-4 p-6 rounded-2xl bg-background border shadow-sm hover:shadow-md transition-all">
      <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}
