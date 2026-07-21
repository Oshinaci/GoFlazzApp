// Re-export the unified client to avoid Vite-specific import.meta.env crash on Next.js
export { supabase } from "./supabaseClient";
