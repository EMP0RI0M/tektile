import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { WorkspaceFrame } from "@/components/workspace-frame";
import { ApiKeyGate } from "@/components/api-key-gate";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MotionConfig } from "framer-motion";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Adorable AI | Autonomous Engineering",
  description: "Next-generation agentic software engineering environment.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <MotionConfig reducedMotion="user">
              <ApiKeyGate>
                <WorkspaceFrame>
                  <main className="relative flex flex-col min-h-screen max-h-screen overflow-hidden">
                    <div className="absolute inset-0 -z-10 w-full h-full bg-background dark:bg-[radial-gradient(#393e4a_1px,transparent_1px)] bg-[radial-gradient(#dadde2_1px,transparent_1px)] [background-size:16px_16px]" />
                    <Toaster />
                    {children}
                  </main>
                </WorkspaceFrame>
              </ApiKeyGate>
            </MotionConfig>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
