import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const PLACEHOLDERS = ["your-project-url-here", "your-anon-key-here", ""];

/**
 * True once real Supabase credentials are present in .env.local.
 * Until then the app runs in a "needs configuration" state instead of
 * crashing on a malformed client.
 */
export const isSupabaseConfigured =
  !!url &&
  !!anonKey &&
  !PLACEHOLDERS.includes(url) &&
  !PLACEHOLDERS.includes(anonKey);

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/** Storage bucket used for issue photos. Create it in Supabase → Storage. */
export const PHOTO_BUCKET = "issue-photos";
