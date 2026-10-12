import { createClient } from "@supabase/supabase-js";

console.log("CREANDO SUPABASE CLIENT");

export const supabase = createClient(
    import.meta.env.VITE_APP_SUPABASE_URL,
    import.meta.env.VITE_APP_SUPABASE_ANON_KEY,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: false,
            detectSessionInUrl: true
        }
    }
);