/**
 * Supabase Global Configuration Resolver
 * Reads from Vite environment variables (Netlify), localStorage, or hardcoded project defaults.
 */

// Project defaults (can be populated by Admin or environment variables)
export const DEFAULT_SUPABASE_CONFIG = {
  // Read from Netlify Environment Variables (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY)
  supabaseUrl: (import.meta.env.VITE_SUPABASE_URL || '').trim(),
  supabaseAnonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim(),
  useLiveSupabase: true,
};

export function getResolvedSupabaseConfig() {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  // 1. If Netlify / Vite environment variables are present, prefer them for public access
  if (envUrl && envKey) {
    return {
      supabaseUrl: envUrl,
      supabaseAnonKey: envKey,
      useLiveSupabase: true,
      source: 'env' as const,
    };
  }

  // 2. Check localStorage if saved from Admin Dashboard
  try {
    const saved = localStorage.getItem('skills_on_supabase_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.supabaseUrl && parsed.supabaseAnonKey) {
        return {
          supabaseUrl: parsed.supabaseUrl.trim(),
          supabaseAnonKey: parsed.supabaseAnonKey.trim(),
          useLiveSupabase: parsed.useLiveSupabase ?? true,
          source: 'storage' as const,
        };
      }
    }
  } catch (e) {
    console.warn('Error reading saved Supabase config:', e);
  }

  return {
    supabaseUrl: '',
    supabaseAnonKey: '',
    useLiveSupabase: false,
    source: 'none' as const,
  };
}
