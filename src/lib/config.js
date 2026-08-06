// src/lib/config.js

export const config = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
};

if (!config.supabaseUrl || !config.supabaseAnonKey) {
  console.warn(
    "[Vox Orantis] Variáveis do Supabase ainda não configuradas (.env.local)."
  );
}