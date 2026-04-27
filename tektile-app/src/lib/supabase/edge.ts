import { createClient } from "@supabase/supabase-js";

/**
 * SUPABASE EDGE CLIENT
 * 
 * Specialized client for Next.js Edge Runtime / Middleware.
 * Uses direct environment variables for secure server-side operations.
 */
export function createEdgeClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase Edge Credentials");
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false
    }
  });
}
