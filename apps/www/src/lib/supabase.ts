import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URI;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Missing Supabase environment variables!");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);