import { createBrowserClient } from "@supabase/ssr"

// Unified entry point for Supabase (Browser Safe)
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export * from "./client"
// DO NOT export server or middleware here to avoid leaking next/headers to client components
